
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-logo">VendorBridge</div>
        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" required className="form-control" placeholder="First Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" required className="form-control" placeholder="Last Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" required className="form-control" placeholder="Email Address" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-control" placeholder="Phone Number" />
            </div>
            <div className="form-group">
              <label className="form-label">Job Title / Dept</label>
              <input type="text" className="form-control" placeholder="Job Title / Dept" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-control">
                <option>Select Country</option>
                <option>United States</option>
                <option>India</option>
                <option>United Kingdom</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Additional Information</label>
            <textarea className="form-control" rows={4} placeholder="Additional Information..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
            Register
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
