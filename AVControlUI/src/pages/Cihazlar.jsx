import { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import LedProcessor from "../components/cihazlar/led/LedProcessor";
import Matrix from "../components/cihazlar/matrix/Matrix";
import IrTransmitter from "../components/cihazlar/pi/IrTransmitter";
import CihazlarDataTable from "../components/cihazlar/CihazlarDataTable";

import ledProcessorService from "../services/ledProcessorService";
import matrixService from "../services/matrixService";
import irTransmitterService from "../services/irTransmitterService";

const Cihazlar = () => {
  const [activeTab, setActiveTab] = useState("all");

  const [tumCihazlar, setTumCihazlar] = useState([]);
  const [allLoading, setAllLoading] = useState(true);

  const ledRef = useRef(null);
  const matrixRef = useRef(null);
  const piRef = useRef(null);

  const tabs = [
    { id: "all", name: "Cihazlar" },
    { id: "led", name: "LED Processor" },
    { id: "tv", name: "Matrix" },
    { id: "pi", name: "Raspberry Pi" },
  ];

  const addButtonText = {
    led: "Yeni LED Processor",
    tv: "Yeni Matrix",
    pi: "Yeni Raspberry Pi",
  };

  useEffect(() => {
    let iptalEdildi = false;

    const loadTumCihazlar = async () => {
      try {
        const [ledData, matrixData, irData] = await Promise.all([
          ledProcessorService.getAll(),
          matrixService.getAll(),
          irTransmitterService.getAll(),
        ]);

        if (iptalEdildi) return;

        const ledCihazlar = Array.isArray(ledData)
          ? ledData.map((item) => ({
              uniqueId: `led-${item.id}`,
              id: item.id,
              cihazTipi: "LED Processor",
              cihazTipiKey: "led",
              cihazAdi: item.cihazAdi || "-",
              ipAdresi: item.ipAdresi || "-",
              port: item.port ?? "-",
              macAdresi: item.macAdresi || "-",
              inputSayisi: "-",
              outputSayisi: "-",
              aktifMi: Boolean(item.aktifMi),
            }))
          : [];

        const matrixCihazlar = Array.isArray(matrixData)
          ? matrixData.map((item) => ({
              uniqueId: `matrix-${item.id}`,
              id: item.id,
              cihazTipi: "Matrix",
              cihazTipiKey: "matrix",
              cihazAdi: item.cihazAdi || "-",
              ipAdresi: item.ipAdresi || "-",
              port: item.telnetPort ?? item.port ?? "-",
              macAdresi: item.macAdresi || "-",
              inputSayisi: item.inputSayisi ?? "-",
              outputSayisi: item.outputSayisi ?? "-",
              aktifMi: Boolean(item.aktifMi),
            }))
          : [];

        const irCihazlar = Array.isArray(irData)
          ? irData.map((item) => ({
              uniqueId: `pi-${item.id}`,
              id: item.id,
              cihazTipi: "Raspberry Pi",
              cihazTipiKey: "pi",
              cihazAdi: item.cihazAdi || "-",
              ipAdresi: item.ipAdresi || "-",
              port: "-",
              macAdresi: item.macAdresi || "-",
              inputSayisi: "-",
              outputSayisi: "-",
              aktifMi: Boolean(item.aktifMi),
            }))
          : [];

        setTumCihazlar([...ledCihazlar, ...matrixCihazlar, ...irCihazlar]);
      } catch {
        if (!iptalEdildi) {
          setTumCihazlar([]);
        }
      } finally {
        if (!iptalEdildi) {
          setAllLoading(false);
        }
      }
    };

    loadTumCihazlar();

    return () => {
      iptalEdildi = true;
    };
  }, []);

  const refreshTumCihazlar = useCallback(async () => {
    try {
      setAllLoading(true);

      const [ledData, matrixData, irData] = await Promise.all([
        ledProcessorService.getAll(),
        matrixService.getAll(),
        irTransmitterService.getAll(),
      ]);

      const ledCihazlar = Array.isArray(ledData)
        ? ledData.map((item) => ({
            uniqueId: `led-${item.id}`,
            id: item.id,
            cihazTipi: "LED Processor",
            cihazTipiKey: "led",
            cihazAdi: item.cihazAdi || "-",
            ipAdresi: item.ipAdresi || "-",
            port: item.port ?? "-",
            macAdresi: item.macAdresi || "-",
            inputSayisi: "-",
            outputSayisi: "-",
            aktifMi: Boolean(item.aktifMi),
          }))
        : [];

      const matrixCihazlar = Array.isArray(matrixData)
        ? matrixData.map((item) => ({
            uniqueId: `matrix-${item.id}`,
            id: item.id,
            cihazTipi: "Matrix",
            cihazTipiKey: "matrix",
            cihazAdi: item.cihazAdi || "-",
            ipAdresi: item.ipAdresi || "-",
            port: item.telnetPort ?? item.port ?? "-",
            macAdresi: item.macAdresi || "-",
            inputSayisi: item.inputSayisi ?? "-",
            outputSayisi: item.outputSayisi ?? "-",
            aktifMi: Boolean(item.aktifMi),
          }))
        : [];

      const irCihazlar = Array.isArray(irData)
        ? irData.map((item) => ({
            uniqueId: `pi-${item.id}`,
            id: item.id,
            cihazTipi: "Raspberry Pi",
            cihazTipiKey: "pi",
            cihazAdi: item.cihazAdi || "-",
            ipAdresi: item.ipAdresi || "-",
            port: "-",
            macAdresi: item.macAdresi || "-",
            inputSayisi: "-",
            outputSayisi: "-",
            aktifMi: Boolean(item.aktifMi),
          }))
        : [];

      setTumCihazlar([...ledCihazlar, ...matrixCihazlar, ...irCihazlar]);
    } finally {
      setAllLoading(false);
    }
  }, []);

  const handleAddClick = () => {
    if (activeTab === "led") {
      ledRef.current?.openCreateModal();
    }

    if (activeTab === "tv") {
      matrixRef.current?.openCreateModal();
    }

    if (activeTab === "pi") {
      piRef.current?.openCreateModal();
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Cihaz Yönetimi</h1>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-fit gap-2 rounded-xl bg-slate-900/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-6 py-2 font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {activeTab !== "all" && (
          <button
            type="button"
            onClick={handleAddClick}
            className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-500 hover:to-cyan-500"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{addButtonText[activeTab]}</span>
          </button>
        )}
      </div>

      {activeTab === "all" && (
        <CihazlarDataTable
          cihazlar={tumCihazlar}
          loading={allLoading}
          onRefresh={refreshTumCihazlar}
        />
      )}

      {activeTab === "led" && <LedProcessor ref={ledRef} />}

      {activeTab === "tv" && <Matrix ref={matrixRef} />}

      {activeTab === "pi" && <IrTransmitter ref={piRef} />}
    </div>
  );
};

export default Cihazlar;
