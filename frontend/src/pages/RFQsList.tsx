import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileSpreadsheet } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RFQsList = () => {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [filteredRfqs, setFilteredRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/rfqs');
      if (res.success && Array.isArray(res.data)) {
        setRfqs(res.data);
        setFilteredRfqs(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch RFQs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  useEffect(() => {
    let result = rfqs;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== 'All Status') {
      result = result.filter(r => r.status === selectedStatus);
    }

    setFilteredRfqs(result);
  }, [searchQuery, selectedStatus, rfqs]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Request for Quotations (RFQs)</h1>
          <p className="text-muted">Monitor and manage all outgoing supplier quotes request</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/procurement/rfqs/create')}>
          <Plus size={18} /> Create RFQ
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search RFQs by title or category..." 
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
            <option>All Status</option>
            <option>Draft</option>
            <option>Published</option>
            <option>Under Review</option>
            <option>Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center p-8">Loading RFQs list...</div>
        ) : filteredRfqs.length === 0 ? (
          <div className="text-center p-8 text-muted border" style={{ borderRadius: '6px' }}>
            No RFQ records found in database.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RFQ Title</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqs.map((rfq) => (
                  <tr key={rfq.id}>
                    <td className="font-bold">{rfq.title}</td>
                    <td>{rfq.category}</td>
                    <td>{new Date(rfq.deadline).toLocaleDateString()}</td>
                    <td>{rfq.creator_name || `User ID ${rfq.created_by}`}</td>
                    <td>
                      <span className={`badge ${
                        rfq.status === 'Published' ? 'badge-success' :
                        rfq.status === 'Closed' ? 'badge-danger' :
                        rfq.status === 'Under Review' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline flex items-center gap-1" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/procurement/quotations/select?rfqId=${rfq.id}`)}
                      >
                        <FileSpreadsheet size={14} /> View Bids
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

export default RFQsList;
