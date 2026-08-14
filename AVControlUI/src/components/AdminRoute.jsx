import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const rawRol = localStorage.getItem("rol");

  // 1. Güvenlik Katmanı: Rol hiç yoksa, string olarak "null" veya "undefined" kaldıysa
  // veya sadece boşluktan ibaretse anında reddet.
  if (
    !rawRol ||
    rawRol === "null" ||
    rawRol === "undefined" ||
    rawRol.trim() === ""
  ) {
    return <Navigate to="/kontrol-paneli" replace />;
  }

  // 2. Güvenlik Katmanı: Gelen veriyi küçük harfe çevir ve etrafındaki boşlukları temizle
  const safeRol = String(rawRol).toLowerCase().trim();

  // Eğer rol "1" VEYA "admin" DEĞİLSE, Kontrol paneline at
  if (safeRol !== "1" && safeRol !== "admin") {
    return <Navigate to="/kontrol-paneli" replace />;
  }

  return children;
};

export default AdminRoute;
