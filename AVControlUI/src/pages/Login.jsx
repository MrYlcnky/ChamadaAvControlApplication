import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faArrowRightToBracket,
  faSpinner,
  faDisplay,
  faEye,
  faEyeSlash,
  faTv,
  faPowerOff,
  faCircleDot,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import api from "../services/api"; // Kendi dosya yolunuza göre kontrol edin

const Login = () => {
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(true); // Otomatik giriş durumu

  const navigate = useNavigate();

  // --- OTOMATİK GİRİŞ VE NORMAL TOKEN KONTROLÜ ---
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        // Tarayıcıdan gelen yönlendirme kaynağını al
        const referrer = document.referrer || "";

        // Portal IP'lerinden gelip gelmediğini kontrol et
        const isFromPortal =
          referrer.includes("172.16.0.36:90") ||
          referrer.includes("website:90");

        if (!isFromPortal) {
          // Portaldan GELİNMİYORSA normal işlemlere devam et
          setIsCheckingAutoLogin(false);
          const token = localStorage.getItem("token");
          if (token) {
            navigate("/kontrol-paneli", { replace: true });
          }
          return;
        }

        // Portaldan GELİNİYORSA AutoLogin servisini tetikle
        const searchParams = new URLSearchParams(window.location.search);
        const portalUserName = searchParams.get("username");

        const response = await api.get("/Auth/AutoLogin", {
          params: { kullaniciAdi: portalUserName },
        });

        const data = response.data;

        // Verileri local storage'a kaydet (.NET'ten gelen büyük/küçük harf durumlarına karşı önlem)
        localStorage.setItem("token", data.token || data.Token);
        localStorage.setItem(
          "kullaniciAdi",
          data.kullaniciAdi || data.KullaniciAdi,
        );
        localStorage.setItem("rol", data.rol || data.Rol || "Admin");

        toast.success(
          `Portal üzerinden giriş başarılı! Hoş geldin, ${data.kullaniciAdi || data.KullaniciAdi}`,
        );

        // UX için kısa bir gecikme
        setTimeout(() => {
          navigate("/kontrol-paneli", { replace: true });
        }, 500);
      } catch (error) {
        console.error("Auto login error:", error);
        setIsCheckingAutoLogin(false); // Hata varsa normal login ekranına düşür
      }
    };

    checkAutoLogin();
  }, [navigate]);

  // --- NORMAL GİRİŞ ---
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!kullaniciAdi || !sifre) {
      toast.warning("Lütfen kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/Auth/login", {
        kullaniciAdi,
        sifre,
      });

      localStorage.setItem("token", response.data.token || response.data.Token);
      localStorage.setItem(
        "kullaniciAdi",
        response.data.kullaniciAdi ||
          response.data.KullaniciAdi ||
          kullaniciAdi,
      );
      localStorage.setItem(
        "rol",
        response.data.rol || response.data.Rol || "Kullanici",
      );

      toast.success(`Hoş geldin, ${kullaniciAdi}!`);

      navigate("/kontrol-paneli", { replace: true });
    } catch (error) {
      const errorMsg =
        error.response?.data?.mesaj ||
        "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";

      toast.error(errorMsg);
      setSifre("");
    } finally {
      setLoading(false);
    }
  };

  // --- OTOMATİK GİRİŞ KONTROL EDİLİRKEN GÖSTERİLECEK YÜKLENİYOR EKRANI ---
  if (isCheckingAutoLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sora relative overflow-hidden">
        {/* Arka plan grid efekti */}
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(59,130,246,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.18)_1px,transparent_1px)] bg-[size:42px_42px]" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-5xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]"
          />
          <h2 className="text-sm font-bold text-blue-200 uppercase tracking-[0.3em] animate-pulse">
            Sistem Bağlantısı Kontrol Ediliyor...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 font-sora p-4">
      {/* Arka plan grid efekti */}
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(59,130,246,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.18)_1px,transparent_1px)] bg-[size:42px_42px]" />

      {/* Arka plan ışık topları */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse [animation-delay:700ms]" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1200ms]" />

      {/* Üst LED şerit */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl hidden sm:flex justify-between z-0">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            style={{ animationDelay: `${index * 100}ms` }}
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              index % 3 === 0
                ? "bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.9)]"
                : index % 3 === 1
                  ? "bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.9)]"
                  : "bg-indigo-400 shadow-[0_0_16px_rgba(129,140,248,0.9)]"
            }`}
          />
        ))}
      </div>

      {/* Sol TV ekranı */}
      <div className="hidden lg:block absolute left-10 xl:left-24 top-1/2 -translate-y-1/2 z-10 animate-bounce [animation-duration:5s]">
        <div className="relative">
          <div className="absolute -inset-8 bg-blue-500/20 rounded-[2rem] blur-3xl animate-pulse" />

          <div className="relative w-72 h-48 bg-slate-950 rounded-3xl border border-blue-400/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="absolute inset-3 rounded-2xl bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950 border border-blue-400/20 overflow-hidden">
              <div className="absolute inset-x-0 top-6 h-12 bg-cyan-300/10 blur-sm animate-bounce [animation-duration:2.5s]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_60%)] animate-pulse" />

              <div className="relative h-full flex flex-col items-center justify-center text-center">
                <FontAwesomeIcon
                  icon={faTv}
                  className="text-5xl text-blue-300 drop-shadow-[0_0_22px_rgba(96,165,250,0.95)] animate-pulse"
                />

                <p className="mt-3 text-xs tracking-[0.35em] text-blue-200/80">
                  SMART DISPLAY
                </p>

                <div className="mt-4 flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping [animation-delay:250ms]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping [animation-delay:500ms]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-24 h-3 bg-slate-800 rounded-b-xl border-x border-b border-blue-400/20" />
          <div className="mx-auto mt-2 w-40 h-2 bg-slate-900 rounded-full border border-blue-400/20" />
        </div>
      </div>

      {/* Sağ kumanda */}
      <div className="hidden lg:block absolute right-12 xl:right-28 bottom-16 z-10 animate-bounce [animation-duration:4s] [animation-delay:300ms]">
        <div className="relative">
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border border-cyan-400/50 animate-ping" />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border border-blue-400/30 animate-ping [animation-delay:350ms]" />
          <span className="absolute -top-14 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border border-indigo-400/20 animate-ping [animation-delay:700ms]" />

          <div className="relative w-28 h-64 rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 shadow-2xl shadow-black/60 p-4 rotate-[-5deg] hover:rotate-0 transition-transform duration-300">
            <div className="flex justify-center mb-5">
              <div className="w-10 h-10 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                <FontAwesomeIcon icon={faPowerOff} className="text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <span
                  key={item}
                  className="h-5 rounded-full bg-slate-700/90 border border-slate-600 shadow-inner"
                />
              ))}
            </div>

            <div className="mx-auto w-16 h-16 rounded-full border border-blue-400/40 bg-slate-900 flex items-center justify-center shadow-inner">
              <FontAwesomeIcon
                icon={faCircleDot}
                className="text-blue-300 animate-spin [animation-duration:3s]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Login Kartı */}
      <div className="relative z-20 w-full max-w-md">
        <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500/70 via-cyan-400/50 to-indigo-500/70 rounded-3xl blur-md opacity-80 animate-pulse" />

        <div className="relative bg-slate-950/85 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-950/50 border border-blue-400/20 p-8 sm:p-10 overflow-hidden transition-all duration-500 hover:-translate-y-1">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:600ms]" />

          <div className="text-center mb-10 relative z-10">
            <div className="relative inline-flex items-center justify-center mb-6">
              <span className="absolute w-28 h-28 rounded-full border border-blue-400/30 animate-ping" />
              <span className="absolute w-36 h-36 rounded-full border border-cyan-400/20 animate-ping [animation-delay:500ms]" />
              <span className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse" />

              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-900 shadow-2xl ring-1 ring-blue-400/30">
                <FontAwesomeIcon
                  icon={faDisplay}
                  className="text-5xl text-blue-400 drop-shadow-[0_0_18px_rgba(59,130,246,0.9)] animate-pulse"
                />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 drop-shadow-sm">
              AV<span className="font-light">CONTROL</span>
            </h1>

            <p className="mt-3 text-sm text-gray-400 tracking-wide">
              Sistem Yönetim Paneli
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-gray-500 group-focus-within:text-blue-400 transition-colors"
                />
              </div>

              <input
                type="text"
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/80 border border-blue-400/20 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                placeholder="Kullanıcı Adı"
                autoComplete="username"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faLock}
                  className="text-gray-500 group-focus-within:text-blue-400 transition-colors"
                />
              </div>

              <input
                type={showPassword ? "text" : "password"}
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-slate-900/80 border border-blue-400/20 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                placeholder="Şifre"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-400 focus:outline-none transition-colors cursor-pointer"
                title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group cursor-pointer w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4 relative overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                  <span>Sistem kontrol ediliyor...</span>
                </>
              ) : (
                <>
                  <span>Sisteme Giriş Yap</span>
                  <FontAwesomeIcon
                    icon={faArrowRightToBracket}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
