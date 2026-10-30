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
        private static readonly SemaphoreSlim SyncLock = new(1, 1);
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
            // Worker ve manuel yenileme aynı anda DB güncellemesin.
            await SyncLock.WaitAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(tarih))
                    tarih = tarih.Replace(".", "/");

                var hedefTarih = string.IsNullOrWhiteSpace(tarih)
                    ? DateTime.Now
                    : DateTime.ParseExact(
                        tarih,
                        "dd/MM/yyyy",
                        CultureInfo.InvariantCulture
                    );

                var tarihStr = hedefTarih.ToString(
                    "dd/MM/yyyy",
                    CultureInfo.InvariantCulture
                );

                var handler = new HttpClientHandler
                {
                    AutomaticDecompression =
                        System.Net.DecompressionMethods.GZip |
                        System.Net.DecompressionMethods.Deflate |
                        System.Net.DecompressionMethods.Brotli
                };

                using var client = new HttpClient(handler)
                {
                    Timeout = TimeSpan.FromSeconds(15)
                };

                client.DefaultRequestHeaders.Add(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                    "Chrome/126.0.0.0 Safari/537.36"
                );

                client.DefaultRequestHeaders.Add(
                    "Referer",
                    "https://arsiv.mackolik.com/Canli-Sonuclar"
                );

                client.DefaultRequestHeaders.Add(
                    "Accept",
                    "application/json, text/plain, */*"
                );

                client.DefaultRequestHeaders.Add("Cookie", "m_site=1;");

                var liveUrl =
                    $"https://vd.mackolik.com/livedata?date={Uri.EscapeDataString(tarihStr)}";

                var tvUrl =
                    $"https://arsiv.mackolik.com/livescores/tvprogram.aspx?date={Uri.EscapeDataString(tarihStr)}";

                // Canlı sonuçlar zorunlu.
                using var liveResponse = await client.GetAsync(liveUrl);

                liveResponse.EnsureSuccessStatusCode();

                var liveJsonString =
                    await liveResponse.Content.ReadAsStringAsync();

                if (string.IsNullOrWhiteSpace(liveJsonString))
                    throw new Exception("Maçkolik canlı sonuç verisi boş geldi.");

                var json = JsonNode.Parse(liveJsonString);
                var macDizisi = json?["m"]?.AsArray();

                if (macDizisi == null)
                    throw new Exception("Maçkolik maç listesi bulunamadı.");

                // TV programı isteğe bağlıdır.
                // Bu servis hata verirse mevcut yayın bilgilerini koruyacağız.
                JsonNode? tvJson = null;

                try
                {
                    using var tvResponse = await client.GetAsync(tvUrl);

                    if (tvResponse.IsSuccessStatusCode)
                    {
                        var tvJsonString =
                            await tvResponse.Content.ReadAsStringAsync();

                        if (!string.IsNullOrWhiteSpace(tvJsonString))
                            tvJson = JsonNode.Parse(tvJsonString);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"[MAC TAKVIM] TV programı alınamadı: {ex.Message}"
                    );
                }

                // ========================================================
                // BÜTÜN EXTERNAL ID'LERİ TOPLA
                // ========================================================

                var externalIds = macDizisi
                    .Where(m => m?[0] != null)
                    .Select(m => m![0]!.ToString())
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToArray();

                if (externalIds.Length == 0)
                    return;

                // Her maç için SQL çalıştırmak yerine TEK sorgu.
                var mevcutKayitlar =
                    await _repository.KosulaGoreGetirAsync(
                        x => externalIds.Contains(x.ExternalId)
                    );

                var mevcutMacSozlugu = mevcutKayitlar
                    .GroupBy(x => x.ExternalId)
                    .ToDictionary(
                        group => group.Key,
                        group => group.First()
                    );

                // ========================================================
                // MAÇLARI EKLE VEYA GÜNCELLE
                // ========================================================

                foreach (var m in macDizisi)
                {
                    if (m == null || m[0] == null)
                        continue;

                    string extId = m[0]?.ToString() ?? string.Empty;

                    if (string.IsNullOrWhiteSpace(extId))
                        continue;

                    // Ülke alanını (örn. Türkiye) lig adı olarak kaydetme.
                    // Livedata şeması değişebildiğinden doğrulanmış bir lig
                    // ismi bulamazsak "Diğer" kullanır ve teşhis bilgisi basarız.
                    string ligAdi = LigAdiniOku(m);

                    // GEÇİCİ TEŞHİS: Konsoldaki [LIG DEBUG] satırını paylaş.
                    // Lig dizisinin tamamını gösterir, hiçbir veri değiştirmez.
                    var evAdi = m[2]?.ToString() ?? string.Empty;
                    var depAdi = m[4]?.ToString() ?? string.Empty;

                    if (evAdi.Contains("Galatasaray", StringComparison.OrdinalIgnoreCase) ||
                        depAdi.Contains("Galatasaray", StringComparison.OrdinalIgnoreCase))
                    {
                        Console.WriteLine(
                            $"[LIG DEBUG] {evAdi} - {depAdi} | " +
                            $"m[36]={LigVerisiniYazdir(m)} | " +
                            $"Seçilen lig={ligAdi}"
                        );
                    }

                    var kanalListesi = new List<string>();

                    if (tvJson != null && tvJson[extId] != null)
                    {
                        var kanallar = tvJson[extId]?.AsArray();

                        if (kanallar != null)
                        {
                            foreach (var kanal in kanallar)
                            {
                                string? kanalAdi = kanal?[0]?.ToString();

                                if (!string.IsNullOrWhiteSpace(kanalAdi))
                                    kanalListesi.Add(kanalAdi);
                            }
                        }
                    }

                    string kanalBilgisi = string.Join(", ", kanalListesi);

                    string skor = $"{m[12]}-{m[13]}";

                    string durum =
                        !string.IsNullOrWhiteSpace(m[6]?.ToString())
                            ? m[6]!.ToString()
                            : m[16]?.ToString() ?? string.Empty;

                    mevcutMacSozlugu.TryGetValue(
                        extId,
                        out var mevcutMac
                    );

                    if (mevcutMac != null)
                    {
                        mevcutMac.Skor = skor;
                        mevcutMac.Durum = durum;
                        mevcutMac.MacTarihi = hedefTarih.Date;

                        // Mevcut maçların LigAdi alanını da güncelle.
                        if (ligAdi != "Diğer")
                        {
                            mevcutMac.LigAdi = ligAdi;
                        }
                        else if (string.IsNullOrWhiteSpace(mevcutMac.LigAdi) ||
                                 Normalize(mevcutMac.LigAdi) == "türkiye")
                        {
                            // Eski sürümün yanlışlıkla kaydettiği "Türkiye"
                            // bilgisini doğru lig adıymış gibi bırakma.
                            mevcutMac.LigAdi = "Diğer";
                        }

                        // TV verisi alınamadıysa eski kanal bilgisi silinmesin.
                        if (tvJson != null)
                            mevcutMac.YayinKanali = kanalBilgisi;

                        _repository.Guncelle(mevcutMac);
                    }
                    else
                    {
                        var yeniMac = new MacTakvim
                        {
                            ExternalId = extId,
                            EvSahibi = m[2]?.ToString() ?? "Bilinmiyor",
                            Deplasman = m[4]?.ToString() ?? "Bilinmiyor",
                            Skor = skor,
                            Durum = durum,
                            LigAdi = ligAdi,
                            YayinKanali = kanalBilgisi,
                            MacTarihi = hedefTarih.Date,
                            AktifMi = true
                        };

                        await _repository.EkleAsync(yeniMac);

                        mevcutMacSozlugu[extId] = yeniMac;
                    }
                }

                // Her maç için değil, bütün değişiklikler için bir kez.
                await _unitOfWork.KaydetAsync();
            }
            finally
            {
                SyncLock.Release();
            }
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
                            m.MacTarihi >= tarih.Date && m.MacTarihi < tarih.Date.AddDays(1) && m.AktifMi)
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
                            // Tam eşleşme: Galatasaray, Galatasaray U19 değildir.
                            var takimBuMactaMi =
                                evSahibi == takimAdi ||
                                deplasman == takimAdi;

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

                string ligAdi = LigAdiniOku(m);

                if (evSahibi.Contains("Galatasaray", StringComparison.OrdinalIgnoreCase) ||
                    deplasman.Contains("Galatasaray", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine(
                        $"[LIG DEBUG DIRECT] {evSahibi} - {deplasman} | " +
                        $"m[36]={LigVerisiniYazdir(m)} | " +
                        $"Seçilen lig={ligAdi}"
                    );
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

        // ============================================================
        // LİG ADINI GÜVENLİ OKU / TEŞHİS
        // ============================================================

        private static string LigVerisiniYazdir(JsonNode? mac)
        {
            try
            {
                if (mac is JsonArray dizi && dizi.Count > 36)
                    return dizi[36]?.ToJsonString() ?? "null";
            }
            catch
            {
                // Tanılama başarısız olursa senkronizasyon bozulmasın.
            }

            return "m[36] bulunamadı";
        }

        private static string LigAdiniOku(JsonNode? mac)
        {
            if (mac is not JsonArray macDizisi || macDizisi.Count <= 36)
                return "Diğer";

            var ligVerisi = macDizisi[36];
            var adaylar = new List<string>();

            if (ligVerisi is JsonArray ligDizisi)
            {
                // Eski Maçkolik örneklerinde 9 numaralı indeks "lig"
                // bilgisi için kullanılmıştır; ama bazı sürümlerde
                // kısaltma döner. Bu yüzden tüm alanları inceliyoruz.
                foreach (var parca in ligDizisi)
                {
                    if (parca is JsonValue)
                    {
                        var metin = parca.ToString().Trim();
                        if (LigAdiGibiGorunuyorMu(metin))
                            adaylar.Add(metin);
                    }
                }
            }
            else if (ligVerisi is JsonObject ligNesnesi)
            {
                foreach (var ad in new[]
                {
                    "competitionName", "leagueName", "name", "title", "ligAdi"
                })
                {
                    var metin = ligNesnesi[ad]?.ToString()?.Trim();
                    if (LigAdiGibiGorunuyorMu(metin))
                        adaylar.Add(metin!);
                }
            }

            // Sponsor adı dahil en açıklayıcı tam lig ismini tercih et.
            // Örn. "Trendyol Süper Lig", "Süper Lig" yerine seçilir.
            return adaylar
                .OrderByDescending(x => x.Length)
                .FirstOrDefault() ?? "Diğer";
        }

        private static bool LigAdiGibiGorunuyorMu(string? deger)
        {
            if (string.IsNullOrWhiteSpace(deger))
                return false;

            var metin = Normalize(deger);
            if (metin.Length < 4)
                return false;

            // Salt "Türkiye", "İngiltere" gibi ülke adları lig değildir.
            // Gerçek lig adı tespit edilemezse yanlış kategoriye yazmayız.
            string[] ligIfadeleri =
            {
                "lig", "league", "kupa", "cup", "champion",
                "premier", "serie", "bundesliga", "eredivisie",
                "laliga", "division", "u19", "u21", "elit",
                "conference", "libertadores", "süper", "super"
            };

            return ligIfadeleri.Any(x => metin.Contains(x));
        }

        private static string LigKarsilastirmaAdi(string? ligAdi)
        {
            var ad = Normalize(ligAdi);

            // Aynı yarışmanın sponsorluk / ülke ön ekini normalize et.
            // Bu işlem, "U19" ile "Süper Lig"i birleştirmez.
            bool degisti;
            do
            {
                degisti = false;
                foreach (var onEk in new[]
                {
                    "türkiye ", "turkiye ", "trendyol "
                })
                {
                    if (ad.StartsWith(onEk, StringComparison.Ordinal))
                    {
                        ad = ad[onEk.Length..].Trim();
                        degisti = true;
                    }
                }
            } while (degisti);

            return ad;
        }

        private static bool LigEslesiyor(string macLigi, string seciliLig)
        {
            var mac = LigKarsilastirmaAdi(macLigi);
            var secili = LigKarsilastirmaAdi(seciliLig);

            // Contains kullanma: Süper Lig, U19 Süper Lig değildir.
            return !string.IsNullOrWhiteSpace(mac) &&
                   !string.IsNullOrWhiteSpace(secili) &&
                   string.Equals(mac, secili, StringComparison.Ordinal);
        }
    }
}
