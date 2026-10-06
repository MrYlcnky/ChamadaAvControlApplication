import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import { toast } from "react-toastify";

// COMPONENTLER
import OutputListSidebar from "../components/kontrolPaneli/OutputListSidebar";
import ZoneDetailPanel from "../components/kontrolPaneli/ZoneDetailPanel";
import MacTakvimSidebar from "../components/kontrolPaneli/MacTakvimSidebar";
import KumandalarSidebar from "../components/kontrolPaneli/KumandalarSidebar";

// SERVİSLER
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
// COMPONENT
// ================================================================

const KontrolPaneli = () => {
  const [outputs, setOutputs] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [matrices, setMatrices] = useState([]);

  const [selectedOutputs, setSelectedOutputs] = useState([]);

  const [activeInputId, setActiveInputId] = useState(null);

  const [channels, setChannels] = useState([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const KULLANICI_ID = getKullaniciId();

  // ==============================================================
  // İLK YÜKLEME
  // ==============================================================

  useEffect(() => {
    let cancelled = false;

    getInitialData()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setOutputs(data.outputs);
        setInputs(data.inputs);
        setMatrices(data.matrices);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

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

  // ==============================================================
  // KANALLARI GETİR
  // ==============================================================

  const fetchChannelsForInput = async (inputId) => {
    if (!inputId) {
      setChannels([]);
      return;
    }

    try {
      const allChannels = await channelListService.getAll();

      const channelList = normalizeData(allChannels);

      const inputChannels = channelList
        .filter((channel) => String(channel.inputSourceId) === String(inputId))
        .sort((a, b) => Number(a.kanalNumarasi) - Number(b.kanalNumarasi));

      setChannels(inputChannels);
    } catch (error) {
      console.error("Kanallar çekilemedi:", error);

      setChannels([]);
    }
  };

  // ==============================================================
  // ÇOKLU BÖLGE SEÇİMİ
  // ==============================================================

  const toggleOutputSelection = (output) => {
    setSelectedOutputs((prev) => {
      const isSelected = prev.some((item) => item.id === output.id);

      if (isSelected) {
        return prev.filter((item) => item.id !== output.id);
      }

      return [...prev, output];
    });
  };

  // ==============================================================
  // TEK BÖLGE SEÇ
  // ==============================================================

  const handleSelectOne = async (output) => {
    setSelectedOutputs([output]);

    setActiveInputId(null);
    setChannels([]);

    setActionLoading(true);

    try {
      const matrixStatus = await orchestrationService.getMatrixDurum(
        output.matrixDeviceId,
      );

      let foundInputId = null;

      if (matrixStatus && matrixStatus.baglantiBasarili) {
        const outPort = matrixStatus.cikislar?.find(
          (cikis) =>
            cikis.port.toString() === output.portKodu.toString() ||
            String.fromCharCode(64 + parseInt(cikis.port, 10)) ===
              output.portKodu.toString(),
        );

        if (outPort && outPort.bagliOlduguGiris) {
          const currentInput = inputs.find(
            (input) =>
              String(input.matrixDeviceId) === String(output.matrixDeviceId) &&
              String(input.portNumarasi) === String(outPort.bagliOlduguGiris),
          );

          if (currentInput) {
            foundInputId = currentInput.id;
          }
        }
      }

      if (!foundInputId && output.guncelInputSourceId) {
        foundInputId = output.guncelInputSourceId;
      }

      if (foundInputId) {
        setActiveInputId(foundInputId);

        await fetchChannelsForInput(foundInputId);
      } else {
        setActiveInputId(null);
        setChannels([]);
      }
    } catch (error) {
      console.error("Matrix canlı durum alınamadı:", error);

      toast.error("Matrix'ten canlı durum alınamadı.");

      if (output.guncelInputSourceId) {
        setActiveInputId(output.guncelInputSourceId);

        await fetchChannelsForInput(output.guncelInputSourceId);
      } else {
        setActiveInputId(null);
        setChannels([]);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================
  // TEK BÖLGE KAYNAK DEĞİŞTİR
  // ==============================================================

  const handleSourceChange = async (inputId) => {
    if (selectedOutputs.length !== 1) {
      return;
    }

    const singleOutput = selectedOutputs[0];

    const previousActiveInputId = activeInputId;

    const previousChannels = channels;

    setActiveInputId(inputId);

    await fetchChannelsForInput(inputId);

    setActionLoading(true);

    try {
      await orchestrationService.kaynakDegistir({
        outputZoneId: singleOutput.id,

        inputSourceId: inputId,

        kullaniciId: KULLANICI_ID,
      });

      toast.success("Yayın başarıyla değiştirildi.");

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

      setSelectedOutputs((prev) => [
        {
          ...prev[0],
          guncelInputSourceId: inputId,
        },
      ]);
    } catch (error) {
      setActiveInputId(previousActiveInputId);

      setChannels(previousChannels);

      toast.error(error.response?.data?.mesaj || "Yayın değiştirilemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================
  // TOPLU KAYNAK DEĞİŞTİR
  // ==============================================================

  const handleBulkSourceChange = async (inputId) => {
    if (selectedOutputs.length === 0) {
      return;
    }

    const previousActiveInputId = activeInputId;

    const previousChannels = channels;

    setActiveInputId(inputId);

    await fetchChannelsForInput(inputId);

    setActionLoading(true);

    try {
      await orchestrationService.topluKaynakDegistir({
        outputZoneIds: selectedOutputs.map((output) => output.id),

        inputSourceId: inputId,

        kullaniciId: KULLANICI_ID,
      });

      toast.success(
        `${selectedOutputs.length} bölgenin yayını başarıyla değiştirildi.`,
      );

      setOutputs((prevOutputs) =>
        prevOutputs.map((output) =>
          selectedOutputs.some(
            (selectedOutput) => selectedOutput.id === output.id,
          )
            ? {
                ...output,
                guncelInputSourceId: inputId,
              }
            : output,
        ),
      );

      setSelectedOutputs((prevSelectedOutputs) =>
        prevSelectedOutputs.map((output) => ({
          ...output,
          guncelInputSourceId: inputId,
        })),
      );
    } catch (error) {
      setActiveInputId(previousActiveInputId);

      setChannels(previousChannels);

      toast.error(
        error.response?.data?.mesaj || "Toplu işlem sırasında bir hata oluştu.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================
  // KANAL DEĞİŞTİR
  // ==============================================================

  const handleChannelChange = async (channelId) => {
    if (!selectedOutputs || selectedOutputs.length === 0) {
      return;
    }

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
      setActionLoading(false);
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
      setActionLoading(false);
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
      setActionLoading(false);
    }
  };

  // ==============================================================
  // LOADING
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

          <p className="text-center text-xs font-bold tracking-[0.18em] text-slate-400 animate-pulse sm:text-sm sm:tracking-widest">
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
    <div
      className="
        w-full
        min-w-0
        animate-av-card-enter

        xl:h-[calc(100dvh-128px)]
      "
    >
      <div
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-3

          md:grid-cols-2

          xl:h-full
          xl:grid-cols-[240px_minmax(320px,1fr)_280px_260px]
        "
      >
        {/* ========================================================
            1. BÖLGELER
        ======================================================== */}

        <section
          className="
            h-[500px]
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-slate-700/60
            bg-slate-900/60
            shadow-xl
            backdrop-blur-md

            sm:h-[560px]

            xl:h-full

            [&>*]:!h-full
            [&>*]:!w-full
            [&>*]:!max-w-none
          "
        >
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

        <section
          className="
            min-h-[650px]
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-slate-700/60
            bg-slate-900/60
            shadow-xl
            backdrop-blur-md

            sm:min-h-[700px]

            md:col-span-2

            xl:col-span-1
            xl:h-full
            xl:min-h-0

            [&>*]:!h-full
            [&>*]:!w-full
            [&>*]:!max-w-none
          "
        >
          <ZoneDetailPanel
            selectedOutputs={selectedOutputs}
            activeInputId={activeInputId}
            inputs={inputs}
            channels={channels}
            actionLoading={actionLoading}
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

        <section
          className="
            h-[520px]
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-slate-700/60
            bg-slate-900/60
            shadow-xl
            backdrop-blur-md

            sm:h-[560px]

            xl:h-full

            [&>*]:!h-full
            [&>*]:!w-full
            [&>*]:!max-w-none
          "
        >
          <MacTakvimSidebar />
        </section>

        {/* ========================================================
            4. KUMANDALAR
        ======================================================== */}

        <section
          className="
            h-[520px]
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-slate-700/60
            bg-slate-900/60
            shadow-xl
            backdrop-blur-md

            sm:h-[560px]

            xl:h-full

            [&>*]:!h-full
            [&>*]:!w-full
            [&>*]:!max-w-none
          "
        >
          <KumandalarSidebar kullaniciId={KULLANICI_ID} />
        </section>
      </div>
    </div>
  );
};

export default KontrolPaneli;
