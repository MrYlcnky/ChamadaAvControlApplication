import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import { toast } from "react-toastify";

// ================================================================
// COMPONENTLER
// ================================================================

import OutputListSidebar from "../components/kontrolPaneli/OutputListSidebar";
import ZoneDetailPanel from "../components/kontrolPaneli/ZoneDetailPanel";
import MacTakvimSidebar from "../components/kontrolPaneli/MacTakvimSidebar";
import KumandalarSidebar from "../components/kontrolPaneli/KumandalarSidebar";

// ================================================================
// SERVİSLER
// ================================================================

import inputSourceService from "../services/inputSourceService";
import channelListService from "../services/channelListService";
import orchestrationService from "../services/orchestrationService";
import matrixService from "../services/matrixService";

// ================================================================
// YARDIMCI METOTLAR
// ================================================================

const normalizeData = (response) => {
  return Array.isArray(response) ? response : response?.data || [];
};

const getKullaniciId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("kullanici") || "{}");

    return user?.id || 1;
  } catch {
    return 1;
  }
};

const getInitialData = async () => {
  const [outputData, inputData, matrixData] = await Promise.all([
    orchestrationService.getKontrolPaneliBolgeler(),
    inputSourceService.tumunuGetir(),
    matrixService.getAll(),
  ]);

  return {
    outputs: normalizeData(outputData),
    inputs: normalizeData(inputData),
    matrices: normalizeData(matrixData),
  };
};

// ================================================================
// KONTROL PANELİ
// ================================================================

// Bağlantı sorunu devam ederse 5, 10, 10 ve ardından 30 saniyede bir dene.
const MATRIX_RETRY_DELAYS_MS = [5000, 10000, 10000, 30000];

// HTTP yetkilendirme / hatalı endpoint / doğrulama hatalarında tekrar istek gönderme.
const isNonRetryableMatrixError = (error) => {
  const status = Number(error?.response?.status);
  return [400, 401, 403, 404, 422].includes(status);
};

// Hem tek bölge yanıtını hem de eski Matrix servisindeki
// { baglantiBasarili, cikislar: [...] } biçimini destekle.
const getPortNumber = (raw) => {
  const text = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (/^\d+$/.test(text)) return Number(text);
  if (/^[A-Z]$/.test(text)) return text.charCodeAt(0) - 64;
  const match = text.match(
    /(?:OUTPUT|OUT|PORT|ÇIKIŞ|CIKIS)\s*[:#-]?\s*([A-Z]|\d+)/,
  );
  if (!match) return null;
  return /^\d+$/.test(match[1])
    ? Number(match[1])
    : match[1].charCodeAt(0) - 64;
};

const readMatrixRouteResponse = (raw, output) => {
  const payload = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      permanent: true,
      reason: "API boş veya geçersiz yanıt verdi.",
    };
  }

  const success = payload.baglantiBasarili ?? payload.BaglantiBasarili;
  const deviceError =
    payload.hata ?? payload.Hata ?? payload.mesaj ?? payload.Mesaj;

  if (success === false) {
    return {
      ok: false,
      permanent: false,
      reason: String(
        deviceError ||
          "Matrix cihazına bağlantı kurulamadı veya yanıt alınamadı.",
      ),
    };
  }

  // Yeni, tek bölgeye özel endpoint'in düz yanıtı.
  let inputPort = payload.bagliOlduguGiris ?? payload.BagliOlduguGiris;

  // Eski servis tüm çıkışları döndürüyorsa ilgili çıkışın verisini al.
  if (inputPort === null || inputPort === undefined) {
    const outputs = payload.cikislar ?? payload.Cikislar;
    if (Array.isArray(outputs)) {
      const selectedPort = getPortNumber(output.portKodu);
      const matched = outputs.find(
        (row) =>
          selectedPort !== null &&
          getPortNumber(row?.port ?? row?.Port) === selectedPort,
      );
      inputPort = matched?.bagliOlduguGiris ?? matched?.BagliOlduguGiris;
      if (!matched) {
        return {
          ok: false,
          permanent: true,
          reason: `Matrix yanıtında bölgenin çıkışı eşleşmedi (PortKodu: ${output.portKodu}).`,
        };
      }
    }
  }

  if (success !== true) {
    return {
      ok: false,
      permanent: true,
      reason:
        "API yanıtında baglantiBasarili alanı yok. Endpoint yanıt biçimini kontrol edin.",
    };
  }

  if (
    inputPort === null ||
    inputPort === undefined ||
    String(inputPort).trim() === ""
  ) {
    return {
      ok: false,
      permanent: false,
      reason:
        "Matrix'e erişildi ancak bağlı giriş portu okunamadı (#show_r yanıtını kontrol edin).",
    };
  }

  return { ok: true, inputPort: String(inputPort).trim() };
};

