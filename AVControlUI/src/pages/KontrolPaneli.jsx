import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner /*faSignal*/ } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

// COMPONENTLER
import OutputListSidebar from "../components/kontrolPaneli/OutputListSidebar";
import ZoneDetailPanel from "../components/kontrolPaneli/ZoneDetailPanel";
import MacTakvimSidebar from "../components/kontrolPaneli/MacTakvimSidebar";

import inputSourceService from "../services/inputSourceService";
import channelListService from "../services/channelListService";
import orchestrationService from "../services/orchestrationService";
import matrixService from "../services/matrixService";

const KontrolPaneli = () => {
  const [outputs, setOutputs] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [matrices, setMatrices] = useState([]);

  // SADECE ÇOKLU SEÇİM İÇİN DİZİ TUTUYORUZ
  const [selectedOutputs, setSelectedOutputs] = useState([]);
  const [activeInputId, setActiveInputId] = useState(null);
  const [channels, setChannels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const getKullaniciId = () => {
    const user = JSON.parse(localStorage.getItem("kullanici") || "{}");
    return user.id || 1; // Eğer bulamazsa varsayılan 1 döner
  };

  const KULLANICI_ID = getKullaniciId();

  const normalizeData = (response) => {
    return Array.isArray(response) ? response : response?.data || [];
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      try {
        const [outputData, inputData, matrixData] = await Promise.all([
          orchestrationService.getKontrolPaneliBolgeler(),
          inputSourceService.tumunuGetir(),
          matrixService.getAll(),
        ]);

        setOutputs(normalizeData(outputData));
        setInputs(normalizeData(inputData));
        setMatrices(normalizeData(matrixData));
      } catch (error) {
        console.error("Kontrol paneli verileri yüklenemedi:", error);
        toast.error("Sistem verileri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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

  const toggleOutputSelection = (output) => {
    setSelectedOutputs((prev) => {
      const isSelected = prev.find((item) => item.id === output.id);
      if (isSelected) {
        return prev.filter((item) => item.id !== output.id);
      }
      return [...prev, output];
    });
  };

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
        const outPort = matrixStatus.cikislar.find(
          (cikis) =>
            cikis.port.toString() === output.portKodu.toString() ||
            String.fromCharCode(64 + parseInt(cikis.port)) ===
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

  const handleSourceChange = async (inputId) => {
    if (selectedOutputs.length !== 1) return;

    const singleOutput = selectedOutputs[0];
    const previousActiveInputId = activeInputId;
    const previousChannels = channels;

    // UI anında yeni kaynağa göre hazırlansın
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
            ? { ...output, guncelInputSourceId: inputId }
            : output,
        ),
      );

      setSelectedOutputs((prev) => [
        { ...prev[0], guncelInputSourceId: inputId },
      ]);
    } catch (error) {
      // Hata olursa eski duruma dön
      setActiveInputId(previousActiveInputId);
      setChannels(previousChannels);
      toast.error(error.response?.data?.mesaj || "Yayın değiştirilemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkSourceChange = async (inputId) => {
    if (selectedOutputs.length === 0) return;

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
            ? { ...output, guncelInputSourceId: inputId }
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

  const handleChannelChange = async (channelId) => {
    // Hiç seçim yoksa işlemi durdur
    if (!selectedOutputs || selectedOutputs.length === 0) return;

    setActionLoading(true);

    try {
      // KRİTİK NOKTA: Kaç ekran seçilmiş olursa olsun (1 veya 10),
      // hepsi aynı uyduya bağlıysa sadece İLK seçilen ekranın ID'si üzerinden
      // tek bir komut göndermemiz yeterlidir.
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
  /*
  const handleBulkChannelChange = async (channelId) => {
    if (selectedOutputs.length === 0) return;
    setActionLoading(true);

    try {
      if (typeof orchestrationService.topluKanalDegistir === "function") {
        await orchestrationService.topluKanalDegistir({
          outputZoneIds: selectedOutputs.map((output) => output.id),
          channelListId: channelId,
          kullaniciId: KULLANICI_ID,
        });
      } else {
        await Promise.all(
          selectedOutputs.map((output) =>
            orchestrationService.kanalDegistir({
              outputZoneId: output.id,
              channelListId: channelId,
              kullaniciId: KULLANICI_ID,
            }),
          ),
        );
      }
      toast.success(
        `${selectedOutputs.length} bölgeye kanal sinyali başarıyla gönderildi.`,
      );
    } catch (error) {
      toast.error(
        error.response?.data?.mesaj || "Toplu kanal değiştirilemedi.",
      );
    } finally {
      setActionLoading(false);
    }
  };
*/
  const handleTvControl = async (tusKodu) => {
    if (selectedOutputs.length !== 1) return;
    const singleOutput = selectedOutputs[0];
    setActionLoading(true);

    try {
      await orchestrationService.tekilTusGonder({
        outputZoneId: singleOutput.id,
        tusKodu: tusKodu,
        kullaniciId: KULLANICI_ID,
        tvKontroluMu: true,
      });
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "TV komutu gönderilemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLedModeChange = async (targetMode) => {
    if (selectedOutputs.length !== 1 || !selectedOutputs[0].ledProcessorId)
      return;
    const singleOutput = selectedOutputs[0];
    setActionLoading(true);

    try {
      await orchestrationService.changeLedMode({
        ledProcessorId: singleOutput.ledProcessorId,
        targetMode: targetMode,
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-5xl text-cyan-500"
          />
          <p className="text-slate-400 font-bold tracking-widest animate-pulse">
            SİSTEM BAŞLATILIYOR
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden rounded-4xl border border-slate-700/60 bg-slate-900/60 shadow-2xl backdrop-blur-md animate-av-card-enter">
      <OutputListSidebar
        outputs={outputs}
        matrices={matrices}
        selectedOutputs={selectedOutputs}
        onToggleSelect={toggleOutputSelection}
        onSelectOne={handleSelectOne}
      />

      <ZoneDetailPanel
        selectedOutputs={selectedOutputs}
        activeInputId={activeInputId}
        inputs={inputs}
        channels={channels}
        actionLoading={actionLoading}
        onSourceChange={handleSourceChange}
        onBulkSourceChange={handleBulkSourceChange}
        onChannelChange={handleChannelChange}
        // onBulkChannelChange={handleBulkChannelChange}
        onTvControl={handleTvControl}
        onLedModeChange={handleLedModeChange}
      />
      <MacTakvimSidebar />
    </div>
  );
};

export default KontrolPaneli;
