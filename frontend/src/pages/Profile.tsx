import { useEffect, useState } from 'react';
import { User, Mail, Phone, Briefcase, Hash } from 'lucide-react';
import { apiFetch } from '../utils/api';

const Profile = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch freshest data from backend
    apiFetch('/auth/me')
      .then(res => {
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      })
      .catch(err => {
        console.error("Failed to load profile from backend:", err.message);
      });
  }, []);

  if (!user) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Profile</h1>
        <p className="text-muted">Manage your personal information and settings</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', overflow: 'hidden', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.profile_photo ? (
              <img src={user.profile_photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={64} className="text-muted" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{user.name}</h2>
            <div className="badge badge-info" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>{user.role}</div>
            <p className="text-muted text-sm">Member since {new Date().getFullYear()}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 className="text-muted text-sm uppercase mb-4" style={{ letterSpacing: '0.05em' }}>Contact Information</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
                <Mail size={20} />
              </div>
              <div>
                <div className="text-sm text-muted">Email Address</div>
                <div className="font-bold">{user.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Phone size={20} />
              </div>
              <div>
                <div className="text-sm text-muted">Phone Number</div>
                <div className="font-bold">{user.phone || 'Not provided'}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-muted text-sm uppercase mb-4" style={{ letterSpacing: '0.05em' }}>Account Details</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                <Briefcase size={20} />
              </div>
              <div>
                <div className="text-sm text-muted">Department / Role</div>
                <div className="font-bold">{user.role}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                <Hash size={20} />
              </div>
              <div>
                <div className="text-sm text-muted">User ID</div>
                <div className="font-bold">USR-{user.id?.toString().padStart(4, '0') || '0000'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
