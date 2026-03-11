import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Shield, LayoutDashboard, Tent, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="app-layout">
            {/* Sidebar Overlay (mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Shield />
                    </div>
                    <div className="sidebar-brand">
                        Deep<span>Operations</span>
                    </div>
                    <button
                        className="mobile-menu-btn"
                        onClick={closeSidebar}
                        style={{ marginLeft: 'auto', color: 'var(--gray-400)', display: sidebarOpen ? 'flex' : 'none' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Main Menu</div>

                    <NavLink
                        to="/camps"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Tent size={20} />
                        <span>Active Camps</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {getInitials(user?.fullName || user?.FullName)}
                        </div>
                        <div className="user-meta">
                            <div className="user-name">{user?.fullName || user?.FullName || 'User'}</div>
                            <div className="user-role">{user?.role || user?.RoleName || 'Staff'}</div>
                        </div>
                        <button
                            className="btn-logout"
                            onClick={handleLogout}
                            title="Logout"
                            id="logout-btn"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="app-header">
                    <div className="header-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(true)}
                            id="mobile-menu-toggle"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                    <div className="header-right">
                        <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                            {user?.role || user?.RoleName}
                        </span>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
