import { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPlus,
  faPenToSquare,
  faTrash,
  faMobileScreen,
  faKeyboard,
  faSpinner,
  faMagnifyingGlass,
  faXmark,
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";

import { toast } from "react-toastify";
import Swal from "sweetalert2";

import remoteControlService from "../services/remoteControlService";
import remoteButtonService from "../services/remoteButtonService";
import irTransmitterService from "../services/irTransmitterService";
import orchestrationService from "../services/orchestrationService";

import RemoteControlModal from "../components/kumandalar/RemoteControlModal";
import RemoteButtonModal from "../components/kumandalar/RemoteButtonModal";

// ================================================================
// PAGINATION
// ================================================================

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

// ================================================================
// COMPONENT
// ================================================================

const Kumandalar = () => {
  const [activeTab, setActiveTab] = useState("profiller");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [kumandalar, setKumandalar] = useState([]);

  const [tuslar, setTuslar] = useState([]);

  const [piList, setPiList] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalMode, setModalMode] = useState("ekle");

  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({});

  // ==============================================================
  // DATATABLE STATE
  // ==============================================================

  const [searchTerm, setSearchTerm] = useState("");

  const [pageSize, setPageSize] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const isProfileTab = activeTab === "profiller";

  // ==============================================================
  // İLK YÜKLEME
  // ==============================================================

  useEffect(() => {
    let iptalEdildi = false;

    const loadData = async () => {
      try {
        if (activeTab === "profiller") {
          const data = await remoteControlService.getAll();

          if (!iptalEdildi) {
            setKumandalar(Array.isArray(data) ? data : []);
          }

          return;
        }

        const [kData, tData, pData] = await Promise.all([
          remoteControlService.getAll(),
          remoteButtonService.getAll(),
          irTransmitterService.getAll(),
        ]);

        if (iptalEdildi) {
          return;
        }

        const safeKumandalar = Array.isArray(kData) ? kData : [];

        const safeTuslar = Array.isArray(tData) ? tData : [];

        const safePiList = Array.isArray(pData) ? pData : [];

        const enrichedTuslar = safeTuslar.map((tus) => ({
          ...tus,

          kumandaMarkaModel:
            tus.kumandaMarkaModel ||
            safeKumandalar.find((kumanda) => kumanda.id === tus.remoteControlId)
              ?.kumandaMarkaModel ||
            "Bilinmiyor",
        }));

        setKumandalar(safeKumandalar);

        setTuslar(enrichedTuslar);

        setPiList(safePiList);
      } catch {
        if (!iptalEdildi) {
          toast.error("Veriler yüklenirken hata oluştu.");
        }
      } finally {
        if (!iptalEdildi) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      iptalEdildi = true;
    };
  }, [activeTab]);

  // ==============================================================
  // REFRESH
  // ==============================================================

  const refreshData = async () => {
    try {
      setLoading(true);

      if (activeTab === "profiller") {
        const data = await remoteControlService.getAll();

        setKumandalar(Array.isArray(data) ? data : []);

        return;
      }

      const [kData, tData, pData] = await Promise.all([
        remoteControlService.getAll(),
        remoteButtonService.getAll(),
        irTransmitterService.getAll(),
      ]);

      const safeKumandalar = Array.isArray(kData) ? kData : [];

      const safeTuslar = Array.isArray(tData) ? tData : [];

      const safePiList = Array.isArray(pData) ? pData : [];

      const enrichedTuslar = safeTuslar.map((tus) => ({
        ...tus,

        kumandaMarkaModel:
          tus.kumandaMarkaModel ||
          safeKumandalar.find((kumanda) => kumanda.id === tus.remoteControlId)
            ?.kumandaMarkaModel ||
          "Bilinmiyor",
      }));

      setKumandalar(safeKumandalar);

      setTuslar(enrichedTuslar);

      setPiList(safePiList);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // TAB DEĞİŞİMİ
  // ==============================================================

  const handleTabChange = (tab) => {
    if (tab === activeTab) {
      return;
    }

    setLoading(true);
    setActiveTab(tab);

    setIsModalOpen(false);
    setSelectedId(null);
    setFormData({});

    setSearchTerm("");
    setCurrentPage(1);
  };

  // ==============================================================
  // MODAL
  // ==============================================================

  const openModal = (mode, item = null) => {
    setModalMode(mode);

    setSelectedId(item?.id ?? null);

    if (activeTab === "profiller") {
      setFormData(
        mode === "duzenle" && item
          ? { ...item }
          : {
              cihazTipi: "",
              kumandaMarkaModel: "",
              protokolTipi: "",
              aktifMi: true,
            },
      );
    } else {
      setFormData(
        mode === "duzenle" && item
          ? { ...item }
          : {
              remoteControlId: "",
              tusKodu: "",
              rawDataJson: "",
              aktifMi: true,
            },
      );
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setIsModalOpen(false);
    setSelectedId(null);
    setFormData({});
  };

  // ==============================================================
  // EKLE / GÜNCELLE
  // ==============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);

      if (activeTab === "profiller") {
        const payload = {
          ...formData,
        };

        if (modalMode === "duzenle") {
          payload.id = selectedId;

          await remoteControlService.update(payload);
        } else {
          await remoteControlService.create(payload);
        }
      } else {
        const payload = {
          ...formData,

          remoteControlId: parseInt(formData.remoteControlId, 10),
        };

        if (modalMode === "duzenle") {
          payload.id = selectedId;

          await remoteButtonService.update(payload);
        } else {
          await remoteButtonService.create(payload);
        }
      }

      toast.success("İşlem başarılı!");

      setIsModalOpen(false);
      setSelectedId(null);
      setFormData({});

      await refreshData();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || "Hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================
  // SİL
  // ==============================================================

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",

      text: isProfileTab
        ? "Bu kumanda profili silinecek."
        : "Bu tuş sinyali silinecek.",

      icon: "warning",

      showCancelButton: true,

      background: "#0f172a",
      color: "#e5e7eb",

      confirmButtonText: "Evet, Sil",

      cancelButtonText: "İptal",

      confirmButtonColor: "#dc2626",

      cancelButtonColor: "#334155",

      reverseButtons: true,
      focusCancel: true,

      customClass: {
        popup: "rounded-3xl border border-slate-700 shadow-2xl",

        title: "text-white",

        htmlContainer: "text-slate-400",

        confirmButton: "rounded-xl px-5 py-2 font-bold",

        cancelButton: "rounded-xl px-5 py-2 font-bold",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      if (activeTab === "profiller") {
        await remoteControlService.delete(id);
      } else {
        await remoteButtonService.delete(id);
      }

      toast.success("Başarıyla silindi.");

      await refreshData();
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  // ==============================================================
  // IR SİNYAL ÖĞREN
  // ==============================================================

  const handleCaptureSignal = async (payload) => {
    return await orchestrationService.learnSignal(payload);
  };

  // ==============================================================
  // DATATABLE - ARAMA
  // ==============================================================

  const filteredTuslar = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("tr-TR");

    if (!query) {
      return tuslar;
    }

    return tuslar.filter((item) => {
      const searchableText = [
        item.kumandaMarkaModel,
        item.tusKodu,
        item.rawDataJson,
        item.remoteControlId,
        item.aktifMi ? "aktif" : "pasif",
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return searchableText.includes(query);
    });
  }, [tuslar, searchTerm]);

  // ==============================================================
  // DATATABLE - PAGINATION
  // ==============================================================

  const totalRecords = filteredTuslar.length;

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;

  const endIndex = startIndex + pageSize;

  const paginatedTuslar = filteredTuslar.slice(startIndex, endIndex);

  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  const firstVisibleRecord = totalRecords === 0 ? 0 : startIndex + 1;

  const lastVisibleRecord = Math.min(endIndex, totalRecords);

  // ==============================================================
  // SEARCH
  // ==============================================================

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);

    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));

    setCurrentPage(1);
  };

  // ==============================================================
  // JSX
  // ==============================================================

  return (
    <div
      className="
        w-full
        min-w-0
        p-3

        sm:p-4

        lg:p-6
      "
    >
      {/* ============================================================
          HEADER
      ============================================================ */}

      <h1
        className="
          mb-5
          text-xl
          font-bold
          text-white

          sm:text-2xl
        "
      >
        Kumanda & Sinyal Yönetimi
      </h1>

      {/* ============================================================
          TAB + EKLE
      ============================================================ */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4

          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        <div
          className="
            flex
            w-full
            gap-1
            overflow-x-auto
            rounded-xl
            bg-slate-900/50
            p-1

            sm:w-fit
            sm:gap-2
          "
        >
          <button
            type="button"
            onClick={() => handleTabChange("profiller")}
            className={`
              flex
              min-w-max
              flex-1
              items-center
              justify-center
              rounded-lg
              px-3
              py-2
              text-xs
              font-medium
              transition-all

              sm:flex-none
              sm:px-6
              sm:text-sm

              ${
                activeTab === "profiller"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }
            `}
          >
            <FontAwesomeIcon icon={faMobileScreen} className="mr-2" />
            Kumanda Profilleri
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("tuslar")}
            className={`
              flex
              min-w-max
              flex-1
              items-center
              justify-center
              rounded-lg
              px-3
              py-2
              text-xs
              font-medium
              transition-all

              sm:flex-none
              sm:px-6
              sm:text-sm

              ${
                activeTab === "tuslar"
                  ? "bg-cyan-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }
            `}
          >
            <FontAwesomeIcon icon={faKeyboard} className="mr-2" />
            Tuşlar & Sinyaller
          </button>
        </div>

        <button
          type="button"
          onClick={() => openModal("ekle")}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-2xl
            bg-gradient-to-r
            from-blue-600
            to-cyan-600
            px-5
            py-3
            font-semibold
            text-white
            shadow-lg
            shadow-blue-500/20
            transition-colors

            hover:from-blue-500
            hover:to-cyan-500

            sm:w-auto
          "
        >
          <FontAwesomeIcon icon={faPlus} />

          <span>
            {activeTab === "profiller" ? "Yeni Kumanda" : "Yeni Tuş Sinyali"}
          </span>
        </button>
      </div>

      {/* ============================================================
          KUMANDA PROFİLLERİ
      ============================================================ */}

      {isProfileTab ? (
        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-blue-400/10
            bg-slate-900/80
            shadow-xl
            shadow-black/20
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Marka / Model</th>

                  <th className="px-6 py-4 font-semibold">Cihaz Tipi</th>

                  <th className="px-6 py-4 font-semibold">Protokol</th>

                  <th className="px-6 py-4 text-center font-semibold">Durum</th>

                  <th className="px-6 py-4 text-right font-semibold">
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl text-cyan-400"
                      />

                      <p className="mt-3 text-sm text-slate-400">
                        Veriler yükleniyor...
                      </p>
                    </td>
                  </tr>
                ) : kumandalar.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <p className="font-bold text-slate-200">
                        Kayıt bulunamadı
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Yeni kayıt ekleyerek başlayabilirsiniz.
                      </p>
                    </td>
                  </tr>
                ) : (
                  kumandalar.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 font-bold text-white">
                        {item.kumandaMarkaModel}
                      </td>

                      <td className="px-6 py-4">{item.cihazTipi}</td>

                      <td className="px-6 py-4 font-mono text-cyan-300">
                        {item.protokolTipi || "-"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <StatusBadge aktifMi={item.aktifMi} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <ActionButtons
                          item={item}
                          openModal={openModal}
                          handleDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==========================================================
            TUŞLAR & SİNYALLER DATATABLE
        ========================================================== */

        <div
          className="
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-cyan-400/10
            bg-slate-900/80
            shadow-xl
            shadow-black/20
          "
        >
          {/* ========================================================
              DATATABLE TOOLBAR
          ======================================================== */}

          <div
            className="
              flex
              flex-col
              gap-4
              border-b
              border-slate-800
              bg-slate-950/30
              p-4

              lg:flex-row
              lg:items-center
              lg:justify-between

              sm:p-5
            "
          >
            {/* SEARCH */}
            <div
              className="
                relative
                w-full

                lg:max-w-md
              "
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-sm
                  text-slate-500
                "
              />

              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Kumanda, tuş kodu veya sinyal ara..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/70
                  pl-11
                  pr-11
                  text-sm
                  text-white
                  outline-none
                  transition

                  placeholder:text-slate-600

                  focus:border-cyan-500/60
                  focus:ring-2
                  focus:ring-cyan-500/10
                "
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="
                    absolute
                    right-3
                    top-1/2
                    flex
                    h-7
                    w-7
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    transition

                    hover:bg-slate-800
                    hover:text-white
                  "
                  title="Aramayı temizle"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>

            {/* PAGE SIZE */}
            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                gap-3

                lg:justify-end
              "
            >
              <div className="text-xs text-slate-500">
                Toplam{" "}
                <span className="font-bold text-slate-300">{totalRecords}</span>{" "}
                kayıt
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-xs text-slate-500">
                  Göster
                </label>

                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="
                    h-10
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    px-3
                    text-sm
                    font-semibold
                    text-slate-300
                    outline-none

                    focus:border-cyan-500/60
                  "
                >
                  <option value={10}>10</option>

                  <option value={25}>25</option>

                  <option value={50}>50</option>

                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================
              TABLE
          ======================================================== */}

          <div className="overflow-x-auto">
            <table
              className="
                w-full
                min-w-[900px]
                border-collapse
                text-left
                text-sm
                text-slate-300
              "
            >
              <thead
                className="
                  border-b
                  border-slate-800
                  bg-slate-950/50
                  text-xs
                  uppercase
                  tracking-widest
                  text-slate-400
                "
              >
                <tr>
                  <th className="w-[70px] px-5 py-4 text-center font-semibold">
                    #
                  </th>

                  <th className="px-5 py-4 font-semibold">Bağlı Kumanda</th>

                  <th className="px-5 py-4 font-semibold">Tuş Kodu</th>

                  <th className="px-5 py-4 font-semibold">Raw Sinyal</th>

                  <th className="w-[120px] px-5 py-4 text-center font-semibold">
                    Durum
                  </th>

                  <th className="w-[130px] px-5 py-4 text-right font-semibold">
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl text-cyan-400"
                      />

                      <p className="mt-3 text-sm text-slate-400">
                        Veriler yükleniyor...
                      </p>
                    </td>
                  </tr>
                ) : paginatedTuslar.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div
                        className="
                          mx-auto
                          mb-4
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-2xl
                          border
                          border-slate-700
                          bg-slate-800/50
                          text-slate-500
                        "
                      >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                      </div>

                      <p className="font-bold text-slate-200">
                        {searchTerm
                          ? "Arama sonucu bulunamadı"
                          : "Kayıt bulunamadı"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {searchTerm
                          ? "Farklı bir arama ifadesi deneyebilirsiniz."
                          : "Yeni tuş sinyali ekleyerek başlayabilirsiniz."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedTuslar.map((item, index) => (
                    <tr
                      key={item.id}
                      className="
                          transition-colors

                          hover:bg-slate-800/40
                        "
                    >
                      {/* SIRA */}
                      <td className="px-5 py-4 text-center font-mono text-xs text-slate-500">
                        {startIndex + index + 1}
                      </td>

                      {/* KUMANDA */}
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-cyan-500/15
                                bg-cyan-500/10
                                text-cyan-400
                              "
                          >
                            <FontAwesomeIcon icon={faMobileScreen} />
                          </div>

                          <span
                            className="
                                max-w-[220px]
                                truncate
                                font-bold
                                text-cyan-300
                              "
                            title={item.kumandaMarkaModel}
                          >
                            {item.kumandaMarkaModel}
                          </span>
                        </div>
                      </td>

                      {/* TUŞ KODU */}
                      <td className="px-5 py-4">
                        <span
                          className="
                              inline-flex
                              rounded-lg
                              border
                              border-blue-500/20
                              bg-blue-500/10
                              px-2.5
                              py-1
                              font-mono
                              text-xs
                              font-bold
                              text-blue-300
                            "
                        >
                          {item.tusKodu}
                        </span>
                      </td>

                      {/* RAW */}
                      <td className="px-5 py-4">
                        <div
                          title={item.rawDataJson || "-"}
                          className="
                              max-w-[350px]
                              truncate
                              rounded-lg
                              bg-slate-950/60
                              px-3
                              py-2
                              font-mono
                              text-[10px]
                              text-slate-500
                            "
                        >
                          {item.rawDataJson || "-"}
                        </div>
                      </td>

                      {/* DURUM */}
                      <td className="px-5 py-4 text-center">
                        <StatusBadge aktifMi={item.aktifMi} />
                      </td>

                      {/* İŞLEM */}
                      <td className="px-5 py-4 text-right">
                        <ActionButtons
                          item={item}
                          openModal={openModal}
                          handleDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================
              PAGINATION FOOTER
          ======================================================== */}

          {!loading && (
            <div
              className="
                flex
                flex-col
                gap-4
                border-t
                border-slate-800
                bg-slate-950/30
                px-4
                py-4

                lg:flex-row
                lg:items-center
                lg:justify-between

                sm:px-5
              "
            >
              {/* KAYIT BİLGİSİ */}
              <div className="text-center text-xs text-slate-500 lg:text-left">
                <span className="font-semibold text-slate-300">
                  {firstVisibleRecord}
                </span>

                {" - "}

                <span className="font-semibold text-slate-300">
                  {lastVisibleRecord}
                </span>

                {" / "}

                <span className="font-semibold text-slate-300">
                  {totalRecords}
                </span>

                {" kayıt gösteriliyor"}
              </div>

              {/* PAGINATION */}
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-center
                  gap-1.5

                  lg:justify-end
                "
              >
                {/* İLK SAYFA */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    text-slate-400
                    transition

                    hover:border-cyan-500/40
                    hover:text-cyan-300

                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                  title="İlk Sayfa"
                >
                  <FontAwesomeIcon icon={faAnglesLeft} />
                </button>

                {/* ÖNCEKİ */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.max(1, safeCurrentPage - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    text-slate-400
                    transition

                    hover:border-cyan-500/40
                    hover:text-cyan-300

                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                  title="Önceki Sayfa"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                {/* SAYFALAR */}
                {paginationItems.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="
                            flex
                            h-9
                            min-w-7
                            items-center
                            justify-center
                            text-xs
                            font-bold
                            text-slate-600
                          "
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = page === safeCurrentPage;

                  return (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                          flex
                          h-9
                          min-w-9
                          items-center
                          justify-center
                          rounded-lg
                          border
                          px-2
                          text-xs
                          font-bold
                          transition

                          ${
                            isActive
                              ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.10)]"
                              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-500/30 hover:text-white"
                          }
                        `}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* SONRAKİ */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    text-slate-400
                    transition

                    hover:border-cyan-500/40
                    hover:text-cyan-300

                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                  title="Sonraki Sayfa"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>

                {/* SON SAYFA */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    text-slate-400
                    transition

                    hover:border-cyan-500/40
                    hover:text-cyan-300

                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                  title="Son Sayfa"
                >
                  <FontAwesomeIcon icon={faAnglesRight} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          MODALS
      ============================================================ */}

      {activeTab === "profiller" ? (
        <RemoteControlModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          modalMode={modalMode}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          actionLoading={actionLoading}
        />
      ) : (
        <RemoteButtonModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          modalMode={modalMode}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          actionLoading={actionLoading}
          kumandalarList={kumandalar}
          piList={piList}
          captureSignal={handleCaptureSignal}
        />
      )}
    </div>
  );
};

// ==================================================================
// DURUM BADGE
// ==================================================================

const StatusBadge = ({ aktifMi }) => {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-bold

        ${
          aktifMi
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/20 bg-red-500/10 text-red-400"
        }
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full

          ${aktifMi ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-red-400"}
        `}
      />

      {aktifMi ? "Aktif" : "Pasif"}
    </span>
  );
};

// ==================================================================
// İŞLEM BUTONLARI
// ==================================================================

const ActionButtons = ({ item, openModal, handleDelete }) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => openModal("duzenle", item)}
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-xl
          bg-slate-800
          text-cyan-400
          transition-colors

          hover:bg-cyan-500
          hover:text-white
        "
        title="Düzenle"
      >
        <FontAwesomeIcon icon={faPenToSquare} />
      </button>

      <button
        type="button"
        onClick={() => handleDelete(item.id)}
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-xl
          bg-slate-800
          text-red-400
          transition-colors

          hover:bg-red-500
          hover:text-white
        "
        title="Sil"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  );
};

export default Kumandalar;
