import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import CampsPage from './pages/CampsPage';
import PublicRegistrationPage from './pages/PublicRegistrationPage';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'var(--surface-bg)'
            }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: '#0f172a'
            }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/camps" replace /> : children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route path="/camp/:campCode" element={<PublicRegistrationPage />} />
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/camps" element={<CampsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/camps" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#1e293b',
                            color: '#f1f5f9',
                            fontSize: '0.875rem',
                            borderRadius: '10px',
                            padding: '12px 16px',
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}
