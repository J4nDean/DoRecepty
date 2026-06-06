import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { MetadataProvider } from './MetadataContext';
import { ProtectedRoute, AdminRoute } from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ActivePrescriptionsPage from './pages/ActivePrescriptionsPage';
import ArchivedPrescriptionsPage from './pages/ArchivedPrescriptionsPage';
import PharmaciesPage from './pages/PharmaciesPage';
import PrescriptionDetailPage from './pages/PrescriptionDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import './styles.css';

const protect = (el: React.ReactNode) => <ProtectedRoute patientOnly>{el}</ProtectedRoute>;

const App = () => (
  <AuthProvider>
    <MetadataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"              element={<LoginPage />} />
          <Route path="/rejestracja"        element={<RegisterPage />} />
          <Route path="/dashboard"          element={protect(<DashboardPage />)} />
          <Route path="/recepty/aktywne"    element={protect(<ActivePrescriptionsPage />)} />
          <Route path="/recepty/archiwalne" element={protect(<ArchivedPrescriptionsPage />)} />
          <Route path="/recepty/:id"        element={protect(<PrescriptionDetailPage />)} />
          <Route path="/apteki"             element={protect(<PharmaciesPage />)} />
          <Route path="/profil"             element={protect(<ProfilePage />)} />
          <Route path="/admin"              element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*"                   element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </MetadataProvider>
  </AuthProvider>
);

export default App;
