import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // LocalStorage'dan token'ı okumaya çalışıyoruz
  const token = localStorage.getItem("token");

  // Gelişmiş Kontrol: Token hiç yoksa, string olarak "null" veya "undefined" kaldıysa
  // veya sadece boşluktan oluşuyorsa logine yönlendir.
  if (
    !token ||
    token === "null" ||
    token === "undefined" ||
    token.trim() === ""
  ) {
    return <Navigate to="/login" replace />;
  }

  // Eğer geçerli bir token VARSA, gitmek istediği sayfayı (children) ekranda göster
  return children;
};

export default ProtectedRoute;
