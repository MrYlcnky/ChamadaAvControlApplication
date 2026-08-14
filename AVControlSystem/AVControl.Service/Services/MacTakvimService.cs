using AutoMapper;
using AVControl.Core.Dtos.MacTakvimDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using System.Text.Json.Nodes;
using System.Globalization;

namespace AVControl.Service.Services
{
    public class MacTakvimService : GenericService<MacTakvim>, IMacTakvimService
    {
        private readonly IMapper _mapper;
        private readonly IGenericRepository<FavoriTakim> _favoriTakimRepo;
        private readonly IGenericRepository<FavoriLig> _favoriLigRepo;

        public MacTakvimService(
            IGenericRepository<MacTakvim> repository,
            IGenericRepository<FavoriTakim> favoriTakimRepo,
            IGenericRepository<FavoriLig> favoriLigRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper)
            : base(repository, unitOfWork)
        {
            _mapper = mapper;
            _favoriTakimRepo = favoriTakimRepo;
            _favoriLigRepo = favoriLigRepo;
        }

        public async Task VerileriSenkronizeEtAsync(string tarih)
        {
            // 1. Tarih işlemleri: Noktaları slash'a çevir ve doğrula
            if (!string.IsNullOrWhiteSpace(tarih)) tarih = tarih.Replace(".", "/");
            var hedefTarih = string.IsNullOrWhiteSpace(tarih)
                ? DateTime.Now
                : DateTime.ParseExact(tarih, "dd/MM/yyyy", CultureInfo.InvariantCulture);

            var tarihStr = hedefTarih.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

            // 2. HTTP İstemci Ayarları
            var handler = new HttpClientHandler
            {
                AutomaticDecompression = System.Net.DecompressionMethods.GZip |
                                         System.Net.DecompressionMethods.Deflate |
                                         System.Net.DecompressionMethods.Brotli
            };
            using var client = new HttpClient(handler);

            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
            client.DefaultRequestHeaders.Add("Referer", "https://arsiv.mackolik.com/Canli-Sonuclar");
            client.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
            client.DefaultRequestHeaders.Add("Cookie", "m_site=1;");

            // 3. Maçları Çek
            var liveUrl = $"https://vd.mackolik.com/livedata?date={Uri.EscapeDataString(tarihStr)}";
            var liveResponse = await client.GetAsync(liveUrl);
            var liveJsonString = await liveResponse.Content.ReadAsStringAsync();

            // 4. TV Kanallarını Çek
            var tvUrl = $"https://arsiv.mackolik.com/livescores/tvprogram.aspx?date={Uri.EscapeDataString(tarihStr)}";
            var tvResponse = await client.GetAsync(tvUrl);
            var tvJsonString = await tvResponse.Content.ReadAsStringAsync();

            if (!liveResponse.IsSuccessStatusCode || string.IsNullOrWhiteSpace(liveJsonString)) return;

            var json = JsonNode.Parse(liveJsonString);
            var tvJson = !string.IsNullOrWhiteSpace(tvJsonString) ? JsonNode.Parse(tvJsonString) : null;
            var macDizisi = json?["m"]?.AsArray();

            if (macDizisi == null) return;

            foreach (var m in macDizisi)
            {
                string extId = m[0]?.ToString();

                // Kanal Bilgilerini Birleştir (2. veya 3. kanal varsa ekle)
                var kanalListesi = new List<string>();
                if (tvJson != null && tvJson[extId] != null)
                {
                    var kanallar = tvJson[extId]?.AsArray();
                    if (kanallar != null)
                    {
                        foreach (var kanal in kanallar)
                        {
                            string kanalAdi = kanal?[0]?.ToString();
                            if (!string.IsNullOrWhiteSpace(kanalAdi)) kanalListesi.Add(kanalAdi);
                        }
                    }
                }
                string kanalBilgisi = string.Join(", ", kanalListesi);

                var mevcutMac = (await _repository.KosulaGoreGetirAsync(x => x.ExternalId == extId)).FirstOrDefault();

                if (mevcutMac != null)
                {
                    mevcutMac.Skor = $"{m[12]}-{m[13]}";
                    mevcutMac.Durum = !string.IsNullOrWhiteSpace(m[6]?.ToString()) ? m[6].ToString() : m[16]?.ToString();
                    mevcutMac.YayinKanali = kanalBilgisi;
                    mevcutMac.MacTarihi = hedefTarih.Date;
                    _repository.Guncelle(mevcutMac);
                }
                else
                {
                    await _repository.EkleAsync(new MacTakvim
                    {
                        ExternalId = extId,
                        EvSahibi = m[2]?.ToString() ?? "Bilinmiyor",
                        Deplasman = m[4]?.ToString() ?? "Bilinmiyor",
                        Skor = $"{m[12]}-{m[13]}",
                        Durum = !string.IsNullOrWhiteSpace(m[6]?.ToString()) ? m[6].ToString() : m[16]?.ToString(),
                        LigAdi = m[36]?[1]?.ToString() ?? "Diğer",
                        YayinKanali = kanalBilgisi,
                        MacTarihi = hedefTarih.Date,
                        AktifMi = true
                    });
                }
            }
            await _unitOfWork.KaydetAsync();
        }