const KontrolPaneli = () => {
  // ==============================================================
  // STATE
  // ==============================================================

  const [outputs, setOutputs] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [matrices, setMatrices] = useState([]);

  const [selectedOutputs, setSelectedOutputs] = useState([]);

  const [activeInputId, setActiveInputId] = useState(null);

  const [channels, setChannels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Matrix canlı durum doğrulama bilgisi:
  // idle | checking | retrying | confirmed | unavailable | unmapped
  const [matrixCheckStatus, setMatrixCheckStatus] = useState("idle");
  const [matrixDiagnostic, setMatrixDiagnostic] = useState(null);

  // Eski isteklerin yeni bölge seçimlerini etkilemesini önler.
  const selectionRequestRef = useRef(0);

  // Seçili bölgeye ait planlanmış TEK yeniden doğrulama zamanlayıcısı.
  const matrixRetryTimerRef = useRef(null);

  // Eski kanal sorgularının yeni kanal listesini ezmesini önler.
  const channelRequestRef = useRef(0);

  // Eşzamanlı işlemlerin yükleme durumunu karıştırmasını önler.
  const actionRequestRef = useRef(0);

  const KULLANICI_ID = getKullaniciId();

  const isAdmin = ["admin", "1"].includes(
    String(localStorage.getItem("rol") || "")
      .trim()
      .toLowerCase(),
  );
  // ==============================================================
  // İLK YÜKLEME
  // ==============================================================

  useEffect(() => {
    let cancelled = false;

    getInitialData()
      .then((data) => {
        if (cancelled) return;

        setOutputs(data.outputs);
        setInputs(data.inputs);
        setMatrices(data.matrices);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Kontrol paneli verileri yüklenemedi:", error);

        toast.error("Sistem verileri yüklenirken hata oluştu.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sayfadan çıkıldığında eski sorguların sonuçları uygulanmasın,
  // bekleyen Matrix yeniden denemeleri tamamen temizlensin.
  useEffect(() => {
    return () => {
      ++selectionRequestRef.current;
      ++channelRequestRef.current;

      if (matrixRetryTimerRef.current !== null) {
        clearTimeout(matrixRetryTimerRef.current);
        matrixRetryTimerRef.current = null;
      }
    };
  }, []);

  // ==============================================================
  // KANALLARI GETİR
  // ==============================================================

  const fetchChannelsForInput = async (inputId) => {
    const requestId = ++channelRequestRef.current;

    if (inputId === null || inputId === undefined) {
      setChannels([]);
      return;
    }

    try {
      const allChannels = await channelListService.getAll();

      // Bu istekten sonra yeni bir istek başladıysa
      // eski cevabı uygulama.
      if (requestId !== channelRequestRef.current) {
        return;
      }

      const channelList = normalizeData(allChannels);

      const inputChannels = channelList
        .filter((channel) => String(channel.inputSourceId) === String(inputId))
        .sort((a, b) => Number(a.kanalNumarasi) - Number(b.kanalNumarasi));

      setChannels(inputChannels);
    } catch (error) {
      if (requestId !== channelRequestRef.current) {
        return;
      }

      console.error("Kanallar çekilemedi:", error);

      setChannels([]);
    }
  };

  // ==============================================================
  // MATRIX CANLI KAYNAK - ARKA PLAN DOĞRULAMASI / OTOMATİK TEKRAR
  // ==============================================================

  const clearMatrixRetry = () => {
    if (matrixRetryTimerRef.current !== null) {
      clearTimeout(matrixRetryTimerRef.current);
      matrixRetryTimerRef.current = null;
    }
  };

  // Aynı anda birden çok istek başlamaz: yeni deneme ancak önceki
  // sorgu bittikten sonra zamanlanır. requestId eskiyse yanıt yok sayılır.
  const verifyMatrixForOutput = async (
    output,
    requestId,
    attempt = 0,
    fallbackInputId = output.guncelInputSourceId ?? null,
  ) => {
    if (requestId !== selectionRequestRef.current) return;

    const scheduleRetry = () => {
      if (requestId !== selectionRequestRef.current) return;

      setMatrixCheckStatus("retrying");
      const delay =
        MATRIX_RETRY_DELAYS_MS[
          Math.min(attempt, MATRIX_RETRY_DELAYS_MS.length - 1)
        ];
      setMatrixDiagnostic((previous) => ({
        ...(previous || {}),
        attempt: attempt + 1,
        nextSeconds: delay / 1000,
      }));
      clearMatrixRetry();

      matrixRetryTimerRef.current = setTimeout(() => {
        matrixRetryTimerRef.current = null;

        if (requestId !== selectionRequestRef.current) return;

        // Geciken istek bitmeden yeni bir istek başlamaz.
        void verifyMatrixForOutput(
          output,
          requestId,
          attempt + 1,
          fallbackInputId,
        );
      }, delay);
    };

    try {
      const status = await orchestrationService.getBolgeCanliKaynak(output.id);

      if (requestId !== selectionRequestRef.current) return;

      const route = readMatrixRouteResponse(status, output);
      if (!route.ok) {
        setMatrixDiagnostic({
          reason: route.reason,
          attempt: attempt + 1,
          nextSeconds: null,
        });
        if (route.permanent) {
          clearMatrixRetry();
          setMatrixCheckStatus("unavailable");
          console.error("Matrix yanıt biçimi / port hatası:", {
            output,
            status,
            route,
          });
        } else {
          if (attempt === 0 || attempt % 5 === 0) {
            console.warn("Matrix doğrulanamadı:", {
              outputId: output.id,
              status,
              route,
            });
          }
          scheduleRetry();
        }
        return;
      }

      const currentInput = inputs.find(
        (input) =>
          String(input.matrixDeviceId) === String(output.matrixDeviceId) &&
          String(input.portNumarasi) === route.inputPort,
      );

      // Fiziksel çıkış okunabildi fakat giriş tanımı yok:
      // Bu bağlantı hatası değil, port/konfigürasyon eşleşme sorunu.
      if (!currentInput) {
        clearMatrixRetry();
        setMatrixCheckStatus("unmapped");
        setMatrixDiagnostic({
          reason: `Matrix giriş portu ${route.inputPort} için InputSource tanımı bulunamadı.`,
          attempt: attempt + 1,
          nextSeconds: null,
        });
        console.warn("Matrix giriş portu tanımlı değil:", {
          bolgeId: output.id,
          matrixId: output.matrixDeviceId,
          port: route.inputPort,
        });
        return;
      }

      clearMatrixRetry();
      setMatrixCheckStatus("confirmed");
      setMatrixDiagnostic(null);

      // Gerçek Matrix girişi, ekrandaki kayıtlı girişten farklı olabilir.
      if (String(currentInput.id) !== String(fallbackInputId)) {
        setActiveInputId(currentInput.id);
        void fetchChannelsForInput(currentInput.id);

        // Yalnızca frontend görünümünü eşitle; DB kaydı değişmez.
        setOutputs((prev) =>
          prev.map((zone) =>
            zone.id === output.id
              ? { ...zone, guncelInputSourceId: currentInput.id }
              : zone,
          ),
        );

        setSelectedOutputs((prev) =>
          prev.length === 1 && prev[0].id === output.id
            ? [{ ...prev[0], guncelInputSourceId: currentInput.id }]
            : prev,
        );
      }
    } catch (error) {
      if (requestId !== selectionRequestRef.current) return;

      // 401/403/404 ve geçersiz isteklerde sonsuz sorgu başlatma.
      if (isNonRetryableMatrixError(error)) {
        clearMatrixRetry();
        setMatrixCheckStatus("unavailable");
        setMatrixDiagnostic({
          reason: `HTTP ${error?.response?.status}: ${error?.response?.data?.mesaj || "İstek reddedildi."}`,
          attempt: attempt + 1,
          nextSeconds: null,
        });
        console.error("Matrix doğrulaması tekrar denenemiyor:", error);
        return;
      }

      setMatrixDiagnostic({
        reason: error?.response?.status
          ? `HTTP ${error.response.status}: ${error.response.data?.mesaj || "Sunucu hatası."}`
          : "Network Error: API isteği tamamlanamadı.",
        attempt: attempt + 1,
        nextSeconds: null,
      });
      if (attempt === 0 || attempt % 5 === 0) {
        console.warn("Matrix geçici olarak doğrulanamadı:", error);
      }

      scheduleRetry();
    }
  };

  // ==============================================================
  // ÇOKLU BÖLGE SEÇİMİ
  // ==============================================================

  const toggleOutputSelection = (output) => {
    // Devam eden tek bölge canlı sorgusunu ve tekrar zamanlayıcısını iptal et.
    ++selectionRequestRef.current;
    ++channelRequestRef.current;
    clearMatrixRetry();

    setMatrixCheckStatus("idle");
    setMatrixDiagnostic(null);
    setActiveInputId(null);
    setChannels([]);

    setSelectedOutputs((prev) => {
      const isSelected = prev.some((item) => item.id === output.id);

      if (isSelected) {
        return prev.filter((item) => item.id !== output.id);
      }

      return [...prev, output];
    });
  };

  // ==============================================================
  // TEK BÖLGE SEÇ — HIZLI AÇILIŞ + ARKA PLANDA TEKRAR
  // ==============================================================

  const handleSelectOne = (output) => {
    // Önceki bölgeye ait timer ve sonuçlar etkisiz hale gelir.
    clearMatrixRetry();
    const requestId = ++selectionRequestRef.current;

    // Paneli Matrix cevabını beklemeden anında aç.
    const fallbackInputId = output.guncelInputSourceId ?? null;

    setSelectedOutputs([output]);
    setActiveInputId(fallbackInputId);
    setChannels([]);
    setMatrixCheckStatus("checking");
    setMatrixDiagnostic(null);

    // Kayıtlı girişe ait kanal listesi de arka planda yüklenir.
    void fetchChannelsForInput(fallbackInputId);

    // Yalnızca bu bölgenin Matrix çıkışını doğrula.
    // Geçici hata varsa 5/10/10/30 sn tekrar; başarıda durur.
    void verifyMatrixForOutput(output, requestId, 0, fallbackInputId);
  };

  // ==============================================================
  // TEK BÖLGE KAYNAK DEĞİŞTİR
  // ==============================================================

  const handleSourceChange = async (inputId) => {
    if (selectedOutputs.length !== 1) {
      return;
    }

    // Eski Matrix canlı durum sorgusunu geçersiz kıl.
    const selectionRequestId = ++selectionRequestRef.current;
    const actionRequestId = ++actionRequestRef.current;

    clearMatrixRetry();
    setMatrixCheckStatus("idle");
    setMatrixDiagnostic(null);

    const singleOutput = selectedOutputs[0];

    const previousActiveInputId = activeInputId;
    const previousChannels = channels;

    // Yeni kaynağı arayüzde göster.
    setActiveInputId(inputId);

    // Kanal listesini beklemeden yükle.
    void fetchChannelsForInput(inputId);

    // Bu loading yalnızca gerçek komut gönderiminde çalışır.
    setActionLoading(true);

    try {
      await orchestrationService.kaynakDegistir({
        outputZoneId: singleOutput.id,
        inputSourceId: inputId,
        kullaniciId: KULLANICI_ID,
      });

      // Veritabanında güncellenen kaynak durumunu
      // frontend listesinde de güncelle.
      setOutputs((prevOutputs) =>
        prevOutputs.map((output) =>
          output.id === singleOutput.id
            ? {
                ...output,
                guncelInputSourceId: inputId,
              }
            : output,
        ),
      );

      // Kullanıcı bu sırada başka bir bölge seçmişse
      // yeni seçimi değiştirme.
      if (selectionRequestId === selectionRequestRef.current) {
        setSelectedOutputs((prev) => {
          if (prev.length !== 1 || prev[0].id !== singleOutput.id) {
            return prev;
          }

          return [
            {
              ...prev[0],
              guncelInputSourceId: inputId,
            },
          ];
        });

        toast.success("Yayın başarıyla değiştirildi.");

        // Kaynak değiştirme komutundan sonra fiziksel yönlendirmeyi
        // arka planda doğrula; başarısızlıkta yeniden denemeyi sürdür.
        setMatrixCheckStatus("checking");
        setMatrixDiagnostic(null);
        void verifyMatrixForOutput(
          { ...singleOutput, guncelInputSourceId: inputId },
          selectionRequestId,
          0,
          inputId,
        );
      }
    } catch (error) {
      if (selectionRequestId === selectionRequestRef.current) {
        // Hata oluştuysa önceki kaynağa dön.
        ++channelRequestRef.current;

        setActiveInputId(previousActiveInputId);
        setChannels(previousChannels);

        toast.error(error.response?.data?.mesaj || "Yayın değiştirilemedi.");
      }
    } finally {
      if (actionRequestId === actionRequestRef.current) {
        setActionLoading(false);
      }
    }
  };

  // ==============================================================
  // TOPLU KAYNAK DEĞİŞTİR
  // ==============================================================

  const handleBulkSourceChange = async (inputId) => {
    if (selectedOutputs.length === 0) {
      return;
    }

    // Eski canlı Matrix sorgularını geçersiz kıl.
    const selectionRequestId = ++selectionRequestRef.current;
    const actionRequestId = ++actionRequestRef.current;

    clearMatrixRetry();
    setMatrixCheckStatus("idle");

    const selectedZoneIds = selectedOutputs.map((output) => output.id);

    const previousActiveInputId = activeInputId;
    const previousChannels = channels;

    setActiveInputId(inputId);

    // Kanalları arka planda getir.
    void fetchChannelsForInput(inputId);

    setActionLoading(true);

    try {
      const response = await orchestrationService.topluKaynakDegistir({
        outputZoneIds: selectedZoneIds,
        inputSourceId: inputId,
        kullaniciId: KULLANICI_ID,
      });

      // Backend mevcut sürümde kısmi başarısızlıkta da
      // HTTP 200 döndürebildiği için yanıtı kontrol et.
      const isPartialFailure =
        typeof response?.mesaj === "string" &&
        response.mesaj.toLocaleLowerCase("tr-TR").includes("ancak");

      if (isPartialFailure) {
        if (selectionRequestId === selectionRequestRef.current) {
          toast.warning(response.mesaj);
        }

        // Hangi bölgelerin başarılı olduğu bilinmediğinden
        // hepsini başarılı olarak güncelleme.
        return;
      }

      // Başarılı işlem yapılan bölge kayıtlarını güncelle.
      setOutputs((prevOutputs) =>
        prevOutputs.map((output) =>
          selectedZoneIds.includes(output.id)
            ? {
                ...output,
                guncelInputSourceId: inputId,
              }
            : output,
        ),
      );

      if (selectionRequestId === selectionRequestRef.current) {
        setSelectedOutputs((prevSelectedOutputs) =>
          prevSelectedOutputs.map((output) =>
            selectedZoneIds.includes(output.id)
              ? {
                  ...output,
                  guncelInputSourceId: inputId,
                }
              : output,
          ),
        );

        toast.success(
          `${selectedZoneIds.length} bölgenin yayını başarıyla değiştirildi.`,
        );
      }
    } catch (error) {
      if (selectionRequestId === selectionRequestRef.current) {
        ++channelRequestRef.current;

        setActiveInputId(previousActiveInputId);
        setChannels(previousChannels);

        toast.error(
          error.response?.data?.mesaj ||
            "Toplu işlem sırasında bir hata oluştu.",
        );
      }
    } finally {
      if (actionRequestId === actionRequestRef.current) {
        setActionLoading(false);
      }
    }
  };

  // ==============================================================
  // KANAL DEĞİŞTİR
  // ==============================================================

  const handleChannelChange = async (channelId) => {
    if (!selectedOutputs || selectedOutputs.length === 0) {
      return;
    }

    const actionRequestId = ++actionRequestRef.current;

    setActionLoading(true);

    try {
      const hedefZoneId = selectedOutputs[0].id;

      await orchestrationService.kanalDegistir({
        outputZoneId: hedefZoneId,
        channelListId: channelId,
        kullaniciId: KULLANICI_ID,
      });

      toast.success("Kanal başarıyla değiştirildi.");
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "Kanal değiştirilemedi.");
    } finally {
      if (actionRequestId === actionRequestRef.current) {
        setActionLoading(false);
      }
    }
  };

  // ==============================================================
  // TV KONTROL
  // ==============================================================

  const handleTvControl = async (tusKodu) => {
    if (selectedOutputs.length !== 1) {
      return;
    }

    const singleOutput = selectedOutputs[0];
    const actionRequestId = ++actionRequestRef.current;

    setActionLoading(true);

    try {
      await orchestrationService.tekilTusGonder({
        outputZoneId: singleOutput.id,
        tusKodu,
        kullaniciId: KULLANICI_ID,
        tvKontroluMu: true,
      });
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "TV komutu gönderilemedi.");
    } finally {
      if (actionRequestId === actionRequestRef.current) {
        setActionLoading(false);
      }
    }
  };

  // ==============================================================
  // LED MOD DEĞİŞTİR
  // ==============================================================

  const handleLedModeChange = async (targetMode) => {
    if (selectedOutputs.length !== 1 || !selectedOutputs[0].ledProcessorId) {
      return;
    }

    const singleOutput = selectedOutputs[0];
    const actionRequestId = ++actionRequestRef.current;

    setActionLoading(true);

    try {
      await orchestrationService.changeLedMode({
        ledProcessorId: singleOutput.ledProcessorId,
        targetMode,
      });

      toast.success(
        targetMode === 1
          ? "Reklam Moduna (Internal) geçildi."
          : "Tam Ekran (HDMI) moduna geçildi.",
      );
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "Ekran modu değiştirilemedi.");
    } finally {
      if (actionRequestId === actionRequestRef.current) {
        setActionLoading(false);
      }
    }
  };

  // ==============================================================
  // İLK YÜKLEME EKRANI
  // ==============================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-cyan-500 sm:text-5xl"
          />

          <p className="animate-pulse text-center text-xs font-bold tracking-[0.18em] text-slate-400 sm:text-sm sm:tracking-widest">
            SİSTEM BAŞLATILIYOR
          </p>
        </div>
      </div>
    );
  }

  // ==============================================================
  // JSX
  // ==============================================================

  return (
    <div className="animate-av-card-enter w-full min-w-0 xl:h-[calc(100dvh-128px)]">
      <div
        className={`grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:h-full ${isAdmin ? "xl:grid-cols-[210px_minmax(300px,1fr)_330px_220px] 2xl:grid-cols-[230px_minmax(320px,1fr)_380px_240px]" : "xl:grid-cols-[230px_minmax(320px,1fr)_360px] 2xl:grid-cols-[240px_minmax(360px,1fr)_400px]"}`}
      >
        {/* ========================================================
            1. BÖLGELER
        ======================================================== */}

        <section className="h-[500px] min-w-0 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/60 shadow-xl backdrop-blur-md sm:h-[560px] xl:h-full [&>*]:!h-full [&>*]:!w-full [&>*]:!max-w-none">
          <OutputListSidebar
            outputs={outputs}
            matrices={matrices}
            selectedOutputs={selectedOutputs}
            onToggleSelect={toggleOutputSelection}
            onSelectOne={handleSelectOne}
          />
        </section>

        {/* ========================================================
            2. BÖLGE DETAY / KONTROL
        ======================================================== */}

        <section className="min-h-[650px] min-w-0 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/60 shadow-xl backdrop-blur-md sm:min-h-[700px] md:col-span-2 xl:col-span-1 xl:h-full xl:min-h-0 [&>*]:!h-full [&>*]:!w-full [&>*]:!max-w-none">
          <ZoneDetailPanel
            selectedOutputs={selectedOutputs}
            activeInputId={activeInputId}
            inputs={inputs}
            channels={channels}
            actionLoading={actionLoading}
            matrixCheckStatus={matrixCheckStatus}
            matrixDiagnostic={matrixDiagnostic}
            onRetryMatrix={() => {
              if (selectedOutputs.length === 1) {
                handleSelectOne(selectedOutputs[0]);
              }
            }}
            onSourceChange={handleSourceChange}
            onBulkSourceChange={handleBulkSourceChange}
            onChannelChange={handleChannelChange}
            onTvControl={handleTvControl}
            onLedModeChange={handleLedModeChange}
          />
        </section>

        {/* ========================================================
            3. GÜNÜN MAÇLARI
        ======================================================== */}

        <section className="h-[520px] min-w-0 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/60 shadow-xl backdrop-blur-md sm:h-[560px] xl:h-full [&>*]:!h-full [&>*]:!w-full [&>*]:!max-w-none">
          <MacTakvimSidebar />
        </section>

        {/* ========================================================
    4. KUMANDALAR — SADECE ADMIN
======================================================== */}

        {isAdmin && (
          <section className="h-[520px] min-w-0 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/60 shadow-xl backdrop-blur-md sm:h-[560px] xl:h-full [&>*]:!h-full [&>*]:!w-full [&>*]:!max-w-none">
            <KumandalarSidebar kullaniciId={KULLANICI_ID} />
          </section>
        )}
      </div>
    </div>
  );
};

export default KontrolPaneli;
