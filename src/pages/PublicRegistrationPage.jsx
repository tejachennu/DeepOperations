import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { campRegistrationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Tent, CheckCircle } from 'lucide-react';

export default function PublicRegistrationPage() {
    const { campCode } = useParams();
    const [camp, setCamp] = useState(null);
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCampDetails();
    }, [campCode]);

    const fetchCampDetails = async () => {
        try {
            setLoading(true);
            const res = await campRegistrationAPI.getPublicFields(campCode);
            setCamp(res.data.data.camp);
            setFields(res.data.data.fields || []);
        } catch (err) {
            console.error('Failed to load camp form:', err);
            setError('This registration link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic required validation
        for (let f of fields) {
            if (f.IsRequired && !formData[`field_${f.FieldId}`]) {
                toast.error(`Please fill out: ${f.FieldLabel}`);
                return;
            }
        }

        setSubmitting(true);
        try {
            const responsesArray = Object.keys(formData).map(key => ({
                fieldId: Number(key.split('_')[1]),
                value: formData[key]
            }));

            const decodedCampId = parseInt(atob(campCode).replace('camp-', ''), 10);

            await campRegistrationAPI.createRegistration({
                campId: decodedCampId,
                responses: responsesArray
            });

            setSuccess(true);
        } catch (err) {
            console.error('Registration failed:', err);
            toast.error('Failed to submit registration. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
            <div className="loading-spinner" />
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
                <Tent size={48} style={{ color: 'var(--error-500)', margin: '0 auto 1rem' }} />
                <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 700 }}>Link Unavailable</h1>
                <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.5rem' }}>{error}</p>
            </div>
        </div>
    );

    if (success) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
                <CheckCircle size={56} style={{ color: 'var(--success-500)', margin: '0 auto 1.5rem' }} />
                <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 700 }}>Registration Successful!</h1>
                <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.75rem' }}>
                    Thank you! Your registration for <strong>{camp?.CampName}</strong> has been successfully received.
                </p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '720px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: '#4f46e5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' }}>
                        <Tent size={32} color="white" />
                    </div>
                    <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{camp?.CampName}</h1>
                    {camp?.CampDescription && (
                        <p style={{ color: '#64748b', fontSize: '0.9375rem', whiteSpace: 'pre-line' }}>
                            {camp?.CampDescription}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {fields.map((f, idx) => {
                            const fieldType = (f.FieldType || '').toLowerCase();
                            // Industry standard: labels like Address, Remarks, or textareas are usually full width
                            const isFullWidthField = fieldType === 'textarea' ||
                                f.FieldLabel.toLowerCase().includes('address') ||
                                f.FieldLabel.toLowerCase().includes('remarks');

                            return (
                                <div className={`form-group ${isFullWidthField ? 'full-width' : ''}`} key={f.FieldId}>
                                    <label>
                                        {f.FieldLabel}
                                        {f.IsRequired && <span style={{ color: 'var(--error-500)', marginLeft: '4px' }}>*</span>}
                                    </label>
                                    {fieldType === 'select' || fieldType === 'dropdown' ? (
                                        <select
                                            className="form-input"
                                            value={formData[`field_${f.FieldId}`] || ''}
                                            onChange={(e) => setFormData({ ...formData, [`field_${f.FieldId}`]: e.target.value })}
                                            required={f.IsRequired}
                                        >
                                            <option value="" disabled>Select an option</option>
                                            {(f.FieldOptions || '').split(',').map(opt => (
                                                <option key={opt.trim()} value={opt.trim()}>
                                                    {opt.trim()}
                                                </option>
                                            ))}
                                        </select>
                                    ) : fieldType === 'textarea' ? (
                                        <textarea
                                            className="form-input"
                                            style={{ resize: 'vertical', minHeight: '100px' }}
                                            value={formData[`field_${f.FieldId}`] || ''}
                                            onChange={(e) => setFormData({ ...formData, [`field_${f.FieldId}`]: e.target.value })}
                                            placeholder={f.Placeholder || `Enter ${f.FieldLabel.toLowerCase()}`}
                                            required={f.IsRequired}
                                        />
                                    ) : (
                                        <input
                                            className="form-input"
                                            type={fieldType === 'email' ? 'email' : fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                                            value={formData[`field_${f.FieldId}`] || ''}
                                            onChange={(e) => setFormData({ ...formData, [`field_${f.FieldId}`]: e.target.value })}
                                            placeholder={f.Placeholder || `Enter ${f.FieldLabel.toLowerCase()}`}
                                            required={f.IsRequired}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ maxWidth: '300px' }}
                            disabled={submitting}
                        >
                            {submitting && <span className="spinner" />}
                            {submitting ? 'Submitting...' : 'Register Now'}
                        </button>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
                        Powered by Camp Portal Registration System
                    </p>
                </form>
            </div>
        </div>
    );
}
