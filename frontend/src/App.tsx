import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ActivePrescriptionsPage from './pages/ActivePrescriptions/ActivePrescriptionsPage';
import ArchivedPrescriptionsPage from './pages/ArchivedPrescriptions/ArchivedPrescriptionsPage';
import PharmaciesPage from './pages/Pharmacies/PharmaciesPage';
import PrescriptionDetailPage from './pages/PrescriptionDetail/PrescriptionDetailPage';
import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/rejestracja" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/recepty/aktywne"
            element={<ProtectedRoute><ActivePrescriptionsPage /></ProtectedRoute>}
          />
          <Route
            path="/recepty/archiwalne"
            element={<ProtectedRoute><ArchivedPrescriptionsPage /></ProtectedRoute>}
          />
          <Route
            path="/recepty/:id"
            element={<ProtectedRoute><PrescriptionDetailPage /></ProtectedRoute>}
          />
          <Route
            path="/apteki"
            element={<ProtectedRoute><PharmaciesPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
