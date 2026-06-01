import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MetadataProvider } from './context/MetadataContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ActivePrescriptionsPage from './pages/ActivePrescriptions/ActivePrescriptionsPage';
import ArchivedPrescriptionsPage from './pages/ArchivedPrescriptions/ArchivedPrescriptionsPage';
import PharmaciesPage from './pages/Pharmacies/PharmaciesPage';
import PrescriptionDetailPage from './pages/PrescriptionDetail/PrescriptionDetailPage';
import ProfilePage from './pages/Profile/ProfilePage';
import './styles/index.css';

const protect = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
  <AuthProvider>
    <MetadataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/rejestracja"         element={<RegisterPage />} />
          <Route path="/dashboard"           element={protect(<DashboardPage />)} />
          <Route path="/recepty/aktywne"     element={protect(<ActivePrescriptionsPage />)} />
          <Route path="/recepty/archiwalne"  element={protect(<ArchivedPrescriptionsPage />)} />
          <Route path="/recepty/:id"         element={protect(<PrescriptionDetailPage />)} />
          <Route path="/apteki"              element={protect(<PharmaciesPage />)} />
          <Route path="/profil"              element={protect(<ProfilePage />)} />
          <Route path="*"                    element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </MetadataProvider>
  </AuthProvider>
);

export default App;
