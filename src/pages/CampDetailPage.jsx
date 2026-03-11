import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campsAPI, campRegistrationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    ArrowLeft, MapPin, Calendar, Users, Download,
    Search, Pencil, Eye, X, Save, AlertCircle, RefreshCw, UserPlus, Trash2, Copy, Link
} from 'lucide-react';

export default function CampDetailPage() {
    const { campId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Camp data
    const [camp, setCamp] = useState(null);
    const [loading, setLoading] = useState(true);

    // Registrations
    const [registrations, setRegistrations] = useState([]);
    const [fields, setFields] = useState([]);
    const [regLoading, setRegLoading] = useState(false);
    const [regSearch, setRegSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [regOffset, setRegOffset] = useState(0);
    const [regTotal, setRegTotal] = useState(0);
    const regLimit = 20;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // view | edit | add
    const [selectedReg, setSelectedReg] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState('registrations');

    useEffect(() => {
        fetchCampDetails();
        fetchFields();
    }, [campId]);

    useEffect(() => {
        fetchRegistrations();
    }, [campId, regOffset, dateFrom, dateTo]);

    const fetchCampDetails = async () => {
        try {
            const res = await campsAPI.getById(campId);
            setCamp(res.data.data.camp);
        } catch (err) {
            console.error('Fetch camp error:', err);
            toast.error('Failed to load camp details');
        } finally {
            setLoading(false);
        }
    };

    const fetchFields = async () => {
        try {
            const res = await campRegistrationAPI.getFields(campId);
            setFields(res.data.data.fields || []);
        } catch (err) {
            console.error('Fetch fields error:', err);
        }
    };

    const fetchRegistrations = async () => {
        setRegLoading(true);
        try {
            const params = { limit: regLimit, offset: regOffset };
            if (regSearch) params.search = regSearch;
            if (dateFrom) params.fromDate = dateFrom;
            if (dateTo) params.toDate = dateTo;
            const res = await campRegistrationAPI.getRegistrations(campId, params);
            const data = res.data.data;
            setRegistrations(data.registrations || []);
            setRegTotal(data.total || data.registrations?.length || 0);
        } catch (err) {
            console.error('Fetch registrations error:', err);
        } finally {
            setRegLoading(false);
        }
    };

    const handleSearchRegistrations = () => {
        setRegOffset(0);
        fetchRegistrations();
    };

    // View registration
    const handleView = async (reg) => {
        try {
            const res = await campRegistrationAPI.getRegistration(reg.RegistrationId);
            setSelectedReg(res.data.data.registration);
            setModalMode('view');
            setModalOpen(true);
        } catch (err) {
            toast.error('Failed to load registration details');
        }
    };

    // Edit registration
    const handleEdit = async (reg) => {
        try {
            const res = await campRegistrationAPI.getRegistration(reg.RegistrationId);
            const registration = res.data.data.registration;
            setSelectedReg(registration);

            // Pre-fill form data from responses
            const data = {};
            (registration.responses || []).forEach(r => {
                data[`field_${r.FieldId} `] = r.ResponseValue || '';
            });
            setFormData(data);
            setModalMode('edit');
            setModalOpen(true);
        } catch (err) {
            toast.error('Failed to load registration');
        }
    };

    // Add new registration
    const handleAdd = () => {
        setSelectedReg(null);
        const data = {};
        fields.forEach(f => {
            data[`field_${f.FieldId} `] = '';
        });
        setFormData(data);
        setModalMode('add');
        setModalOpen(true);
    };

    // Save (create or update)
    const handleSave = async () => {
        setSaving(true);
        try {
            if (modalMode === 'add') {
                const responses = fields.map(f => ({
                    fieldId: f.FieldId,
                    value: formData[`field_${f.FieldId} `] || ''
                }));
                await campRegistrationAPI.createRegistration({
                    campId: parseInt(campId),
                    responses
                });
                toast.success('Registration created successfully!');
            } else if (modalMode === 'edit' && selectedReg) {
                const responses = fields.map(f => ({
                    fieldId: f.FieldId,
                    value: formData[`field_${f.FieldId} `] || ''
                }));
                await campRegistrationAPI.updateRegistration(selectedReg.RegistrationId, {
                    responses
                });
                toast.success('Registration updated successfully!');
            }
            setModalOpen(false);
            fetchRegistrations();
        } catch (err) {
            const msg = err.response?.data?.message || 'Save failed';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Delete registration
    const handleDelete = async (reg) => {
        if (!window.confirm('Are you sure you want to delete this registration?')) return;
        try {
            toast.loading('Deleting...', { id: 'delete' });
            await campRegistrationAPI.deleteRegistration(reg.RegistrationId);
            toast.success('Registration deleted', { id: 'delete' });
            fetchRegistrations(); // refetch table
        } catch (err) {
            toast.error('Failed to delete registration', { id: 'delete' });
        }
    };

    // Excel export
    const handleExport = async () => {
        try {
            toast.loading('Generating Excel...', { id: 'export' });
            const params = {};
            if (dateFrom) params.fromDate = dateFrom;
            if (dateTo) params.toDate = dateTo;
            const res = await campRegistrationAPI.exportExcel(campId, params);
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `camp_registrations_${campId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Excel downloaded!', { id: 'export' });
        } catch (err) {
            toast.error('Export failed', { id: 'export' });
        }
    };

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

    const formatDateTimeIST = (dateStr) => {
        const d = fixISTTime(dateStr);
        if (!d) return '-';
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            timeZone: 'Asia/Kolkata', hour12: true
        });
    };

    const handleCopyRegistrationLink = () => {
        if (!camp) return;
        const encodedId = btoa('camp-' + camp.CampId.toString());
        const link = `${window.location.origin}/camp/${encodedId}`;
        navigator.clipboard.writeText(link);
        toast.success('Registration link copied to clipboard!');
    };

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'ongoing') return 'badge-ongoing';
        if (s === 'planned') return 'badge-planned';
        if (s === 'completed') return 'badge-completed';
        if (s === 'cancelled') return 'badge-cancelled';
        return 'badge-active';
    };

    // Get a response value for a field from a registration
    const getResponseValue = (reg, fieldId) => {
        if (!reg.responses) return '-';
        const resp = reg.responses.find(r => r.FieldId === fieldId);
        return resp?.ResponseValue || '-';
    };

    // Pagination
    const totalPages = Math.ceil(regTotal / regLimit);
    const currentPage = Math.floor(regOffset / regLimit) + 1;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!camp) {
        return (
            <div className="empty-state">
                <AlertCircle size={48} />
                <h3>Camp not found</h3>
                <p>The camp you're looking for doesn't exist or has been removed.</p>
                <button className="btn btn-indigo" onClick={() => navigate('/camps')} style={{ marginTop: '1rem' }}>
                    Back to Camps
                </button>
            </div>
        );
    }

    const isCampCompleted = (camp.CampStatus || '').toLowerCase() === 'completed';

    return (
        <div className="animate-fade-in">
            {/* Back Navigation */}
            <button className="back-btn" onClick={() => navigate('/camps')}>
                <ArrowLeft /> Back to Camps
            </button>

            {/* Camp Header */}
            <div className="detail-header">
                <div className="detail-info">
                    <h2>{camp.CampName}</h2>
                    <p>
                        <span className={`badge ${getStatusClass(camp.CampStatus)} `} style={{ marginRight: '0.5rem' }}>
                            {camp.CampStatus || 'Active'}
                        </span>
                        {camp.CampType && <span style={{ color: 'var(--gray-500)' }}>· {camp.CampType}</span>}
                    </p>
                </div>
                <div className="detail-actions" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={handleCopyRegistrationLink}>
                        <Copy size={16} style={{ marginRight: '0.4rem' }} />
                        Copy Registration Link
                    </button>
                    <button className="btn btn-success" onClick={handleExport} id="export-excel-btn">
                        <Download size={16} />
                        Export Excel
                    </button>
                    {!isCampCompleted && (
                        <button className="btn btn-indigo" onClick={handleAdd} id="add-registration-btn">
                            <UserPlus size={16} />
                            Register User
                        </button>
                    )}
                </div>
            </div>

            {/* Camp Details */}
            <div className="detail-grid">
                {camp.CampDescription && (
                    <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                        <label>Description</label>
                        <p>{camp.CampDescription}</p>
                    </div>
                )}
                <div className="detail-field">
                    <label>Location</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin size={14} style={{ color: 'var(--primary-500)' }} />
                        {camp.CampAddress || '-'}{camp.CampCity ? `, ${camp.CampCity} ` : ''}{camp.CampState ? `, ${camp.CampState} ` : ''}
                    </p>
                </div>
                <div className="detail-field">
                    <label>Dates</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={14} style={{ color: 'var(--primary-500)' }} />
                        {formatDateIST(camp.CampStartDate)} — {formatDateIST(camp.CampEndDate)}
                    </p>
                </div>
                <div className="detail-field">
                    <label>Expected Attendance</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Users size={14} style={{ color: 'var(--primary-500)' }} />
                        {camp.PeopleExpected || '-'}
                    </p>
                </div>
                <div className="detail-field">
                    <label>People Attended</label>
                    <p>{camp.PeopleAttended || 0}</p>
                </div>
                {camp.CampPincode && (
                    <div className="detail-field">
                        <label>Pincode</label>
                        <p>{camp.CampPincode}</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab - btn ${activeTab === 'registrations' ? 'active' : ''} `}
                    onClick={() => setActiveTab('registrations')}
                >
                    Registrations
                </button>
            </div>

            {/* Registrations Table */}
            {activeTab === 'registrations' && (
                <div className="table-card animate-fade-in">
                    <div className="table-header">
                        <div className="table-title">
                            Camp Registrations ({regTotal})
                        </div>
                        <div className="table-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
                            <div className="search-input-wrapper">
                                <Search />
                                <input
                                    className="search-input"
                                    placeholder="Search registrations..."
                                    value={regSearch}
                                    onChange={(e) => setRegSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchRegistrations()}
                                    id="search-registrations"
                                />
                            </div>
                            <div className="date-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label className="date-filter-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)' }}>From</label>
                                <input
                                    type="date"
                                    className="filter-date"
                                    style={{ padding: '0.5rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}
                                    value={dateFrom}
                                    onChange={(e) => { setDateFrom(e.target.value); setRegOffset(0); }}
                                />
                            </div>
                            <div className="date-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label className="date-filter-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)' }}>To</label>
                                <input
                                    type="date"
                                    className="filter-date"
                                    style={{ padding: '0.5rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}
                                    value={dateTo}
                                    onChange={(e) => { setDateTo(e.target.value); setRegOffset(0); }}
                                />
                            </div>

                            {(regSearch || dateFrom || dateTo) && (
                                <button className="btn btn-outline btn-sm" onClick={() => { setRegSearch(''); setDateFrom(''); setDateTo(''); setRegOffset(0); fetchRegistrations(); }}>
                                    Clear
                                </button>
                            )}

                            <button className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={() => { setRegOffset(0); fetchRegistrations(); }}>
                                <RefreshCw size={14} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {regLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner" />
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <h3>No registrations yet</h3>
                            <p>Register users for this camp to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            {fields.slice(0, 4).map(f => (
                                                <th key={f.FieldId}>{f.FieldLabel}</th>
                                            ))}
                                            <th>Registered</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((reg, idx) => (
                                            <tr key={reg.RegistrationId}>
                                                <td style={{ fontWeight: 600 }}>{regOffset + idx + 1}</td>
                                                {fields.slice(0, 4).map(f => (
                                                    <td key={f.FieldId}>
                                                        {getResponseValue(reg, f.FieldId)}
                                                    </td>
                                                ))}
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {formatDateTimeIST(reg.CreatedDate)}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button
                                                            className="btn-icon"
                                                            title="View"
                                                            onClick={() => handleView(reg)}
                                                            id={`view - reg - ${reg.RegistrationId} `}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            title="Edit"
                                                            onClick={() => handleEdit(reg)}
                                                            id={`edit - reg - ${reg.RegistrationId} `}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        {['SUPER_ADMIN', 'SUPERADMIN'].includes((user?.RoleCode || user?.roleCode || '').toUpperCase()) && (
                                                            <button
                                                                className="btn btn-icon"
                                                                style={{ color: 'var(--error-600)' }}
                                                                onClick={() => {
                                                                    // setRegToDelete(reg); // This variable is not defined in the original code
                                                                    // setShowDeleteConfirm(true); // This variable is not defined in the original code
                                                                    handleDelete(reg); // Using the existing handleDelete function
                                                                }}
                                                                title="Delete Registration"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <div className="pagination-info">
                                        Showing {regOffset + 1}–{Math.min(regOffset + regLimit, regTotal)} of {regTotal}
                                    </div>
                                    <div className="pagination-btns">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setRegOffset(Math.max(0, regOffset - regLimit))}
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={currentPage === pageNum ? 'active' : ''}
                                                    onClick={() => setRegOffset((pageNum - 1) * regLimit)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setRegOffset(regOffset + regLimit)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalMode === 'view' && 'Registration Details'}
                                {modalMode === 'edit' && 'Edit Registration'}
                                {modalMode === 'add' && 'Register New User'}
                            </h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {modalMode === 'view' && selectedReg && (
                                <div>
                                    <div className="form-row">
                                        <div className="detail-field">
                                            <label>Registration ID</label>
                                            <p>#{selectedReg.RegistrationId}</p>
                                        </div>
                                        <div className="detail-field">
                                            <label>Registered On</label>
                                            <p>{formatDateTimeIST(selectedReg.CreatedDate)}</p>
                                        </div>
                                    </div>
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--gray-100)', margin: '1rem 0' }} />
                                    <div className="form-row">
                                        {(selectedReg.responses || []).map((r) => {
                                            const field = fields.find(f => f.FieldId === r.FieldId);
                                            return (
                                                <div className="detail-field" key={r.FieldId || r.ResponseId}>
                                                    <label>{field?.FieldLabel || `Field #${r.FieldId} `}</label>
                                                    <p>{r.ResponseValue || '-'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {(modalMode === 'edit' || modalMode === 'add') && (
                                <div>
                                    <div className="form-row">
                                        {fields.map((f) => {
                                            const fieldType = (f.FieldType || '').toLowerCase();
                                            return (
                                                <div className="form-field" key={f.FieldId}>
                                                    <label>
                                                        {f.FieldLabel}
                                                        {f.IsRequired ? <span className="required"> *</span> : ''}
                                                    </label>
                                                    {fieldType === 'select' || fieldType === 'dropdown' ? (
                                                        <select
                                                            className="form-control"
                                                            value={formData[`field_${f.FieldId} `] || ''}
                                                            onChange={(e) => setFormData({ ...formData, [`field_${f.FieldId} `]: e.target.value })}
                                                        >
                                                            <option value="">Select...</option>
                                                            {(f.FieldOptions || '').split(',').map(opt => (
                                                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                                            ))}
                                                        </select>
                                                    ) : fieldType === 'textarea' ? (
                                                        <textarea
                                                            className="form-control"
                                                            rows={3}
                                                            value={formData[`field_${f.FieldId} `] || ''}
                                                            onChange={(e) => setFormData({ ...formData, [`field_${f.FieldId} `]: e.target.value })}
                                                            placeholder={f.Placeholder || ''}
                                                        />
                                                    ) : (
                                                        <input
                                                            className="form-control"
                                                            type={fieldType === 'email' ? 'email' : fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                                                            value={formData[`field_${f.FieldId} `] || ''}
                                                            onChange={(e) => setFormData({ ...formData, [`field_${f.FieldId} `]: e.target.value })}
                                                            placeholder={f.Placeholder || f.FieldLabel}
                                                        />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(modalMode === 'edit' || modalMode === 'add') && (
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-indigo"
                                    onClick={handleSave}
                                    disabled={saving}
                                    id="save-registration-btn"
                                >
                                    {saving ? (
                                        <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
                                    ) : (
                                        <><Save size={15} /> {modalMode === 'add' ? 'Register' : 'Update'}</>
                                    )}
                                </button>
                            </div>
                        )}

                        {modalMode === 'view' && (
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                                    Close
                                </button>
                                <button
                                    className="btn btn-indigo"
                                    onClick={() => {
                                        setModalOpen(false);
                                        handleEdit(selectedReg);
                                    }}
                                >
                                    <Pencil size={15} /> Edit
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
