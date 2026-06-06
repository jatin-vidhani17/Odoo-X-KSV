import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Procurement Officer',
    company_name: '',
    gst_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let finalProfilePhotoUrl = '';

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
        // Upload directly to Cloudinary from React
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'YOUR_UPLOAD_PRESET';

        if (cloudName === 'YOUR_CLOUD_NAME' || uploadPreset === 'YOUR_UPLOAD_PRESET') {
          throw new Error('Please configure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in frontend/.env');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const cloudinaryData = await cloudinaryRes.json();

        if (!cloudinaryRes.ok) {
          throw new Error(cloudinaryData.error?.message || 'Failed to upload image to Cloudinary');
        }

        finalProfilePhotoUrl = cloudinaryData.secure_url;
      }

      // Now send the registration data to our backend
      const payload = {
        ...formData,
        profile_photo: finalProfilePhotoUrl || null
      };

      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isVendor = formData.role === 'Vendor';

  return (
    <div className="auth-container" style={{ padding: '2rem 0', height: 'auto', minHeight: '100vh' }}>
      <div className="auth-card" style={{ maxWidth: '600px', margin: 'auto' }}>
        <div className="auth-logo">VendorBridge</div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create an Account</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', overflow: 'hidden', marginBottom: '1rem', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="text-muted text-sm text-center">No Photo</span>
              )}
            </div>
            <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" name="name" required className="form-control" placeholder="John Doe" value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" name="email" required className="form-control" placeholder="john@example.com" value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" name="password" required className="form-control" placeholder="••••••••" value={formData.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" name="phone" className="form-control" placeholder="+1 234 567 890" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Account Role *</label>
              <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Manager">Manager</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>

            {isVendor && (
              <>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1rem', color: 'var(--accent)' }}>Vendor Details</h3>
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input type="text" name="company_name" required={isVendor} className="form-control" placeholder="Company Ltd." value={formData.company_name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number *</label>
                  <input type="text" name="gst_number" required={isVendor} className="form-control" placeholder="GSTIN..." value={formData.gst_number} onChange={handleChange} />
                </div>
              </>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
