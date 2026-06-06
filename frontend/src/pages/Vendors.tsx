import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { apiFetch } from '../utils/api';

const Vendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    company_name: '',
    gst_number: '',
    category: 'IT Equipment',
    address: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/vendors');
      if (res.success && Array.isArray(res.data)) {
        setVendors(res.data);
        setFilteredVendors(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load vendors:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Filter and Search logic
  useEffect(() => {
    let result = vendors;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.company_name && v.company_name.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All Categories') {
      result = result.filter(v => v.category === selectedCategory);
    }

    if (selectedStatus !== 'All Status') {
      result = result.filter(v => v.vendor_status === selectedStatus);
    }

    setFilteredVendors(result);
  }, [searchQuery, selectedCategory, selectedStatus, vendors]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vendor? This will delete their user account and all details.")) {
      return;
    }

    try {
      await apiFetch(`/vendors/${id}`, { method: 'DELETE' });
      // Log activity
      await apiFetch('/activity-logs', {
        method: 'POST',
        body: JSON.stringify({
          activity_type: 'Vendor Deletion',
          log_summary: `Deleted vendor with ID/User ID ${id}`
        })
      }).catch(() => {});
      
      fetchVendors();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await apiFetch('/vendors', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      // Reset form
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        company_name: '',
        gst_number: '',
        category: 'IT Equipment',
        address: ''
      });
      setShowAddForm(false);
      fetchVendors();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const categories = ['IT Equipment', 'Furniture', 'Stationery'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Vendors</h1>
          <p className="text-muted">Manage Supplier profiles and registrations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? " Close Form" : " Add Vendor"}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>New Vendor Registration</h2>
          {formError && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{formError}</div>}
          <form onSubmit={handleAddVendor}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" name="name" required className="form-control" value={formData.name} onChange={handleFormChange} placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" name="email" required className="form-control" value={formData.email} onChange={handleFormChange} placeholder="jane@techcorp.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleFormChange} placeholder="+1..." />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input type="text" name="username" required className="form-control" value={formData.username} onChange={handleFormChange} placeholder="jane_vendor" />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" name="password" required className="form-control" value={formData.password} onChange={handleFormChange} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-control" value={formData.category} onChange={handleFormChange}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input type="text" name="company_name" required className="form-control" value={formData.company_name} onChange={handleFormChange} placeholder="TechCorp Ltd" />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number *</label>
                <input type="text" name="gst_number" required className="form-control" value={formData.gst_number} onChange={handleFormChange} placeholder="GSTIN..." />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" name="address" className="form-control" value={formData.address} onChange={handleFormChange} placeholder="123 Main St..." />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4" disabled={formLoading}>
              {formLoading ? "Saving..." : "Register Vendor"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search vendors by name or company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option>All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option>All Status</option>
            <option>Pending Verification</option>
            <option>Approved</option>
            <option>Blacklisted</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center p-8">Loading suppliers...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center p-8 text-muted">No vendors found.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>GST Number</th>
                  <th>Email</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.vendor_id || vendor.user_id}>
                    <td className="font-bold">{vendor.name}</td>
                    <td>{vendor.company_name}</td>
                    <td>{vendor.category || 'N/A'}</td>
                    <td>{vendor.gst_number}</td>
                    <td>{vendor.email}</td>
                    <td>★ {parseFloat(vendor.rating_indicator || '5.0').toFixed(1)}</td>
                    <td>
                      <span className={`badge ${
                        vendor.vendor_status === 'Approved' ? 'badge-success' : 
                        vendor.vendor_status === 'Blacklisted' ? 'badge-danger' : 
                        'badge-warning'
                      }`}>
                        {vendor.vendor_status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="text-danger hover:text-white" onClick={() => handleDelete(vendor.vendor_id || vendor.user_id)} aria-label="Delete">
                          <Trash2 size={16} color="var(--danger)"/>
                        </button>
                      </div>
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

export default Vendors;
