import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCheck,
  faSpinner,
  faTrophy,
  faPlus,
  faXmark,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

const MacModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  type,
  itemToEdit,
  actionLoading,
  ligSecenekleri = [],
}) => {
  const [ligArama, setLigArama] = useState("");
  const [manuelLigAdi, setManuelLigAdi] = useState("");

  const isTakim = type === "takim";

  // ================================================================
  // LİG ARAMA
  // ================================================================

  const filtrelenmisLigler = useMemo(() => {
    const arama = ligArama.trim().toLocaleLowerCase("tr-TR");

    if (!arama) {
      return ligSecenekleri;
    }

    return ligSecenekleri.filter((ligAdi) =>
      ligAdi.toLocaleLowerCase("tr-TR").includes(arama),
    );
  }, [ligSecenekleri, ligArama]);

  if (!isOpen) {
    return null;
  }

  // ================================================================
  // LİG SEÇİLİ Mİ?
  // ================================================================

  const ligSeciliMi = (ligAdi) => {
    if (!Array.isArray(formData.ligler)) {
      return false;
    }

    const normalizeLig = ligAdi.trim().toLocaleLowerCase("tr-TR");

    return formData.ligler.some(
      (lig) => lig.trim().toLocaleLowerCase("tr-TR") === normalizeLig,
    );
  };

  // ================================================================
  // LİG SEÇ / KALDIR
  // ================================================================

  const handleLigToggle = (ligAdi) => {
    if (actionLoading) {
      return;
    }

    const mevcutLigler = Array.isArray(formData.ligler) ? formData.ligler : [];

    const normalizedLig = ligAdi.trim().toLocaleLowerCase("tr-TR");

    const seciliMi = mevcutLigler.some(
      (lig) => lig.trim().toLocaleLowerCase("tr-TR") === normalizedLig,
    );

    if (seciliMi) {
      setFormData({
        ...formData,

        ligler: mevcutLigler.filter(
          (lig) => lig.trim().toLocaleLowerCase("tr-TR") !== normalizedLig,
        ),
      });

      return;
    }

    setFormData({
      ...formData,
      ligler: [...mevcutLigler, ligAdi.trim()],
    });
  };

  // ================================================================
  // MANUEL LİG EKLE
  // ================================================================

  const handleManuelLigEkle = () => {
    const yeniLig = manuelLigAdi.trim();

    if (!yeniLig || actionLoading) {
      return;
    }

    const mevcutLigler = Array.isArray(formData.ligler) ? formData.ligler : [];

    const normalizedYeniLig = yeniLig.toLocaleLowerCase("tr-TR");

    const zatenVarMi = mevcutLigler.some(
      (lig) => lig.trim().toLocaleLowerCase("tr-TR") === normalizedYeniLig,
    );

    if (!zatenVarMi) {
      setFormData({
        ...formData,
        ligler: [...mevcutLigler, yeniLig],
      });
    }

    setManuelLigAdi("");
  };

  const handleManuelLigKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleManuelLigEkle();
    }
  };

  // ================================================================
  // MODAL
  // ================================================================

  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        p-2

        sm:p-4
      "
      role="dialog"
      aria-modal="true"
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        onClick={!actionLoading ? onClose : undefined}
      />

      {/* MODAL */}
      <div
        className="
          relative
          flex
          max-h-[calc(100dvh-16px)]
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-slate-900
          shadow-2xl
          shadow-black/50

          sm:max-h-[calc(100dvh-32px)]
          sm:rounded-3xl
        "
      >
        {/* ÜST ÇİZGİ */}
        <div className="h-[3px] shrink-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-800/30 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-white sm:text-xl">
              {itemToEdit
                ? isTakim
                  ? "Takımı Düzenle"
                  : "Ligi Düzenle"
                : `Yeni ${isTakim ? "Takım" : "Lig"} Ekle`}
            </h3>

            {isTakim && (
              <p className="mt-1 text-xs text-slate-500">
                Takımın hangi liglerde takip edileceğini seçin.
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            type="button"
            disabled={actionLoading}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-slate-700
              bg-slate-800
              text-slate-400
              transition

              hover:border-red-400/30
              hover:bg-slate-700
              hover:text-red-400

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">
            {/* AD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                {isTakim ? "Takım Adı" : "Lig Adı"}
              </label>

              <input
                type="text"
                required
                disabled={actionLoading}
                value={formData.ad}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    ad: event.target.value,
                  })
                }
                placeholder={`Örn: ${isTakim ? "Galatasaray" : "Süper Lig"}`}
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-4
                  text-sm
                  text-white
                  outline-none
                  transition

                  placeholder:text-slate-600

                  focus:border-cyan-400
                  focus:ring-2
                  focus:ring-cyan-400/10

                  disabled:cursor-not-allowed
                  disabled:opacity-50

                  sm:h-14
                "
              />
            </div>

            {/* ======================================================
                TAKIM İÇİN LİG SEÇİMİ
            ====================================================== */}

            {isTakim && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                {/* BAŞLIK */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faTrophy}
                      className="text-sm text-amber-400"
                    />

                    <span className="text-sm font-bold text-white">
                      Takip Edilecek Ligler
                    </span>
                  </div>

                  <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-400">
                    {Array.isArray(formData.ligler)
                      ? formData.ligler.length
                      : 0}{" "}
                    seçili
                  </span>
                </div>

                {/* SEÇİLMİŞ LİGLER */}
                {Array.isArray(formData.ligler) &&
                  formData.ligler.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {formData.ligler.map((ligAdi) => (
                        <button
                          key={ligAdi}
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleLigToggle(ligAdi)}
                          className="
                            inline-flex
                            max-w-full
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-cyan-500/20
                            bg-cyan-500/10
                            px-2.5
                            py-1.5
                            text-[10px]
                            font-bold
                            text-cyan-300
                            transition

                            hover:border-red-500/20
                            hover:bg-red-500/10
                            hover:text-red-300

                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <span className="truncate">{ligAdi}</span>

                          <FontAwesomeIcon
                            icon={faXmark}
                            className="shrink-0 text-[9px]"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                {/* LİG ARAMA */}
                <div className="relative mb-2">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
                  />

                  <input
                    type="text"
                    value={ligArama}
                    disabled={actionLoading}
                    onChange={(event) => setLigArama(event.target.value)}
                    placeholder="Lig ara..."
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-slate-700
                      bg-slate-950
                      pl-9
                      pr-3
                      text-xs
                      text-slate-200
                      outline-none

                      placeholder:text-slate-600

                      focus:border-cyan-500

                      disabled:opacity-50
                    "
                  />
                </div>

                {/* LİG LİSTESİ */}
                <div className="max-h-48 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {filtrelenmisLigler.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-700 px-3 py-5 text-center">
                      <p className="text-xs text-slate-500">
                        Uygun lig bulunamadı.
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        Aşağıdaki alandan manuel ekleyebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    filtrelenmisLigler.map((ligAdi) => {
                      const selected = ligSeciliMi(ligAdi);

                      return (
                        <label
                          key={ligAdi}
                          className={`
                            flex
                            cursor-pointer
                            items-center
                            justify-between
                            gap-3
                            rounded-lg
                            border
                            px-3
                            py-2.5
                            transition

                            ${
                              selected
                                ? "border-cyan-500/30 bg-cyan-500/10"
                                : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/60"
                            }
                          `}
                        >
                          <span
                            className={`
                              min-w-0
                              truncate
                              text-xs
                              font-medium

                              ${selected ? "text-cyan-300" : "text-slate-300"}
                            `}
                          >
                            {ligAdi}
                          </span>

                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={actionLoading}
                            onChange={() => handleLigToggle(ligAdi)}
                            className="h-4 w-4 shrink-0 accent-cyan-500"
                          />
                        </label>
                      );
                    })
                  )}
                </div>

                {/* MANUEL LİG */}
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="mb-2 text-[10px] font-medium text-slate-500">
                    Listede bulunmayan bir organizasyonu manuel
                    ekleyebilirsiniz.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manuelLigAdi}
                      disabled={actionLoading}
                      onChange={(event) => setManuelLigAdi(event.target.value)}
                      onKeyDown={handleManuelLigKeyDown}
                      placeholder="Örn: UEFA Champions League"
                      className="
                        h-10
                        min-w-0
                        flex-1
                        rounded-lg
                        border
                        border-slate-700
                        bg-slate-950
                        px-3
                        text-xs
                        text-white
                        outline-none

                        placeholder:text-slate-600

                        focus:border-cyan-500

                        disabled:opacity-50
                      "
                    />

                    <button
                      type="button"
                      onClick={handleManuelLigEkle}
                      disabled={actionLoading || !manuelLigAdi.trim()}
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-cyan-500/20
                        bg-cyan-500/10
                        text-cyan-400
                        transition

                        hover:bg-cyan-500
                        hover:text-slate-950

                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                      title="Lig ekle"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================
                AKTİF / PASİF
            ====================================================== */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <label className="group flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <span className="block text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                    Sistemde Aktif Mi?
                  </span>

                  <span className="mt-1 block text-[10px] text-slate-600">
                    Pasif kayıtlar maç filtrelemesinde kullanılmaz.
                  </span>
                </div>

                <div className="relative inline-flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.aktifMi)}
                    disabled={actionLoading}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        aktifMi: event.target.checked,
                      })
                    }
                    className="peer sr-only"
                  />

                  <div
                    className="
                      h-6
                      w-11
                      rounded-full
                      bg-slate-700

                      after:absolute
                      after:left-[2px]
                      after:top-[2px]
                      after:h-5
                      after:w-5
                      after:rounded-full
                      after:border
                      after:border-gray-300
                      after:bg-white
                      after:transition-all
                      after:content-['']

                      peer-checked:bg-cyan-500
                      peer-checked:after:translate-x-full
                      peer-checked:after:border-white

                      peer-disabled:opacity-50
                    "
                  />
                </div>
              </label>
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="
              sticky
              bottom-0
              flex
              shrink-0
              items-center
              justify-end
              gap-3
              border-t
              border-slate-800
              bg-slate-900/95
              p-4
              backdrop-blur-md

              sm:px-6
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="
                rounded-xl
                bg-slate-800
                px-5
                py-3
                text-sm
                font-bold
                text-slate-300
                transition

                hover:bg-slate-700

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-cyan-500
                to-blue-500
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-cyan-500/20
                transition-all

                hover:from-cyan-400
                hover:to-blue-400

                disabled:cursor-not-allowed
                disabled:opacity-50

                sm:flex-none
              "
            >
              <FontAwesomeIcon
                icon={actionLoading ? faSpinner : faCheck}
                spin={actionLoading}
              />

              {actionLoading
                ? "Kaydediliyor..."
                : itemToEdit
                  ? "Değişiklikleri Kaydet"
                  : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default MacModal;
