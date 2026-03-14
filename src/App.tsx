import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ArtistListPage from './pages/ArtistListPage';
import ProductListPage from './pages/ProductListPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import SalesPage from './pages/SalesPage';
import QRTemplatesPage from './pages/QRTemplatesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/artistas" element={<ArtistListPage />} />
                    <Route path="/productos" element={<ProductListPage />} />
                    <Route path="/inventario" element={<InventoryPage />} />
                    <Route path="/reportes" element={<ReportsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                    <Route path="/ventas" element={<SalesPage />} />
                    <Route path="/qr-templates" element={<QRTemplatesPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;