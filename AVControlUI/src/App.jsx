import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import KullaniciYonetimi from "./pages/KullaniciYonetimi";
import Cihazlar from "./pages/Cihazlar";
import Kumandalar from "./pages/Kumandalar";
import Kanallar from "./pages/ChannelList";
import KontrolPaneli from "./pages/KontrolPaneli";
import MacAyarlari from "./pages/MacAyarlari";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <Routes>
        {/* === HERKESE AÇIK ROTALAR === */}
        <Route path="/login" element={<Login />} />

        {/* === KORUMALI ROTALAR === */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/kontrol-paneli" replace />} />

          {/* Admin ve Kullanici ortak sayfa */}
          <Route path="kontrol-paneli" element={<KontrolPaneli />} />

          {/* Sadece Admin */}
          <Route
            path="kullanicilar"
            element={
              <AdminRoute>
                <KullaniciYonetimi />
              </AdminRoute>
            }
          />

          <Route
            path="cihazlar"
            element={
              <AdminRoute>
                <Cihazlar />
              </AdminRoute>
            }
          />

          <Route
            path="kumandalar"
            element={
              <AdminRoute>
                <Kumandalar />
              </AdminRoute>
            }
          />

          <Route
            path="kanallar"
            element={
              <AdminRoute>
                <Kanallar />
              </AdminRoute>
            }
          />

          {/* Yeni Eklenen: Maç Ayarları Rotası */}
          <Route
            path="mac-ayarlari"
            element={
              <AdminRoute>
                <MacAyarlari />
              </AdminRoute>
            }
          />
        </Route>

        {/* Bilinmeyen route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
