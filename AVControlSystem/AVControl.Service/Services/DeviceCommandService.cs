using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AVControl.Service.Services
{
    public class DeviceCommandService : IDeviceCommandService
    {
        // 1. Gefen Matrix cihazına IP üzerinden bağlanıp Port değiştirme komutu
        public async Task<bool> SwitchMatrixRouteAsync(string matrixIp, int telnetPort, string inputPort, string outputPort)
        {
            try
            {
                // Komut formatı: r {input} {output} 
                string command = $"r {inputPort} {outputPort}";

                using var client = new TcpClient();
                var connectTask = client.ConnectAsync(matrixIp, telnetPort > 0 ? telnetPort : 23);
                if (await Task.WhenAny(connectTask, Task.Delay(2000)) != connectTask)
                {
                    return false; // Cihaza ulaşılamadı (Timeout)
                }

                using var stream = client.GetStream();

                // 1. ÇOK ÖNEMLİ: Cihazın ilk "Welcome" mesajını atlaması ve komut satırına (telnet->) düşmesi için bekliyoruz!
                await ClearInitialBufferAsync(stream);

                // 2. Komutu gönderip cihazın işlediğinden emin olana kadar bekliyoruz.
                string response = await SendCommandAndWaitAsync(stream, command);

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        // 2. Raspberry Pi'ye JSON formatındaki IR kodunu fırlatma komutu
        public async Task<bool> SendIrCommandAsync(string piIpAdresi, string rawDataJson)
        {
            try
            {
                string piUrl = $"http://{piIpAdresi}:5000/api/send-ir";

                using var httpClient = new HttpClient();
                var payload = new { rawDataJson = rawDataJson };
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync(piUrl, content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception)
            {
                return false;
            }
        }

        // 3. Raspberry Pi'den Sinyal Öğrenme
        public async Task<string?> LearnIrCommandAsync(string piIpAdresi)
        {
            try
            {
                string piUrl = $"http://{piIpAdresi}:5000/api/learn-ir";

                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(15);

                var response = await httpClient.GetAsync(piUrl);

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsStringAsync();
                }

                return null;
            }
            catch (TaskCanceledException)
            {
                return null; // 15 saniye doldu
            }
            catch (Exception)
            {
                return null; // Ağ hatası
            }
        }
        // ==============================================================================
        // 4. MATRIX CANLI DURUM SORGULAMA (KESİN VE GARANTİLİ YÖNTEM)
        // ==============================================================================
        public async Task<object> GetMatrixLiveStatusAsync(MatrixDevice device)
        {
            var girisDict = new Dictionary<int, object>();
            var cikisDict = new Dictionary<int, object>();

            // GÜVENLİK: Eğer cihazdan hiç yanıt gelmezse React kilitlenmesin diye varsayılan değerler.
            for (int i = 1; i <= device.InputSayisi; i++)
                girisDict[i] = new { Port = i, GefenIsim = $"INPUT {i}", SinyalVar = true };

            for (int i = 1; i <= device.OutputSayisi; i++)
                cikisDict[i] = new { Port = i, GefenIsim = $"OUTPUT {i}", SinyalVar = true, BagliOlduguGiris = (int?)null };

            try
            {
                using var client = new TcpClient();
                var connectTask = client.ConnectAsync(device.IpAdresi, device.TelnetPort > 0 ? device.TelnetPort : 23);
                if (await Task.WhenAny(connectTask, Task.Delay(2000)) != connectTask)
                    throw new Exception("Matrix cihazına bağlanılamadı (Timeout).");

                using var stream = client.GetStream();
                await ClearInitialBufferAsync(stream);

                // 1. GİRİŞ İSİMLERİ SORGUSU
                for (int i = 1; i <= device.InputSayisi; i++)
                {
                    string res = await SendCommandAndWaitAsync(stream, $"#show_input_name {i}");
                    var match = Regex.Match(res, @"IS:\s*(.*?)(?=\r|\n|telnet)");
                    if (match.Success)
                    {
                        string name = match.Groups[1].Value.Trim();
                        girisDict[i] = new { Port = i, GefenIsim = name, SinyalVar = !name.Equals("BOS", StringComparison.OrdinalIgnoreCase) };
                    }
                }

                // 2. ÇIKIŞ SORGULARI VE EŞLEŞTİRME
                for (int i = 0; i < device.OutputSayisi; i++)
                {
                    int portNum = i + 1;
                    char portLetter = (char)('A' + i);

                    // Çıkış İsim Sorgusu
                    string resName = await SendCommandAndWaitAsync(stream, $"#show_output_name {portLetter}");
                    var matchName = Regex.Match(resName, @"IS:\s*(.*?)(?=\r|\n|telnet)");
                    string name = matchName.Success ? matchName.Groups[1].Value.Trim() : $"OUTPUT {portNum}";

                    // Sinyal (RSense) Sorgusu
                    string resSignal = await SendCommandAndWaitAsync(stream, $"#show_rsense {portLetter}");
                    bool hasSignal = resSignal.Contains("IS HIGH");

                    // 🔥 İŞTE EFSANE ÇÖZÜM: Kendi bulduğumuz net komutla ROUTING bilgisi
                    string resRoute = await SendCommandAndWaitAsync(stream, $"#show_r {portLetter}");
                    // Cihazdan Gelen Yanıt Örneği: "OUTPUT A(BAR USTU) IS ROUTED TO INPUT 1(TV)"

                    int? bagliGiris = null;

                    // Regex sadece "INPUT" yazısını ve sonrasındaki rakamı (Örn: 1) yakalar.
                    var matchRoute = Regex.Match(resRoute, @"INPUT\s+(\d+)", RegexOptions.IgnoreCase);

                    if (matchRoute.Success)
                    {
                        bagliGiris = int.Parse(matchRoute.Groups[1].Value);
                    }

                    cikisDict[portNum] = new
                    {
                        Port = portNum,
                        GefenIsim = name,
                        SinyalVar = hasSignal,
                        BagliOlduguGiris = bagliGiris // Artık burası %100 rakam (Örn: 1 veya 8) dönecek!
                    };
                }

                return new
                {
                    baglantiBasarili = true,
                    girisler = girisDict.Values.ToList(),
                    cikislar = cikisDict.Values.ToList()
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    baglantiBasarili = false,
                    hata = ex.Message,
                    girisler = girisDict.Values.ToList(),
                    cikislar = cikisDict.Values.ToList()
                };
            }
        }

        // ==============================================================================
        // TELNET İLETİŞİM YARDIMCILARI (AKILLI OKUMA)
        // ==============================================================================

        // Cihazın başlangıçtaki "Welcome" mesajlarını okuyup temizler
        private async Task ClearInitialBufferAsync(NetworkStream stream)
        {
            DateTime start = DateTime.Now;
            byte[] buffer = new byte[1024];

            // İlk bağlantıda gelen gereksiz yazıları temizlemek için 1 saniye dinle
            while ((DateTime.Now - start).TotalMilliseconds < 1000)
            {
                if (stream.DataAvailable)
                    await stream.ReadAsync(buffer, 0, buffer.Length);
                else
                    await Task.Delay(50);
            }
        }

        // Komutu gönderir ve Gefen'den "telnet->" yazısını görene kadar okur
        private async Task<string> SendCommandAndWaitAsync(NetworkStream stream, string command)
        {
            byte[] data = Encoding.ASCII.GetBytes(command + "\r\n");
            await stream.WriteAsync(data, 0, data.Length);

            StringBuilder sb = new StringBuilder();
            byte[] buffer = new byte[1024];
            DateTime startTime = DateTime.Now;

            // Her bir komut için Gefen'e maksimum 800 milisaniye süre tanıyoruz
            while ((DateTime.Now - startTime).TotalMilliseconds < 800)
            {
                if (stream.DataAvailable)
                {
                    int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
                    sb.Append(Encoding.ASCII.GetString(buffer, 0, bytesRead));

                    // Cevap bittiyse (telnet-> promptu geldiyse) boşa beklememek için döngüden hemen çık
                    if (sb.ToString().Contains("telnet->"))
                        break;
                }
                else
                {
                    await Task.Delay(20);
                }
            }
            return sb.ToString();
        }
    }
}