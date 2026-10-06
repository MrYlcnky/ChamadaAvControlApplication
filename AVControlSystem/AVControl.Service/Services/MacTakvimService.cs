using AutoMapper;
using AVControl.Core.Dtos.MacTakvimDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using System.Globalization;
using System.Text.Json.Nodes;

namespace AVControl.Service.Services
{
    public class MacTakvimService : GenericService<MacTakvim>, IMacTakvimService
    {
        private readonly IMapper _mapper;

        private readonly IGenericRepository<FavoriTakim> _favoriTakimRepo;
        private readonly IGenericRepository<FavoriLig> _favoriLigRepo;
        private readonly IGenericRepository<FavoriTakimLig> _favoriTakimLigRepo;

        public MacTakvimService(
            IGenericRepository<MacTakvim> repository,
            IGenericRepository<FavoriTakim> favoriTakimRepo,
            IGenericRepository<FavoriLig> favoriLigRepo,
            IGenericRepository<FavoriTakimLig> favoriTakimLigRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper)
            : base(repository, unitOfWork)
        {
            _mapper = mapper;

            _favoriTakimRepo = favoriTakimRepo;
            _favoriLigRepo = favoriLigRepo;
            _favoriTakimLigRepo = favoriTakimLigRepo;
        }

        // ============================================================
        // MAÇ VERİLERİNİ SENKRONİZE ET
        // ============================================================