        // DB'den o güne ait favori maçları filtreleyerek getirir
        public async Task<IEnumerable<MacTakvim>> GununFavoriMaclariniGetirAsync(DateTime tarih)
        {
            var tumMaclar = await _repository.KosulaGoreGetirAsync(m => m.MacTarihi.Date == tarih.Date);

            var favoriTakimlar = (await _favoriTakimRepo.KosulaGoreGetirAsync(x => x.AktifMi)).Select(x => x.TakimAdi.ToLower().Trim()).ToList();
            var favoriLigler = (await _favoriLigRepo.KosulaGoreGetirAsync(x => x.AktifMi)).Select(x => x.LigAdi.ToLower().Trim()).ToList();

            return tumMaclar.Where(m =>
                favoriTakimlar.Any(t => (m.EvSahibi ?? "").ToLower().Contains(t) || (m.Deplasman ?? "").ToLower().Contains(t)) ||
                favoriLigler.Any(l => (m.LigAdi ?? "").ToLower().Contains(l))
            ).OrderByDescending(m => m.Durum == "MS").ToList();
        }

        // Debug/Test için direkt API'den okur
        public async Task<IEnumerable<MacTakvimRawDto>> GetirCanliVeriDirectAsync(string? tarih = null)
        {
            var handler = new HttpClientHandler
            {
                AutomaticDecompression =
                    System.Net.DecompressionMethods.GZip |
                    System.Net.DecompressionMethods.Deflate |
                    System.Net.DecompressionMethods.Brotli
            };

            using var client = new HttpClient(handler);

            client.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");

            client.DefaultRequestHeaders.Add("Referer", "https://arsiv.mackolik.com/Canli-Sonuclar");
            client.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
            client.DefaultRequestHeaders.Add("Accept-Language", "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7");
            client.DefaultRequestHeaders.Add("Cookie", "m_site=1;");

            var tarihStr = string.IsNullOrWhiteSpace(tarih)
                ? DateTime.Now.ToString("dd'/'MM'/'yyyy", System.Globalization.CultureInfo.InvariantCulture)
                : tarih;

            var url = $"https://vd.mackolik.com/livedata?date={Uri.EscapeDataString(tarihStr)}";

            Console.WriteLine($"[DIRECT-TEST] Tarih: {tarihStr}");
            Console.WriteLine($"[DIRECT-TEST] URL: {url}");

            var response = await client.GetAsync(url);
            var jsonString = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"[DIRECT-TEST] StatusCode: {response.StatusCode}");
            Console.WriteLine($"[DIRECT-TEST] Content-Length: {jsonString.Length}");

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[DIRECT-TEST] API hata döndürdü: {response.StatusCode}");
                Console.WriteLine($"[DIRECT-TEST] Cevap: {jsonString}");
                return new List<MacTakvimRawDto>();
            }

            if (string.IsNullOrWhiteSpace(jsonString))
            {
                Console.WriteLine("[DIRECT-TEST] API başarılı ama içerik boş döndü.");
                return new List<MacTakvimRawDto>();
            }

            JsonNode? json;

            try
            {
                json = JsonNode.Parse(jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DIRECT-TEST] JSON parse hatası: {ex.Message}");
                return new List<MacTakvimRawDto>();
            }

            var macDizisi = json?["m"]?.AsArray();

            if (macDizisi == null)
            {
                Console.WriteLine("[DIRECT-TEST] JSON içinde 'm' dizisi bulunamadı.");
                return new List<MacTakvimRawDto>();
            }

            Console.WriteLine($"[DIRECT-TEST] API'den gelen maç sayısı: {macDizisi.Count}");

            var liste = new List<MacTakvimRawDto>();

            foreach (var m in macDizisi)
            {
                if (m == null)
                    continue;

                string evSahibi = m[2]?.ToString() ?? "Bilinmiyor";
                string deplasman = m[4]?.ToString() ?? "Bilinmiyor";

                string durumMetni = m[6]?.ToString() ?? "";
                string saat = m[16]?.ToString() ?? "";

                string durum = !string.IsNullOrWhiteSpace(durumMetni)
                    ? durumMetni
                    : saat;

                string evSkor = m[12]?.ToString() ?? "0";
                string depSkor = m[13]?.ToString() ?? "0";

                string ligAdi = "Diğer";

                try
                {
                    ligAdi = m[36]?[1]?.ToString() ?? "Diğer";
                }
                catch
                {
                    ligAdi = "Diğer";
                }

                liste.Add(new MacTakvimRawDto
                {
                    EvSahibi = evSahibi,
                    Deplasman = deplasman,
                    Skor = $"{evSkor}-{depSkor}",
                    Durum = durum,
                    LigAdi = ligAdi
                });
            }

            Console.WriteLine($"[DIRECT-TEST] DTO'ya çevrilen maç sayısı: {liste.Count}");

            return liste;
        }
    }
}