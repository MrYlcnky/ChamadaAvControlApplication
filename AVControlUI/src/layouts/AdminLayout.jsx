import { useState, useRef, useEffect } from "react";
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
  faFutbol, // <-- Yeni Eklendi
} from "@fortawesome/free-solid-svg-icons";

import PasswordModal from "./PasswordModal";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const profileRef = useRef(null);

  const kullaniciAdi = localStorage.getItem("kullaniciAdi") || "Kullanıcı";

  const rawRol = localStorage.getItem("rol");
  const safeRol = rawRol ? String(rawRol).toLowerCase() : "";
  const isAdmin = safeRol === "1" || safeRol === "admin";

  const rolAd = isAdmin ? "Sistem Yöneticisi" : "Normal Kullanıcı";

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("kullaniciAdi");
    localStorage.removeItem("rol");
    sessionStorage.clear();

    navigate("/login", { replace: true });
  };

  const handleOpenPasswordModal = () => {
    setProfileDropdownOpen(false);
    setPasswordModalOpen(true);
  };

  const allMenuItems = [
    {
      name: "Kontrol Paneli",
      path: "/kontrol-paneli",
      icon: faGrip,
      description: "",
    },
    {
      name: "Cihazlar",
      path: "/cihazlar",
      icon: faMicrochip,
      description: "",
    },
    {
      name: "Kumandalar",
      path: "/kumandalar",
      icon: faMobileScreen,
      description: "",
    },
    {
      name: "Kanallar",
      path: "/kanallar",
      icon: faList,
      description: "",
    },
    {
      name: "Maç Ayarları", // <-- Yeni Eklendi
      path: "/mac-ayarlari",
      icon: faFutbol,
      description: "",
    },
    {
      name: "Kullanıcılar",
      path: "/kullanicilar",
      icon: faUser,
      description: "",
    },
  ];

  const menuItems = isAdmin
    ? allMenuItems
    : allMenuItems.filter((item) => item.path === "/kontrol-paneli");

  return (
    <div className="relative flex flex-col h-screen min-w-[1180px] overflow-hidden font-sora bg-dark-bg text-gray-200">
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute -top-40 -left-32 w-[360px] h-[360px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute top-24 right-20 w-[300px] h-[300px] rounded-full bg-cyan-500/8 blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-[3px] z-[60] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <header className="relative h-24 bg-slate-950/75 backdrop-blur-xl border-b border-blue-400/10 sticky top-0 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="max-w-[1680px] mx-auto px-8 h-full flex items-center justify-between gap-8">
          <Link to="/kontrol-paneli" className="flex items-center gap-4 group">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
              <FontAwesomeIcon
                icon={faTv}
                className="relative text-white text-2xl drop-shadow-md"
              />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-[0.22em] bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 drop-shadow-sm">
                AV<span className="font-light">CONTROL</span>
              </h1>
            </div>
          </Link>

          <nav className="flex items-center gap-3 px-3 py-3 rounded-3xl bg-slate-900/70 border border-blue-400/10 shadow-inner">
            {menuItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative group flex items-center gap-3 px-5 py-3 rounded-2xl overflow-hidden transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-500/10 text-cyan-300 shadow-lg shadow-blue-500/10"
                      : "text-gray-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
                  )}

                  <div
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                      isActive
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "bg-slate-800 text-gray-400 group-hover:text-cyan-300"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                  </div>

                  <div className="relative leading-tight">
                    <p className="text-sm font-bold">{item.name}</p>
                    {item.description && (
                      <p className="text-[10px] opacity-60">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pl-5 border-l border-blue-400/10">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className="text-[7px] text-emerald-500"
                  />

                  <p className="text-sm font-bold text-gray-100">
                    {kullaniciAdi}
                  </p>
                </div>

                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {rolAd}
                </p>
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all"
                  title="Kullanıcı Menüsü"
                >
                  <FontAwesomeIcon icon={faUser} className="text-lg" />

                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-cyan-400/30 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`text-[9px] text-cyan-300 transition-transform duration-200 ${
                        profileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+14px)] w-48 rounded-2xl bg-slate-950/95 border border-cyan-500/20 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden z-[80] animate-fade-in-up">
                    <button
                      type="button"
                      onClick={handleOpenPasswordModal}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                        <FontAwesomeIcon icon={faKey} />
                      </div>
                      <span className="font-semibold">Şifre Değiştir</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors duration-200"
                title="Çıkış Yap"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-auto p-8">
        <div className="relative max-w-[1680px] mx-auto min-h-full">
          <Outlet />
        </div>
      </main>

      <PasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
