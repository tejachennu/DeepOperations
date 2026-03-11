import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Tent, MapPin, Calendar, Users, Search,
    ChevronRight, AlertCircle, Trash2
} from 'lucide-react';

export default function CampsPage() {
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchCamps();
    }, [statusFilter]);

    const fetchCamps = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { limit: 100 };
            if (statusFilter) params.campStatus = statusFilter;
            if (search) params.search = search;
            const res = await campsAPI.getAll(params);
            setCamps(res.data.data.camps || []);
        } catch (err) {
            console.error('Fetch camps error:', err);
            
            // Detailed error message for network issues
            let errorMessage = 'Failed to load camps. Please try again.';
            
            if (!err.response) {
                if (err.code === 'ECONNABORTED') {
                    errorMessage = '⏱️ Request timeout. API server is not responding. Please check your connection.';
                } else if (err.message.includes('Network Error')) {
                    errorMessage = '📡 Network Error: Cannot connect to API server. Please ensure the API is running and check CORS settings.';
                } else {
                    errorMessage = '📡 Network Error: ' + (err.message || 'Unable to connect to server.');
                }
            } else if (err.response?.status === 404) {
                errorMessage = '❌ API endpoint not found. Check API configuration.';
            } else if (err.response?.status === 500) {
                errorMessage = '❌ Server error. Please contact support.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchCamps();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') fetchCamps();
    };

    const handleDeleteCamp = async (e, campId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this camp?')) return;
        try {
            await campsAPI.deleteCamp(campId);
            toast.success('Camp deleted successfully');
            fetchCamps();
        } catch (err) {
            console.error('Delete camp error:', err);
            toast.error('Failed to delete camp');
        }
    };

    const filteredCamps = camps;

    const fixISTTime = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        const actualUTC = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
        return new Date(actualUTC);
    };

    const formatDateIST = (dateStr) => {
        const d = fixISTTime(dateStr);
        if (!d) return '-';
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            timeZone: 'Asia/Kolkata'
        });
    };

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'ongoing') return 'badge-ongoing';
        if (s === 'planned') return 'badge-planned';
        if (s === 'completed') return 'badge-completed';
        if (s === 'cancelled') return 'badge-cancelled';
        return 'badge-active';
    };

    // Stats
    const totalCamps = camps.length;
    const ongoingCamps = camps.filter(c => (c.CampStatus || '').toLowerCase() === 'ongoing').length;
    const plannedCamps = camps.filter(c => (c.CampStatus || '').toLowerCase() === 'planned').length;
    const completedCamps = camps.filter(c => (c.CampStatus || '').toLowerCase() === 'completed').length;

    return (
        <div className="animate-fade-in">
            <div className="detail-header">
                <div className="detail-info">
                    <h2>Active Camps</h2>
                    <p>View and manage ongoing camp registrations</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary"><Tent size={22} /></div>
                    <div className="stat-value">{totalCamps}</div>
                    <div className="stat-label">Total Camps</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success"><Tent size={22} /></div>
                    <div className="stat-value">{ongoingCamps}</div>
                    <div className="stat-label">Ongoing</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning"><Tent size={22} /></div>
                    <div className="stat-value">{plannedCamps}</div>
                    <div className="stat-label">Planned</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon accent"><Tent size={22} /></div>
                    <div className="stat-value">{completedCamps}</div>
                    <div className="stat-label">Completed</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-input-wrapper" style={{ flex: 1, minWidth: 0 }}>
                    <Search size={18} />
                    <input
                        className="search-input"
                        style={{ width: '100%' }}
                        placeholder="Search camps..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        id="search-camps"
                    />
                </div>
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    id="filter-status"
                    style={{ minWidth: '120px' }}
                >
                    <option value="">All Statuses</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <button className="btn btn-indigo search-btn" onClick={handleSearch} id="search-btn">
                    <Search size={18} />
                    <span className="search-text">Search</span>
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="network-error-box animate-fade-in">
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.95rem' }}>Connection Error</strong>
                            <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: '0.9rem', lineHeight: '1.5' }}>{error}</p>
                            <small style={{ display: 'block', marginTop: 'var(--space-2)', opacity: 0.8 }}>
                                💡 Tip: Ensure the API server at https://deepapiservice.azurewebsites.net is running and check your network connection.
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner" />
                </div>
            ) : filteredCamps.length === 0 ? (
                <div className="empty-state">
                    <Tent size={48} />
                    <h3>No camps found</h3>
                    <p>There are no camps matching your criteria.</p>
                </div>
            ) : (
                <div className="camps-grid">
                    {filteredCamps.map((camp, index) => (
                        <div
                            key={camp.CampId}
                            className="camp-card animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            onClick={() => navigate(`/camps/${camp.CampId}`)}
                            id={`camp-card-${camp.CampId}`}
                        >
                            <div className="camp-card-banner">
                                {camp.BannerUrl ? (
                                    <img src={camp.BannerUrl} alt={camp.CampName} />
                                ) : null}
                                <div className="camp-card-badge">
                                    <span className={`badge ${getStatusClass(camp.CampStatus)}`}>
                                        {camp.CampStatus || 'Active'}
                                    </span>
                                </div>
                            </div>
                            <div className="camp-card-body">
                                <div className="camp-card-title">{camp.CampName}</div>
                                <div className="camp-card-meta">
                                    {camp.CampAddress && (
                                        <div className="camp-meta-row">
                                            <MapPin />
                                            <span>{camp.CampCity || camp.CampAddress}{camp.CampState ? `, ${camp.CampState}` : ''}</span>
                                        </div>
                                    )}
                                    <div className="camp-meta-row">
                                        <Calendar />
                                        <span>{formatDateIST(camp.CampStartDate)} — {formatDateIST(camp.CampEndDate)}</span>
                                    </div>
                                    {camp.PeopleExpected > 0 && (
                                        <div className="camp-meta-row">
                                            <Users />
                                            <span>{camp.PeopleExpected} expected</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="camp-card-footer">
                                <div className="camp-stat">
                                    <div className="camp-stat-value">{camp.PeopleAttended || 0}</div>
                                    <div className="camp-stat-label">Attended</div>
                                </div>
                                <div className="camp-stat">
                                    <div className="camp-stat-value">{camp.PeopleExpected || '-'}</div>
                                    <div className="camp-stat-label">Expected</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    {['SUPER_ADMIN', 'SUPERADMIN'].includes((user?.RoleCode || user?.roleCode || '').toUpperCase()) && (
                                        <button
                                            className="btn btn-icon"
                                            style={{ color: 'var(--error-600)', padding: '0.4rem' }}
                                            onClick={(e) => handleDeleteCamp(e, camp.CampId)}
                                            title="Delete Camp"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-indigo"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/camps/${camp.CampId}`); }}
                                    >
                                        Manage <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
