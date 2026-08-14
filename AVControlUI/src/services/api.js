import axios from "axios";
import Swal from "sweetalert2"; // 🔥 SweetAlert2 içeri alındı

// 1. Axios örneğini (instance) oluşturuyoruz
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. REQUEST INTERCEPTOR (Giden İstekleri Yakalama)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Eğer kullanıcının token'ı varsa, "Authorization" başlığına ekle
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. RESPONSE INTERCEPTOR (Gelen Cevapları Yakalama)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Hatanın geldiği isteğin URL'sini alıyoruz
    const originalRequest = error.config;

    // 🔥 DÜZELTME: Hata login VEYA autologin endpoint'inden geliyorsa global yakalayıcı devreye girmesin!
    const isLoginRequest =
      originalRequest.url.includes("/login") ||
      originalRequest.url.includes("/AutoLogin");

    // 401: Yetkisiz/Token süresi dolmuş
    // 403: Yasaklı/Bu işlemi yapmaya rolü yetmiyor
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !isLoginRequest // Login veya AutoLogin isteği DEĞİLSE bu bloğa gir
    ) {
      // Hafızadaki geçersiz verileri temizle
      localStorage.removeItem("token");
      localStorage.removeItem("kullaniciAdi");
      localStorage.removeItem("rol");
      sessionStorage.clear();

      Swal.fire({
        title: "Oturum Süresi Doldu",
        text: "Güvenliğiniz için oturumunuz sonlandırıldı. Lütfen tekrar giriş yapınız.",
        icon: "warning",
        confirmButtonText: "Tekrar Giriş Yap",
        confirmButtonColor: "#06b6d4",
        background: "#0f172a",
        color: "#f8fafc",
        allowOutsideClick: false, // Dışarı tıklamayı engeller
        allowEscapeKey: false, // ESC tuşunu engeller
        customClass: {
          popup: "rounded-[2rem] border border-slate-700/50 shadow-2xl",
          confirmButton:
            "px-6 py-2.5 rounded-xl font-bold transition-all text-sm",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          // Kullanıcı butona tıkladığında zorla Login sayfasına yönlendir
          window.location.href = "/login";
        }
      });
    }

    return Promise.reject(error);
  },
);

export default api;
