import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'SUPERADMIN'];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('camp_portal_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await authAPI.getProfile();
            const userData = res.data.data;
            // Check role
            const roleCode = userData.RoleCode || userData.roleCode || '';
            if (!ALLOWED_ROLES.includes(roleCode.toUpperCase())) {
                logout();
                return;
            }
            setUser(userData);
        } catch (err) {
            console.error('Profile fetch failed:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const deviceId = `web-portal-${Date.now()}`;
        const res = await authAPI.login({
            email,
            password,
            deviceId,
            deviceName: navigator.userAgent.substring(0, 50),
            platform: 'web'
        });

        const data = res.data.data;
        const roleCode = data.user.roleCode || '';

        if (!ALLOWED_ROLES.includes(roleCode.toUpperCase())) {
            throw new Error('Access denied. Only Admin, Super Admin, and Staff can access this portal.');
        }

        localStorage.setItem('camp_portal_token', data.token);
        localStorage.setItem('camp_portal_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('camp_portal_token');
        localStorage.removeItem('camp_portal_user');
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
