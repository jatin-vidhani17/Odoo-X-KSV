import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Search, Check, AlertOctagon, RefreshCw, Star } from 'lucide-react';

const AdminVendorsReview = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Pending Verification');
  const [actioningId, setActioningId] = useState<number | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/vendors');
      if (res.success && Array.isArray(res.data)) {
        setVendors(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch vendors:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    let result = vendors;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        (v.company_name && v.company_name.toLowerCase().includes(q)) ||
        (v.gst_number && v.gst_number.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== 'All Status') {
      result = result.filter(v => v.vendor_status === selectedStatus);
    }

    setFilteredVendors(result);
  }, [searchQuery, selectedStatus, vendors]);

  const handleUpdateStatus = async (vendorId: number, newStatus: 'Approved' | 'Blacklisted') => {
    setActioningId(vendorId);
    try {
      const res = await apiFetch(`/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify({ vendor_status: newStatus })
      });

      if (res.success) {
        // Update locally
        setVendors(prev => prev.map(v => v.vendor_id === vendorId ? { ...v, vendor_status: newStatus } : v));
      } else {
        alert(res.message || "Failed to update vendor verification status");
      }
    } catch (err: any) {
      alert(`Error updating vendor: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Supplier Review & Verification</h1>
        <p className="text-muted">Review, verify, and approve new suppliers or blacklist non-compliant vendors.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search suppliers by name, category, or GST number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: 'auto' }} 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All Status">All Verification Statuses</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Approved">Approved Suppliers</option>
            <option value="Blacklisted">Blacklisted Suppliers</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center p-8">Loading supplier profiles...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center p-8 text-muted border" style={{ borderRadius: '6px', borderStyle: 'dashed' }}>
            No suppliers found matching current selection.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>GST Number</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.vendor_id}>
                    <td>
                      <div>
                        <div className="font-bold">{vendor.company_name}</div>
                        <div className="text-muted text-sm">{vendor.email}</div>
                      </div>
                    </td>
                    <td>{vendor.category || 'N/A'}</td>
                    <td><code>{vendor.gst_number}</code></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={14} fill="var(--accent)" color="var(--accent)" />
                        <span>{parseFloat(vendor.rating_indicator || '5.0').toFixed(1)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        vendor.vendor_status === 'Approved' ? 'badge-success' :
                        vendor.vendor_status === 'Blacklisted' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {vendor.vendor_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {vendor.vendor_status === 'Pending Verification' ? (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }}
                            disabled={actioningId === vendor.vendor_id}
                            onClick={() => handleUpdateStatus(vendor.vendor_id, 'Approved')}
                          >
                            {actioningId === vendor.vendor_id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }}
                            disabled={actioningId === vendor.vendor_id}
                            onClick={() => handleUpdateStatus(vendor.vendor_id, 'Blacklisted')}
                          >
                            <AlertOctagon size={14} /> Blacklist
                          </button>
                        </div>
                      ) : vendor.vendor_status === 'Approved' ? (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }}
                          disabled={actioningId === vendor.vendor_id}
                          onClick={() => handleUpdateStatus(vendor.vendor_id, 'Blacklisted')}
                        >
                          <AlertOctagon size={14} /> Blacklist
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }}
                          disabled={actioningId === vendor.vendor_id}
                          onClick={() => handleUpdateStatus(vendor.vendor_id, 'Approved')}
                        >
                          <Check size={14} /> Reinstate / Approve
                        </button>
                      )}
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

export default AdminVendorsReview;
