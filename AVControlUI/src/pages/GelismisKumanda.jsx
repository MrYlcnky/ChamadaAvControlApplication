import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faBars,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleExclamation,
  faGamepad,
  faMicrochip,
  faPowerOff,
  faRotate,
  faSatelliteDish,
  faSliders,
  faSpinner,
  faVolumeHigh,
  faVolumeLow,
  faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

import irTransmitterService from "../services/irTransmitterService";
import orchestrationService from "../services/orchestrationService";

// Mevcut RemoteButton kayıtlarıyla aynı IR tuş kodları.
const NUMARALAR = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const RENKLER = [
  {
    kod: "RED",
    ad: "Kırmızı",
    cerceve: "border-red-500/70 bg-red-500/15",
    nokta: "bg-red-500 shadow-[0_0_16px_#ef4444]",
  },
  {
    kod: "GREEN",
    ad: "Yeşil",
    cerceve: "border-emerald-400/70 bg-emerald-500/15",
    nokta: "bg-emerald-400 shadow-[0_0_16px_#34d399]",
  },
  {
    kod: "YELLOW",
    ad: "Sarı",
    cerceve: "border-yellow-400/70 bg-yellow-500/15",
    nokta: "bg-yellow-300 shadow-[0_0_16px_#fde047]",
  },
  {
    kod: "BLUE",
    ad: "Mavi",
    cerceve: "border-blue-400/70 bg-blue-500/15",
    nokta: "bg-blue-400 shadow-[0_0_16px_#60a5fa]",
  },
];

const TUS =
  "flex min-w-0 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#305775] bg-gradient-to-b from-[#183853] to-[#0a1e35] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_5px_14px_rgba(0,0,0,.25)] transition-all duration-150 hover:border-cyan-400/70 active:scale-[.96] active:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-35";

const kullaniciIdGetir = () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const jwt = jwtDecode(token);
      const id = Number(
        jwt.sub ??
          jwt.nameid ??
          jwt[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ] ??
          jwt.id,
      );
      if (Number.isInteger(id) && id > 0) return id;
    }
  } catch (error) {
    console.warn("JWT kimliği okunamadı:", error);
  }

  try {
    const user = JSON.parse(localStorage.getItem("kullanici") || "{}");
    const id = Number(user.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
};

const KumandaTusu = ({
  kod,
  etiket,
  ikon,
  onPress,
  disabled,
  active,
  className = "",
}) => (
  <button
    type="button"
    aria-label={etiket}
    title={etiket}
    disabled={disabled}
    onClick={() => void onPress(kod)}
    className={`${TUS} flex-col gap-1.5 px-1.5 py-2 ${active ? "!border-cyan-300 ring-2 ring-cyan-500/30" : ""} ${className}`}
  >
    <FontAwesomeIcon icon={ikon} className="text-xl sm:text-2xl" />
    <span className="text-center text-[11px] leading-tight font-bold sm:text-[13px]">
      {etiket}
    </span>
  </button>
);

// Standart HTML select yerine koyu temaya uygun açılır liste.
const SecimKutusu = ({
  baslik,
  ikon,
  secili,
  secenekler,
  acik,
  onToggle,
  onSelect,
  disabled,
}) => (
  <div className="relative">
    <p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold tracking-wide text-cyan-300">
      <FontAwesomeIcon icon={ikon} /> {baslik}
    </p>
    <button
      type="button"
      disabled={disabled}
      aria-expanded={acik}
      onClick={onToggle}
      className={`flex min-h-12 w-full items-center gap-2 rounded-xl border bg-[#091629] px-3 text-left disabled:opacity-40 ${acik ? "border-cyan-400" : "border-slate-600/70 hover:border-cyan-400/60"}`}
    >
      <FontAwesomeIcon icon={ikon} className="text-cyan-300" />
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">
        {secili?.ad || `${baslik} seçin`}
      </span>
      <FontAwesomeIcon
        icon={faChevronDown}
        className={`text-xs text-cyan-300 transition-transform ${acik ? "rotate-180" : ""}`}
      />
    </button>
    {acik && (
      <div className="absolute inset-x-0 top-[calc(100%+6px)] z-[80] max-h-48 space-y-1 overflow-y-auto rounded-xl border border-cyan-500/40 bg-[#0b1b30] p-1.5 shadow-[0_18px_35px_rgba(0,0,0,.8)]">
        {secenekler.length === 0 ? (
          <p className="p-3 text-xs text-slate-400">Seçenek bulunamadı.</p>
        ) : (
          secenekler.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(String(item.id))}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${String(secili?.id) === String(item.id) ? "bg-cyan-500/15 text-cyan-200" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <span className="min-w-0 flex-1 truncate">{item.ad}</span>
              {String(secili?.id) === String(item.id) && (
                <FontAwesomeIcon icon={faCheck} />
              )}
            </button>
          ))
        )}
      </div>
    )}
  </div>
);

