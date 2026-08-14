using AVControl.Core.Entities;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System;
using System.Net.Http.Headers;

namespace AVControl.Service.Services
{
    public class NovastarService
    {
        private readonly HttpClient _httpClient;

        public NovastarService()
        {
            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true,
                ClientCertificateOptions = ClientCertificateOption.Manual,
                SslProtocols = System.Security.Authentication.SslProtocols.Tls12 | System.Security.Authentication.SslProtocols.Tls11
            };
            _httpClient = new HttpClient(handler);
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
            // 🔥 KRİTİK: Bazı Novastar cihazları 'User-Agent' boşsa isteği reddeder.
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        }

        // NovastarService.cs içinde bu metodu güncelle
        public async Task<(bool Success, string Message)> SwitchSourceAsync(LedProcessor led, int targetSource)
        {
            if (led == null || string.IsNullOrEmpty(led.IpAdresi))
                return (false, "LED Processor bilgileri eksik (IP adresi boş).");

            try
            {
                var (token, loginMsg) = await GetTokenAsync(led);
                if (string.IsNullOrEmpty(token))
                    return (false, $"Login Başarısız: {loginMsg}");

                string sourceUrl = $"https://{led.IpAdresi}:{led.Port}/terminal/core/v1/video/source";
                var sourceBody = new { value = targetSource };
                var content = new StringContent(JsonSerializer.Serialize(sourceBody), Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
                _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");

                var response = await _httpClient.PostAsync(sourceUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    return (false, $"Cihaz Kaynak Değişimini Reddetti: {err}");
                }

                return (true, "Başarılı");
            }
            catch (Exception ex)
            {
                return (false, $"Bağlantı Hatası: {ex.GetBaseException().Message}");
            }
        }

        // GetTokenAsync metodunu da şu şekilde güncelle (Tuple döndürecek)
        private async Task<(string? Token, string Message)> GetTokenAsync(LedProcessor led)
        {
            try
            {
                string loginUrl = $"https://{led.IpAdresi}:{led.Port}/terminal/core/v1/login";
                var loginBody = new
                {
                    sn = led.SeriNo ?? "",
                    username = led.KullaniciAdi ?? "admin",
                    password = led.Sifre ?? "123456",
                    clientId = "b3f7044a-c62d-42aa-bcde-a7415c65734c",
                    clientName = "IT-CHGI-01",
                    loginType = 9,
                    source = new { type = 0, platform = 2, platformVersion = "4.0.1" }
                };

                var content = new StringContent(JsonSerializer.Serialize(loginBody), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(loginUrl, content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using JsonDocument doc = JsonDocument.Parse(responseString);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("code", out var code) && code.GetInt32() == 0)
                        return (root.GetProperty("data").GetProperty("token").GetString(), "OK");

                    return (null, $"Cihaz hata kodu döndürdü: {root.GetProperty("message").GetString()}");
                }
                return (null, $"HTTP Hata: {response.StatusCode}");
            }
            catch (Exception ex) { return (null, ex.Message); }
        }
    }
}