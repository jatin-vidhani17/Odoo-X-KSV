import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Search, UserPlus, Shield, UserX, UserCheck, X } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Procurement Officer');
  // Vendor specific fields if role is Vendor
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/users');
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
        setFilteredUsers(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch users:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
      );
    }

    if (selectedRole !== 'All Roles') {
      result = result.filter(u => u.role === selectedRole);
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedRole, users]);

  const handleToggleStatus = async (user: any) => {
    let newStatus = 'Active';
    if (user.status === 'Active') newStatus = 'Suspended';
    if (user.status === 'Suspended') newStatus = 'Active';
    if (user.status === 'Pending') newStatus = 'Active';

    try {
      const res = await apiFetch(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        // Update local state
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      } else {
        alert(res.message || "Failed to update user status.");
      }
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload: any = { username, password, name, email, phone, role };
      if (role === 'Vendor') {
        payload.company_name = companyName;
        payload.gst_number = gstNumber;
      }

      const res = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        // Reset form
        setUsername('');
        setPassword('');
        setName('');
        setEmail('');
        setPhone('');
        setRole('Procurement Officer');
        setCompanyName('');
        setGstNumber('');
        setShowAddForm(false);
        // Refresh list
        fetchUsers();
      } else {
        setErrorMsg(res.message || "Failed to create user");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>System Users</h1>
          <p className="text-muted">Provision, suspend, and configure user accounts and permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {showAddForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setShowAddForm(false)} 
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Create User Account</h2>
            
            {errorMsg && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Username *</label>
                  <input type="text" className="form-control" required value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-control" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-control" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label">System Role *</label>
                <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Vendor">Vendor (External Partner)</option>
                </select>
              </div>

              {role === 'Vendor' && (
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem', backgroundColor: 'var(--bg-input)' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Vendor Profile Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">Company Name *</label>
                      <input type="text" className="form-control" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">GST Number *</label>
                      <input type="text" className="form-control" required value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search users by name, username or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: 'auto' }} 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option>All Roles</option>
            <option>Procurement Officer</option>
            <option>Manager</option>
            <option>Admin</option>
            <option>Vendor</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center p-8">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-8 text-muted">No users found.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="font-bold">{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {user.role === 'Admin' && <Shield size={14} style={{ color: 'var(--accent)' }} />}
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        user.status === 'Active' ? 'badge-success' : 
                        user.status === 'Suspended' ? 'badge-danger' : 
                        'badge-warning'
                      }`}>
                        {user.status === 'Pending' ? 'Pending Approval' : user.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={`btn ${
                          user.status === 'Active' ? 'btn-outline' : 'btn-primary'
                        }`}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === 'Active' ? (
                          <>
                            <UserX size={14} /> Suspend
                          </>
                        ) : user.status === 'Suspended' ? (
                          <>
                            <UserCheck size={14} /> Activate
                          </>
                        ) : (
                          <>
                            <UserCheck size={14} /> Approve Registration
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
