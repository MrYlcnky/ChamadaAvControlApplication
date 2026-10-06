import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTv,
  faMicrochip,
  faList,
  faUser,
  faCircle,
  faMobileScreen,
  faRightFromBracket,
  faGrip,
  faKey,
  faChevronDown,
  faFutbol,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import PasswordModal from "./PasswordModal";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);

  const kullaniciAdi = localStorage.getItem("kullaniciAdi") || "Kullanıcı";

  const rawRol = localStorage.getItem("rol");
  const safeRol = rawRol ? String(rawRol).toLowerCase() : "";

  const isAdmin = safeRol === "1" || safeRol === "admin";

  const rolAd = isAdmin ? "Sistem Yöneticisi" : "Normal Kullanıcı";

  // ================================================================
  // PROFİL DROPDOWN DIŞINA TIKLAMA
  // ================================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ================================================================
  // ÇIKIŞ
  // ================================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("kullaniciAdi");
    localStorage.removeItem("rol");

    sessionStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  // ================================================================
  // ŞİFRE MODALI
  // ================================================================

  const handleOpenPasswordModal = () => {
    setProfileDropdownOpen(false);
    setPasswordModalOpen(true);
  };

  // ================================================================
  // MENÜLER
  // ================================================================

  const allMenuItems = [
    {
      name: "Kontrol Paneli",
      path: "/kontrol-paneli",
      icon: faGrip,
    },
    {
      name: "Cihazlar",
      path: "/cihazlar",
      icon: faMicrochip,
    },
    {
      name: "Kumandalar",
      path: "/kumandalar",
      icon: faMobileScreen,
    },
    {
      name: "Kanallar",
      path: "/kanallar",
      icon: faList,
    },
    {
      name: "Maç Ayarları",
      path: "/mac-ayarlari",
      icon: faFutbol,
    },
    {
      name: "Kullanıcılar",
      path: "/kullanicilar",
      icon: faUser,
    },
  ];

  const menuItems = isAdmin
    ? allMenuItems
    : allMenuItems.filter((item) => item.path === "/kontrol-paneli");

  const isMenuActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const handleMenuClick = () => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  // ================================================================
  // JSX
  // ================================================================

  return (
    <div className="relative flex h-screen min-w-0 flex-col overflow-hidden bg-dark-bg font-sora text-gray-200">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="pointer-events-none absolute -left-32 -top-40 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="pointer-events-none absolute right-20 top-24 h-[300px] w-[300px] rounded-full bg-cyan-500/8 blur-3xl" />

      <div className="absolute left-0 right-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* ============================================================
          HEADER
      ============================================================ */}

      <header
        className="
          sticky
          top-0
          z-50
          shrink-0
          border-b
          border-blue-400/10
          bg-slate-950/85
          shadow-[0_10px_30px_rgba(0,0,0,0.25)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            flex
            h-20
            w-full
            min-w-0
            items-center
            justify-between
            gap-3
            px-3

            sm:h-24
            sm:px-5

            lg:px-6

            2xl:px-8
          "
        >
          {/* ========================================================
              LOGO
          ======================================================== */}

          <Link
            to="/kontrol-paneli"
            onClick={handleMenuClick}
            className="group flex min-w-0 shrink-0 items-center gap-3 sm:gap-4"
          >
            <div
              className="
                relative
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-gradient-to-br
                from-blue-600
                via-cyan-500
                to-indigo-600
                shadow-lg
                shadow-blue-500/20

                sm:h-14
                sm:w-14
                sm:rounded-2xl
              "
            >
              <FontAwesomeIcon
                icon={faTv}
                className="relative text-lg text-white drop-shadow-md sm:text-2xl"
              />
            </div>

            <div className="hidden min-w-0 sm:block">
              <h1
                className="
                  whitespace-nowrap
                  bg-gradient-to-r
                  from-blue-300
                  via-cyan-300
                  to-indigo-300
                  bg-clip-text
                  text-lg
                  font-extrabold
                  tracking-[0.16em]
                  text-transparent
                  drop-shadow-sm

                  lg:text-xl
                  lg:tracking-[0.20em]

                  2xl:text-2xl
                "
              >
                AV
                <span className="font-light">CONTROL</span>
              </h1>
            </div>
          </Link>

          {/* ========================================================
              DESKTOP NAV
              2XL VE ÜZERİ
          ======================================================== */}

          <nav
            className="
              hidden
              min-w-0
              items-center
              gap-1.5
              rounded-3xl
              border
              border-blue-400/10
              bg-slate-900/70
              p-2
              shadow-inner

              2xl:flex
            "
          >
            {menuItems.map((item) => {
              const isActive = isMenuActive(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleMenuClick}
                  className={`
                    group
                    relative
                    flex
                    items-center
                    gap-2
                    overflow-hidden
                    rounded-2xl
                    px-3
                    py-2.5
                    transition-colors
                    duration-200

                    ${
                      isActive
                        ? "bg-blue-500/10 text-cyan-300 shadow-lg shadow-blue-500/10"
                        : "text-gray-400 hover:bg-slate-800/80 hover:text-white"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
                  )}

                  <div
                    className={`
                      relative
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      transition-colors
                      duration-200

                      ${
                        isActive
                          ? "bg-cyan-400/10 text-cyan-300"
                          : "bg-slate-800 text-gray-400 group-hover:text-cyan-300"
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                  </div>

                  <p className="whitespace-nowrap text-xs font-bold">
                    {item.name}
                  </p>
                </Link>
              );
            })}
          </nav>

          {/* ========================================================
              SAĞ TARAF
          ======================================================== */}

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Kullanıcı Bilgisi */}
            <div
              className="
                hidden
                border-l
                border-blue-400/10
                pl-4
                text-right

                lg:block
              "
            >
              <div className="flex items-center justify-end gap-2">
                <FontAwesomeIcon
                  icon={faCircle}
                  className="text-[7px] text-emerald-500"
                />

                <p className="max-w-[150px] truncate text-sm font-bold text-gray-100">
                  {kullaniciAdi}
                </p>
              </div>

              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {rolAd}
              </p>
            </div>

            {/* PROFİL */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-tr
                  from-blue-600
                  via-cyan-500
                  to-indigo-500
                  text-white
                  shadow-lg
                  shadow-blue-500/20
                  transition-all

                  hover:shadow-cyan-500/30

                  sm:h-12
                  sm:w-12
                  sm:rounded-2xl
                "
                title="Kullanıcı Menüsü"
              >
                <FontAwesomeIcon icon={faUser} className="text-sm sm:text-lg" />

                <span
                  className="
                    absolute
                    -bottom-1
                    -right-1
                    flex
                    h-4
                    w-4
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-cyan-400/30
                    bg-slate-900

                    sm:h-5
                    sm:w-5
                  "
                >
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`
                      text-[7px]
                      text-cyan-300
                      transition-transform
                      duration-200

                      sm:text-[9px]

                      ${profileDropdownOpen ? "rotate-180" : ""}
                    `}
                  />
                </span>
              </button>

              {/* PROFILE DROPDOWN */}
              {profileDropdownOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-[calc(100%+12px)]
                    z-[90]
                    w-56
                    overflow-hidden
                    rounded-2xl
                    border
                    border-cyan-500/20
                    bg-slate-950/95
                    shadow-2xl
                    shadow-black/50
                    backdrop-blur-xl
                    animate-fade-in-up
                  "
                >
                  {/* MOBİLDE KULLANICI BİLGİSİ */}
                  <div className="border-b border-slate-800 px-4 py-3 lg:hidden">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faCircle}
                        className="text-[7px] text-emerald-500"
                      />

                      <p className="truncate text-sm font-bold text-white">
                        {kullaniciAdi}
                      </p>
                    </div>

                    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      {rolAd}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenPasswordModal}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-slate-300
                      transition-colors

                      hover:bg-slate-800/80
                      hover:text-white
                    "
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                      <FontAwesomeIcon icon={faKey} />
                    </div>

                    <span className="font-semibold">Şifre Değiştir</span>
                  </button>

                  {/* Mobil için çıkış */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      border-t
                      border-slate-800
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-red-400
                      transition-colors

                      hover:bg-red-500/10
                      hover:text-red-300

                      sm:hidden
                    "
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                      <FontAwesomeIcon icon={faRightFromBracket} />
                    </div>

                    <span className="font-semibold">Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>

            {/* DESKTOP / TABLET ÇIKIŞ */}
            <button
              type="button"
              onClick={handleLogout}
              className="
                hidden
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-red-500/20
                bg-red-500/10
                text-red-500
                transition-colors
                duration-200

                hover:bg-red-500
                hover:text-white

                sm:flex

                sm:h-12
                sm:w-12
                sm:rounded-2xl
              "
              title="Çıkış Yap"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>

            {/* ======================================================
                MOBILE / TABLET MENU BUTTON
            ====================================================== */}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((prev) => !prev);

                setProfileDropdownOpen(false);
              }}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-blue-400/15
                bg-slate-900
                text-cyan-300
                transition

                hover:border-cyan-400/30
                hover:bg-cyan-500/10

                sm:h-12
                sm:w-12
                sm:rounded-2xl

                2xl:hidden
              "
              aria-label="Menüyü Aç"
            >
              <FontAwesomeIcon
                icon={mobileMenuOpen ? faXmark : faBars}
                className="text-lg"
              />
            </button>
          </div>
        </div>

        {/* ==========================================================
            MOBILE / TABLET NAVIGATION
        ========================================================== */}

        {mobileMenuOpen && (
          <div
            className="
              absolute
              left-0
              right-0
              top-full
              z-[70]
              border-b
              border-blue-400/10
              bg-slate-950/95
              shadow-2xl
              shadow-black/40
              backdrop-blur-xl

              2xl:hidden
            "
          >
            <div
              className="
                mx-auto
                grid
                max-h-[calc(100dvh-80px)]
                grid-cols-1
                gap-2
                overflow-y-auto
                p-3

                sm:grid-cols-2
                sm:p-4

                lg:grid-cols-3
              "
            >
              {menuItems.map((item) => {
                const isActive = isMenuActive(item.path);

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={handleMenuClick}
                    className={`
                      relative
                      flex
                      min-w-0
                      items-center
                      gap-3
                      overflow-hidden
                      rounded-2xl
                      border
                      px-4
                      py-3
                      transition-all

                      ${
                        isActive
                          ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                          : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
                    )}

                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl

                        ${
                          isActive
                            ? "bg-cyan-400/10 text-cyan-300"
                            : "bg-slate-800 text-slate-400"
                        }
                      `}
                    >
                      <FontAwesomeIcon icon={item.icon} />
                    </div>

                    <span className="truncate text-sm font-bold">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ============================================================
          MAIN
      ============================================================ */}

      <main
        className="
          relative
          min-h-0
          min-w-0
          flex-1
          overflow-auto
          p-2

          sm:p-3

          lg:p-4
        "
      >
        <div className="relative min-h-full min-w-0 w-full">
          <Outlet />
        </div>
      </main>

      {/* ============================================================
          PASSWORD MODAL
      ============================================================ */}

      <PasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
