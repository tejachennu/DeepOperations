import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { campRegistrationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

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
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f8fafc',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}>
            <div className="loading-spinner" />
        </div>
    );

    if (error) return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f8fafc',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '1rem' 
        }}>
            <div style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '20px', 
                padding: 'clamp(1.5rem, 5vw, 2.5rem)', 
                width: '100%', 
                maxWidth: '480px', 
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                animation: 'slideInUp 0.5s ease-out'
            }}>
                <img 
                    src="/images/icon.png" 
                    alt="Logo" 
                    style={{ 
                        width: 'clamp(40px, 8vw, 56px)', 
                        height: 'clamp(40px, 8vw, 56px)', 
                        margin: '0 auto 1.5rem',
                        opacity: 0.6
                    }} 
                />
                <h1 style={{ 
                    color: '#0f172a', 
                    fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
                    fontWeight: 800,
                    marginBottom: '0.75rem'
                }}>
                    Link Unavailable
                </h1>
                <p style={{ 
                    color: '#64748b', 
                    fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
                    lineHeight: '1.6',
                    marginTop: '0.5rem' 
                }}>
                    {error}
                </p>
            </div>
        </div>
    );

    if (success) return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f8fafc',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '1rem' 
        }}>
            <div style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '20px', 
                padding: 'clamp(1.5rem, 5vw, 2.5rem)', 
                width: '100%', 
                maxWidth: '480px', 
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                animation: 'slideInUp 0.5s ease-out'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                    gap: '0.5rem'
                }}>
                    <img 
                        src="/images/icon.png" 
                        alt="Logo" 
                        style={{ 
                            width: 'clamp(40px, 8vw, 56px)', 
                            height: 'clamp(40px, 8vw, 56px)',
                        }} 
                    />
                    <CheckCircle 
                        size={56} 
                        style={{ 
                            color: '#10b981',
                            animation: 'scaleIn 0.5s ease-out'
                        }} 
                    />
                </div>
                <h1 style={{ 
                    color: '#0f172a', 
                    fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
                    fontWeight: 800,
                    marginBottom: '0.75rem'
                }}>
                    Registration Successful!
                </h1>
                <p style={{ 
                    color: '#64748b', 
                    fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
                    lineHeight: '1.6',
                    marginTop: '0.75rem' 
                }}>
                    Thank you! Your registration for <strong style={{ color: '#0f172a' }}>{camp?.CampName}</strong> has been successfully received.
                </p>
            </div>
        </div>
    );

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f8fafc',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '1rem',
            paddingTop: '2rem',
            paddingBottom: '2rem'
        }}>
            <div style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0',
                borderRadius: '20px', 
                padding: 'clamp(1.5rem, 5vw, 2.5rem)',
                width: '100%', 
                maxWidth: '720px', 
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08), 0 0 1px rgba(99, 102, 241, 0.2)',
                animation: 'slideInUp 0.5s ease-out'
            }}>
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: 'clamp(1.5rem, 5vw, 2.5rem)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center' 
                }}>
                    <div style={{ 
                        marginBottom: '1.5rem',
                    }}>
                        <img 
                            src="/images/icon.png" 
                            alt="Deep Operations Logo" 
                            style={{ 
                                width: 'clamp(48px, 10vw, 80px)', 
                                height: 'clamp(48px, 10vw, 80px)',
                                filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.15))'
                            }} 
                        />
                    </div>
                    <h1 style={{ 
                        color: '#0f172a', 
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                        fontWeight: 800, 
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.015em'
                    }}>
                        {camp?.CampName}
                    </h1>
                    {camp?.CampDescription && (
                        <p style={{ 
                            color: '#475569', 
                            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                            whiteSpace: 'pre-line',
                            lineHeight: '1.6',
                            maxWidth: '100%'
                        }}>
                            {camp?.CampDescription}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {fields.map((f, idx) => {
                            const fieldType = (f.FieldType || '').toLowerCase();
                            const isFullWidthField = fieldType === 'textarea' ||
                                f.FieldLabel.toLowerCase().includes('address') ||
                                f.FieldLabel.toLowerCase().includes('remarks');

                            return (
                                <div 
                                    className={`form-group ${isFullWidthField ? 'full-width' : ''}`} 
                                    key={f.FieldId}
                                    style={{ animation: `fadeInUp 0.5s ease-out ${idx * 0.05}s both` }}
                                >
                                    <label style={{ fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)' }}>
                                        {f.FieldLabel}
                                        {f.IsRequired && <span style={{ color: '#ef4444', marginLeft: '4px', fontWeight: 700 }}>*</span>}
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
                                            style={{ resize: 'vertical', minHeight: 'clamp(80px, 20vh, 120px)' }}
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

                    <div style={{ 
                        marginTop: 'clamp(1.5rem, 5vw, 2.5rem)', 
                        display: 'flex', 
                        justifyContent: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ 
                                width: 'clamp(100%, calc(100% - 2rem), 350px)',
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
                                padding: 'clamp(0.75rem, 2vw, 1rem) 1.5rem'
                            }}
                            disabled={submitting}
                        >
                            {submitting && <span className="spinner" />}
                            {submitting ? 'Submitting...' : 'Register Now'}
                        </button>
                    </div>

                    <p style={{ 
                        textAlign: 'center', 
                        marginTop: 'clamp(1.5rem, 4vw, 2rem)', 
                        fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', 
                        color: '#94a3b8' 
                    }}>
                        Powered by Deep Operations Registration System
                    </p>
                </form>
            </div>
        </div>
    );
}