const GelismisKumanda = () => {
  const [piler, setPiler] = useState([]);
  const [kumandalar, setKumandalar] = useState([]);
  const [piId, setPiId] = useState("");
  const [kumandaId, setKumandaId] = useState("");
  const [secimPaneliAcik, setSecimPaneliAcik] = useState(false);
  const [acikListe, setAcikListe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yenileme, setYenileme] = useState(0);
  const [yuklemeHatasi, setYuklemeHatasi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [aktifTus, setAktifTus] = useState("");
  const [sonuc, setSonuc] = useState(null);
  const secimAlaniRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    let iptal = false;
    Promise.all([
      irTransmitterService.getAll(),
      orchestrationService.getKontrolPaneliKumandalar(),
    ])
      .then(([piData, kumandaData]) => {
        if (iptal) return;
        setPiler(
          (Array.isArray(piData) ? piData : []).filter(
            (pi) => pi.aktifMi !== false,
          ),
        );
        setKumandalar(Array.isArray(kumandaData) ? kumandaData : []);
        setYuklemeHatasi("");
      })
      .catch((error) => {
        if (iptal) return;
        console.error("Gelişmiş kumanda yüklenemedi:", error);
        setYuklemeHatasi(
          error.response?.data?.mesaj || "IR cihazları yüklenemedi.",
        );
      })
      .finally(() => {
        if (!iptal) setLoading(false);
      });
    return () => {
      iptal = true;
    };
  }, [yenileme]);

  useEffect(() => {
    const disTiklama = (event) => {
      if (!secimAlaniRef.current?.contains(event.target)) setAcikListe(null);
    };
    const esc = (event) => {
      if (event.key === "Escape") setAcikListe(null);
    };
    document.addEventListener("pointerdown", disTiklama);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", disTiklama);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const aktifPiler = useMemo(
    () => piler.filter((pi) => pi.id != null),
    [piler],
  );
  const seciliPiId =
    piId || (aktifPiler.length === 1 ? String(aktifPiler[0].id) : "");
  const seciliPi = aktifPiler.find((pi) => String(pi.id) === seciliPiId);

  const uygunKumandalar = useMemo(() => {
    if (!seciliPiId) return [];
    return kumandalar.filter((kumanda) =>
      (Array.isArray(kumanda.hedefler) ? kumanda.hedefler : []).some(
        (hedef) => String(hedef.irTransmitterId) === seciliPiId,
      ),
    );
  }, [kumandalar, seciliPiId]);

  const seciliKumandaId = uygunKumandalar.some(
    (k) => String(k.remoteControlId) === kumandaId,
  )
    ? kumandaId
    : uygunKumandalar.length === 1
      ? String(uygunKumandalar[0].remoteControlId)
      : "";
  const seciliKumanda = uygunKumandalar.find(
    (k) => String(k.remoteControlId) === seciliKumandaId,
  );

  // İki seçim geçerliyse panel otomatik kapanır. Tekrar açmak için dişli butonuna basılır.
  const secimGoster =
    secimPaneliAcik || !seciliPi || !seciliKumanda || Boolean(yuklemeHatasi);
  const hazir =
    !loading &&
    !yuklemeHatasi &&
    !gonderiliyor &&
    Boolean(seciliPi && seciliKumanda);

  const piSecenekleri = aktifPiler.map((pi) => ({
    id: pi.id,
    ad: pi.cihazAdi,
  }));
  const kumandaSecenekleri = uygunKumandalar.map((k) => ({
    id: k.remoteControlId,
    ad: k.kumandaMarkaModel,
  }));

  const piSec = (id) => {
    setPiId(id);
    setKumandaId("");
    setSonuc(null);
    setAcikListe(null);
    const bulunan = kumandalar.filter((k) =>
      (Array.isArray(k.hedefler) ? k.hedefler : []).some(
        (h) => String(h.irTransmitterId) === id,
      ),
    );
    // Tek profil varsa seçimi otomatik tamamlayıp kumandaya geç.
    setSecimPaneliAcik(bulunan.length !== 1);
  };

  const kumandaSec = (id) => {
    setKumandaId(id);
    setAcikListe(null);
    setSonuc(null);
    setSecimPaneliAcik(false);
  };

  const yenile = () => {
    if (loading || gonderiliyor) return;
    setLoading(true);
    setAcikListe(null);
    setYenileme((sayi) => sayi + 1);
  };

  const tusGonder = async (tusKodu) => {
    if (sendingRef.current) return;
    if (!seciliPi || !seciliKumanda) {
      toast.warning("Önce Raspberry Pi ve kumanda profilini seçin.");
      return;
    }
    const kullaniciId = kullaniciIdGetir();
    if (!kullaniciId) {
      toast.error("Kullanıcı kimliği bulunamadı. Yeniden giriş yapın.");
      return;
    }
    sendingRef.current = true;
    setGonderiliyor(true);
    setAktifTus(tusKodu);
    setSonuc(null);
    try {
      await orchestrationService.kontrolPaneliKumandaTusGonder({
        remoteControlId: Number(seciliKumanda.remoteControlId),
        irTransmitterId: Number(seciliPi.id),
        tusKodu,
        kullaniciId,
      });
      setSonuc({
        basarili: true,
        mesaj: `${tusKodu} komutu ${seciliPi.cihazAdi} cihazına gönderildi.`,
      });
    } catch (error) {
      const mesaj =
        error.response?.data?.mesaj ||
        "IR sinyali gönderilemedi. Tuş kaydını ve Raspberry Pi bağlantısını kontrol edin.";
      setSonuc({ basarili: false, mesaj });
      toast.error(mesaj);
    } finally {
      sendingRef.current = false;
      setGonderiliyor(false);
      setAktifTus("");
    }
  };

  const ortak = { onPress: tusGonder, disabled: !hazir };

  return (
    <div className="mx-auto w-full max-w-[500px] pb-[max(10px,env(safe-area-inset-bottom))] text-white">
      <div className="relative rounded-[26px] border border-cyan-500/25 bg-[#061224] bg-[radial-gradient(circle_at_top,rgba(6,182,212,.12),transparent_38%)] p-3 shadow-[0_20px_50px_rgba(0,0,0,.35)] sm:p-4">
        {/* Seçim tamamlanınca bu alan tamamen kapanır. */}
        {secimGoster && (
          <section
            ref={secimAlaniRef}
            className="relative z-50 mb-3 space-y-3 rounded-2xl border border-cyan-400/25 bg-[#0c2035] p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black tracking-[.18em] text-cyan-300 uppercase">
                  AVCONTROL / IR KONTROL
                </p>
                <h1 className="mt-0.5 text-lg font-black">Gelişmiş Kumanda</h1>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Raspberry Pi ve kumanda profili seçin.
                </p>
              </div>
              <button
                type="button"
                onClick={yenile}
                disabled={loading || gonderiliyor}
                title="Listeyi yenile"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-cyan-300 disabled:opacity-40"
              >
                <FontAwesomeIcon
                  icon={loading ? faSpinner : faRotate}
                  spin={loading}
                />
              </button>
            </div>
            <SecimKutusu
              baslik="Raspberry Pi"
              ikon={faMicrochip}
              secili={piSecenekleri.find((p) => String(p.id) === seciliPiId)}
              secenekler={piSecenekleri}
              acik={acikListe === "pi"}
              onToggle={() => setAcikListe((v) => (v === "pi" ? null : "pi"))}
              onSelect={piSec}
              disabled={loading || gonderiliyor || piSecenekleri.length === 0}
            />
            <SecimKutusu
              baslik="Kumanda Profili"
              ikon={faGamepad}
              secili={kumandaSecenekleri.find(
                (k) => String(k.id) === seciliKumandaId,
              )}
              secenekler={kumandaSecenekleri}
              acik={acikListe === "kumanda"}
              onToggle={() =>
                setAcikListe((v) => (v === "kumanda" ? null : "kumanda"))
              }
              onSelect={kumandaSec}
              disabled={
                loading ||
                gonderiliyor ||
                !seciliPi ||
                !kumandaSecenekleri.length
              }
            />
            {loading && (
              <p className="text-xs text-cyan-300">
                <FontAwesomeIcon icon={faSpinner} spin /> Cihazlar yükleniyor...
              </p>
            )}
            {!loading && yuklemeHatasi && (
              <p role="alert" className="text-xs text-red-300">
                {yuklemeHatasi}
              </p>
            )}
            {!loading && !yuklemeHatasi && !aktifPiler.length && (
              <p className="text-xs text-amber-300">
                Aktif Raspberry Pi bulunamadı.
              </p>
            )}
            {!loading && seciliPi && !uygunKumandalar.length && (
              <p className="text-xs text-amber-300">
                Bu Raspberry Pi ile eşleşmiş kumanda bulunamadı.
              </p>
            )}
            {seciliPi && seciliKumanda && (
              <button
                type="button"
                onClick={() => {
                  setSecimPaneliAcik(false);
                  setAcikListe(null);
                }}
                className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" /> Kumandayı
                Göster
              </button>
            )}
          </section>
        )}

        {/* Güç tuşu / küçük cihaz değiştir butonu */}
        <div className="relative mb-3">
          <button
            type="button"
            disabled={!hazir}
            onClick={() => void tusGonder("POWER")}
            className={`${TUS} h-[94px] w-full flex-col gap-1 rounded-[21px] border-cyan-400/65 bg-gradient-to-b from-[#1b496a] to-[#092139] shadow-[0_0_20px_rgba(6,182,212,.11)] sm:h-[108px]`}
          >
            <FontAwesomeIcon
              icon={faPowerOff}
              className="text-[34px] text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,.65)] sm:text-[39px]"
            />
            <span className="text-xs font-bold sm:text-sm">Aç / Kapat</span>
          </button>
          {!secimGoster && (
            <button
              type="button"
              onClick={() => setSecimPaneliAcik(true)}
              disabled={gonderiliyor}
              aria-label="Raspberry Pi veya kumanda değiştir"
              title={`${seciliPi?.cihazAdi} · ${seciliKumanda?.kumandaMarkaModel} — Değiştir`}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-950/60 text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faSliders} className="text-xs" />
            </button>
          )}
        </div>

        {/* Ses */}
        <div className="mb-3 grid grid-cols-3 gap-2.5">
          <KumandaTusu
            kod="MUTE"
            etiket="Sessiz"
            ikon={faVolumeXmark}
            active={aktifTus === "MUTE"}
            className="h-[84px] sm:h-[94px]"
            {...ortak}
          />
          <KumandaTusu
            kod="VOL_DOWN"
            etiket="Ses −"
            ikon={faVolumeLow}
            active={aktifTus === "VOL_DOWN"}
            className="h-[84px] sm:h-[94px]"
            {...ortak}
          />
          <KumandaTusu
            kod="VOL_UP"
            etiket="Ses +"
            ikon={faVolumeHigh}
            active={aktifTus === "VOL_UP"}
            className="h-[84px] sm:h-[94px]"
            {...ortak}
          />
        </div>

        {/* Kanal / yön halkası / menü */}
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_minmax(128px,1.95fr)_minmax(0,1fr)] items-stretch gap-2.5">
          <div className="flex min-w-0 flex-col gap-2">
            <KumandaTusu
              kod="CH_UP"
              etiket="Kanal +"
              ikon={faChevronUp}
              active={aktifTus === "CH_UP"}
              className="min-h-0 flex-1"
              {...ortak}
            />
            <KumandaTusu
              kod="CH_DOWN"
              etiket="Kanal −"
              ikon={faChevronDown}
              active={aktifTus === "CH_DOWN"}
              className="min-h-0 flex-1"
              {...ortak}
            />
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[210px] rounded-full border-2 border-cyan-500/65 bg-[radial-gradient(circle_at_44%_32%,#1e4b6c,#0b2540_65%,#06172a)] shadow-[0_0_20px_rgba(6,182,212,.18)]">
            {[
              {
                kod: "UP",
                ikon: faChevronUp,
                konum: "top-[1%] left-1/2 -translate-x-1/2",
              },
              {
                kod: "DOWN",
                ikon: faChevronDown,
                konum: "bottom-[1%] left-1/2 -translate-x-1/2",
              },
              {
                kod: "LEFT",
                ikon: faChevronLeft,
                konum: "top-1/2 left-[1%] -translate-y-1/2",
              },
              {
                kod: "RIGHT",
                ikon: faChevronRight,
                konum: "top-1/2 right-[1%] -translate-y-1/2",
              },
            ].map((tus) => (
              <button
                type="button"
                key={tus.kod}
                disabled={!hazir}
                aria-label={tus.kod}
                onClick={() => void tusGonder(tus.kod)}
                className={`absolute flex h-[32%] w-[40%] touch-manipulation items-center justify-center rounded-2xl text-cyan-300 transition hover:bg-cyan-500/15 active:scale-95 disabled:opacity-35 ${tus.konum} ${aktifTus === tus.kod ? "bg-cyan-400/25" : ""}`}
              >
                <FontAwesomeIcon
                  icon={tus.ikon}
                  className="text-xl drop-shadow-[0_0_7px_rgba(34,211,238,.8)]"
                />
              </button>
            ))}
            <button
              type="button"
              aria-label="OK"
              disabled={!hazir}
              onClick={() => void tusGonder("OK")}
              className={`absolute top-1/2 left-1/2 z-10 flex h-[43%] w-[43%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-500/55 bg-[#07182a] text-base font-black shadow-xl transition active:scale-95 disabled:opacity-35 ${aktifTus === "OK" ? "ring-2 ring-cyan-300" : ""}`}
            >
              OK
            </button>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <KumandaTusu
              kod="EXIT"
              etiket="Geri"
              ikon={faArrowRotateLeft}
              active={aktifTus === "EXIT"}
              className="min-h-0 flex-1"
              {...ortak}
            />
            <KumandaTusu
              kod="MENU"
              etiket="Menü"
              ikon={faBars}
              active={aktifTus === "MENU"}
              className="min-h-0 flex-1"
              {...ortak}
            />
          </div>
        </div>

        {/* 1–9 */}
        <div className="mb-2.5 grid grid-cols-3 gap-2.5">
          {NUMARALAR.map((sayi) => (
            <button
              type="button"
              key={sayi}
              disabled={!hazir}
              aria-label={`Numara ${sayi}`}
              onClick={() => void tusGonder(`NUM_${sayi}`)}
              className={`${TUS} h-[64px] text-[27px] font-black sm:h-[76px] sm:text-[30px]`}
            >
              {sayi}
            </button>
          ))}
        </div>

        {/* Renkli tuşlar / 0 */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {RENKLER.slice(0, 2).map((renk) => (
            <button
              type="button"
              key={renk.kod}
              disabled={!hazir}
              aria-label={renk.ad}
              onClick={() => void tusGonder(renk.kod)}
              className={`${TUS} h-[61px] sm:h-[67px] ${renk.cerceve}`}
            >
              <span className={`h-6 w-6 rounded-full ${renk.nokta}`} />
            </button>
          ))}
          <button
            type="button"
            disabled={!hazir}
            aria-label="Numara 0"
            onClick={() => void tusGonder("NUM_0")}
            className={`${TUS} h-[61px] text-[27px] font-black sm:h-[67px] sm:text-[30px]`}
          >
            0
          </button>
          {RENKLER.slice(2).map((renk) => (
            <button
              type="button"
              key={renk.kod}
              disabled={!hazir}
              aria-label={renk.ad}
              onClick={() => void tusGonder(renk.kod)}
              className={`${TUS} h-[61px] sm:h-[67px] ${renk.cerceve}`}
            >
              <span className={`h-6 w-6 rounded-full ${renk.nokta}`} />
            </button>
          ))}
        </div>

        {/* İnce işlem durumu */}
        <div
          aria-live="polite"
          className={`mt-3 flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-snug ${sonuc?.basarili ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : sonuc ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-[#274963] bg-[#0b1c30] text-slate-400"}`}
        >
          <FontAwesomeIcon
            icon={
              gonderiliyor
                ? faSpinner
                : sonuc?.basarili
                  ? faCheck
                  : sonuc
                    ? faCircleExclamation
                    : faSatelliteDish
            }
            spin={gonderiliyor}
            className="shrink-0"
          />
          <span>
            {gonderiliyor
              ? `${aktifTus} gönderiliyor...`
              : sonuc?.mesaj ||
                (hazir
                  ? "Kumanda hazır. Bir tuşa dokunarak sinyal gönderin."
                  : "Raspberry Pi ve kumanda profilini seçin.")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GelismisKumanda;