        public async Task VerileriSenkronizeEtAsync(string tarih)
        {
            // 1. Tarih işlemleri:
            // Noktaları slash'a çevir ve doğrula
            if (!string.IsNullOrWhiteSpace(tarih))
            {
                tarih = tarih.Replace(".", "/");
            }

            var hedefTarih = string.IsNullOrWhiteSpace(tarih)
                ? DateTime.Now
                : DateTime.ParseExact(
                    tarih,
                    "dd/MM/yyyy",
                    CultureInfo.InvariantCulture);

            var tarihStr = hedefTarih.ToString(
                "dd/MM/yyyy",
                CultureInfo.InvariantCulture);

            // --------------------------------------------------------
            // 2. HTTP İstemci Ayarları
            // --------------------------------------------------------

            var handler = new HttpClientHandler
            {
                AutomaticDecompression =
                    System.Net.DecompressionMethods.GZip |
                    System.Net.DecompressionMethods.Deflate |
                    System.Net.DecompressionMethods.Brotli
            };

            using var client = new HttpClient(handler);

            client.DefaultRequestHeaders.Add(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/126.0.0.0 Safari/537.36");

            client.DefaultRequestHeaders.Add(
                "Referer",
                "https://arsiv.mackolik.com/Canli-Sonuclar");

            client.DefaultRequestHeaders.Add(
                "Accept",
                "application/json, text/plain, */*");

            client.DefaultRequestHeaders.Add(
                "Cookie",
                "m_site=1;");

            // --------------------------------------------------------
            // 3. Maçları Çek
            // --------------------------------------------------------

            var liveUrl =
                $"https://vd.mackolik.com/livedata?date={Uri.EscapeDataString(tarihStr)}";

            var liveResponse = await client.GetAsync(liveUrl);

            var liveJsonString =
                await liveResponse.Content.ReadAsStringAsync();

            // --------------------------------------------------------
            // 4. TV Kanallarını Çek
            // --------------------------------------------------------

            var tvUrl =
                $"https://arsiv.mackolik.com/livescores/tvprogram.aspx?date={Uri.EscapeDataString(tarihStr)}";

            var tvResponse = await client.GetAsync(tvUrl);

            var tvJsonString =
                await tvResponse.Content.ReadAsStringAsync();

            if (!liveResponse.IsSuccessStatusCode ||
                string.IsNullOrWhiteSpace(liveJsonString))
            {
                return;
            }

            var json = JsonNode.Parse(liveJsonString);

            var tvJson =
                !string.IsNullOrWhiteSpace(tvJsonString)
                    ? JsonNode.Parse(tvJsonString)
                    : null;

            var macDizisi = json?["m"]?.AsArray();

            if (macDizisi == null)
            {
                return;
            }

            // --------------------------------------------------------
            // 5. Maçları DB'ye Yaz / Güncelle
            // --------------------------------------------------------

            foreach (var m in macDizisi)
            {
                string extId = m[0]?.ToString();

                // Kanal Bilgilerini Birleştir
                // 2. veya 3. kanal varsa ekle
                var kanalListesi = new List<string>();

                if (tvJson != null &&
                    tvJson[extId] != null)
                {
                    var kanallar =
                        tvJson[extId]?.AsArray();

                    if (kanallar != null)
                    {
                        foreach (var kanal in kanallar)
                        {
                            string kanalAdi =
                                kanal?[0]?.ToString();

                            if (!string.IsNullOrWhiteSpace(kanalAdi))
                            {
                                kanalListesi.Add(kanalAdi);
                            }
                        }
                    }
                }

                string kanalBilgisi =
                    string.Join(", ", kanalListesi);

                var mevcutMac =
                    (
                        await _repository.KosulaGoreGetirAsync(
                            x => x.ExternalId == extId)
                    )
                    .FirstOrDefault();

                // ----------------------------------------------------
                // Mevcut maç varsa güncelle
                // ----------------------------------------------------

                if (mevcutMac != null)
                {
                    mevcutMac.Skor =
                        $"{m[12]}-{m[13]}";

                    mevcutMac.Durum =
                        !string.IsNullOrWhiteSpace(m[6]?.ToString())
                            ? m[6].ToString()
                            : m[16]?.ToString();

                    mevcutMac.YayinKanali =
                        kanalBilgisi;

                    mevcutMac.MacTarihi =
                        hedefTarih.Date;

                    _repository.Guncelle(mevcutMac);
                }

                // ----------------------------------------------------
                // Maç yoksa yeni ekle
                // ----------------------------------------------------

                else
                {
                    await _repository.EkleAsync(
                        new MacTakvim
                        {
                            ExternalId = extId,

                            EvSahibi =
                                m[2]?.ToString()
                                ?? "Bilinmiyor",

                            Deplasman =
                                m[4]?.ToString()
                                ?? "Bilinmiyor",

                            Skor =
                                $"{m[12]}-{m[13]}",

                            Durum =
                                !string.IsNullOrWhiteSpace(
                                    m[6]?.ToString())
                                    ? m[6].ToString()
                                    : m[16]?.ToString(),

                            LigAdi =
                                m[36]?[1]?.ToString()
                                ?? "Diğer",

                            YayinKanali =
                                kanalBilgisi,

                            MacTarihi =
                                hedefTarih.Date,

                            AktifMi = true
                        });
                }
            }

            await _unitOfWork.KaydetAsync();
        }

        // ============================================================
        // GÜNÜN FAVORİ MAÇLARI
        // ============================================================

        public async Task<IEnumerable<MacTakvim>>
            GununFavoriMaclariniGetirAsync(DateTime tarih)
        {
            // --------------------------------------------------------
            // Günün aktif maçlarını getir
            // --------------------------------------------------------

            var tumMaclar =
                (
                    await _repository.KosulaGoreGetirAsync(
                        m =>
                            m.MacTarihi.Date == tarih.Date &&
                            m.AktifMi)
                )
                .ToList();

            // --------------------------------------------------------
            // Aktif favori takımları getir
            // --------------------------------------------------------

            var favoriTakimlar =
                (
                    await _favoriTakimRepo
                        .KosulaGoreGetirAsync(
                            x => x.AktifMi)
                )
                .ToList();

            // --------------------------------------------------------
            // Takımlara bağlı aktif ligleri getir
            // --------------------------------------------------------

            var favoriTakimLigleri =
                (
                    await _favoriTakimLigRepo
                        .KosulaGoreGetirAsync(
                            x => x.AktifMi)
                )
                .ToList();

            // --------------------------------------------------------
            // Bağımsız favori ligleri getir
            // --------------------------------------------------------

            var favoriLigler =
                (
                    await _favoriLigRepo
                        .KosulaGoreGetirAsync(
                            x => x.AktifMi)
                )
                .ToList();

            // --------------------------------------------------------
            // Filtreleme
            // --------------------------------------------------------

            var sonuc = tumMaclar
                .Where(mac =>
                {
                    var evSahibi =
                        Normalize(mac.EvSahibi);

                    var deplasman =
                        Normalize(mac.Deplasman);

                    var macLigi =
                        Normalize(mac.LigAdi);

                    // =================================================
                    // 1. FAVORİ TAKIM + TAKIMA AİT SEÇİLİ LİG
                    // =================================================

                    var takimLigEslesmesiVarMi =
                        favoriTakimlar.Any(takim =>
                        {
                            var takimAdi =
                                Normalize(takim.TakimAdi);

                            if (string.IsNullOrWhiteSpace(takimAdi))
                            {
                                return false;
                            }

                            // Takım bu maçta oynuyor mu?
                            var takimBuMactaMi =
                                evSahibi.Contains(takimAdi) ||
                                deplasman.Contains(takimAdi);

                            if (!takimBuMactaMi)
                            {
                                return false;
                            }

                            // Bu takıma hangi ligler seçilmiş?
                            var takiminSeciliLigleri =
                                favoriTakimLigleri
                                    .Where(x =>
                                        x.FavoriTakimId ==
                                        takim.Id)
                                    .Select(x =>
                                        Normalize(x.LigAdi))
                                    .Where(x =>
                                        !string.IsNullOrWhiteSpace(x))
                                    .ToList();

                            // Takıma lig seçilmemişse
                            // sadece takım adına bakarak gösterme.
                            if (takiminSeciliLigleri.Count == 0)
                            {
                                return false;
                            }

                            // Maçın ligi,
                            // takım için seçilmiş liglerden biri mi?
                            return takiminSeciliLigleri.Any(
                                seciliLig =>
                                    LigEslesiyor(
                                        macLigi,
                                        seciliLig));
                        });

                    // =================================================
                    // 2. BAĞIMSIZ FAVORİ LİG
                    // =================================================

                    var favoriLigEslesmesiVarMi =
                        favoriLigler.Any(
                            favoriLig =>
                                LigEslesiyor(
                                    macLigi,
                                    Normalize(
                                        favoriLig.LigAdi)));

                    // Takım+Lig eşleşmesi varsa
                    // VEYA
                    // Lig bağımsız favoriyse göster.
                    return takimLigEslesmesiVarMi ||
                           favoriLigEslesmesiVarMi;
                })
                .OrderByDescending(
                    m => m.Durum == "MS")
                .ToList();

            return sonuc;
        }

        // ============================================================
        // DEBUG / TEST
        // ============================================================

        public async Task<IEnumerable<MacTakvimRawDto>>
            GetirCanliVeriDirectAsync(string? tarih = null)
        {
            var handler = new HttpClientHandler
            {
                AutomaticDecompression =
                    System.Net.DecompressionMethods.GZip |
                    System.Net.DecompressionMethods.Deflate |
                    System.Net.DecompressionMethods.Brotli
            };

            using var client =
                new HttpClient(handler);

            client.DefaultRequestHeaders.Add(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 " +
                "(KHTML, like Gecko) " +
                "Chrome/126.0.0.0 Safari/537.36");

            client.DefaultRequestHeaders.Add(
                "Referer",
                "https://arsiv.mackolik.com/Canli-Sonuclar");

            client.DefaultRequestHeaders.Add(
                "Accept",
                "application/json, text/plain, */*");

            client.DefaultRequestHeaders.Add(
                "Accept-Language",
                "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7");

            client.DefaultRequestHeaders.Add(
                "Cookie",
                "m_site=1;");

            var tarihStr =
                string.IsNullOrWhiteSpace(tarih)
                    ? DateTime.Now.ToString(
                        "dd'/'MM'/'yyyy",
                        CultureInfo.InvariantCulture)
                    : tarih;

            var url =
                $"https://vd.mackolik.com/livedata?date={Uri.EscapeDataString(tarihStr)}";

            Console.WriteLine(
                $"[DIRECT-TEST] Tarih: {tarihStr}");

            Console.WriteLine(
                $"[DIRECT-TEST] URL: {url}");

            var response =
                await client.GetAsync(url);

            var jsonString =
                await response.Content
                    .ReadAsStringAsync();

            Console.WriteLine(
                $"[DIRECT-TEST] StatusCode: {response.StatusCode}");

            Console.WriteLine(
                $"[DIRECT-TEST] Content-Length: {jsonString.Length}");

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine(
                    $"[DIRECT-TEST] API hata döndürdü: {response.StatusCode}");

                Console.WriteLine(
                    $"[DIRECT-TEST] Cevap: {jsonString}");

                return new List<MacTakvimRawDto>();
            }

            if (string.IsNullOrWhiteSpace(jsonString))
            {
                Console.WriteLine(
                    "[DIRECT-TEST] API başarılı ama içerik boş döndü.");

                return new List<MacTakvimRawDto>();
            }

            JsonNode? json;

            try
            {
                json =
                    JsonNode.Parse(jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[DIRECT-TEST] JSON parse hatası: {ex.Message}");

                return new List<MacTakvimRawDto>();
            }

            var macDizisi =
                json?["m"]?.AsArray();

            if (macDizisi == null)
            {
                Console.WriteLine(
                    "[DIRECT-TEST] JSON içinde 'm' dizisi bulunamadı.");

                return new List<MacTakvimRawDto>();
            }

            Console.WriteLine(
                $"[DIRECT-TEST] API'den gelen maç sayısı: {macDizisi.Count}");

            var liste =
                new List<MacTakvimRawDto>();

            foreach (var m in macDizisi)
            {
                if (m == null)
                {
                    continue;
                }

                string evSahibi =
                    m[2]?.ToString()
                    ?? "Bilinmiyor";

                string deplasman =
                    m[4]?.ToString()
                    ?? "Bilinmiyor";

                string durumMetni =
                    m[6]?.ToString()
                    ?? "";

                string saat =
                    m[16]?.ToString()
                    ?? "";

                string durum =
                    !string.IsNullOrWhiteSpace(durumMetni)
                        ? durumMetni
                        : saat;

                string evSkor =
                    m[12]?.ToString()
                    ?? "0";

                string depSkor =
                    m[13]?.ToString()
                    ?? "0";

                string ligAdi =
                    "Diğer";

                try
                {
                    ligAdi =
                        m[36]?[1]?.ToString()
                        ?? "Diğer";
                }
                catch
                {
                    ligAdi =
                        "Diğer";
                }

                liste.Add(
                    new MacTakvimRawDto
                    {
                        EvSahibi =
                            evSahibi,

                        Deplasman =
                            deplasman,

                        Skor =
                            $"{evSkor}-{depSkor}",

                        Durum =
                            durum,

                        LigAdi =
                            ligAdi
                    });
            }

            Console.WriteLine(
                $"[DIRECT-TEST] DTO'ya çevrilen maç sayısı: {liste.Count}");

            return liste;
        }

        // ============================================================
        // YARDIMCI METOTLAR
        // ============================================================

        private static string Normalize(string? deger)
        {
            return string.IsNullOrWhiteSpace(deger)
                ? string.Empty
                : deger
                    .Trim()
                    .ToLower(
                        new CultureInfo("tr-TR"));
        }

        private static bool LigEslesiyor(
            string macLigi,
            string seciliLig)
        {
            if (string.IsNullOrWhiteSpace(macLigi) ||
                string.IsNullOrWhiteSpace(seciliLig))
            {
                return false;
            }

            return macLigi.Contains(seciliLig) ||
                   seciliLig.Contains(macLigi);
        }
    }
}