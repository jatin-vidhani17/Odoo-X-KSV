import { useEffect, useState } from 'react';
import { User, FileText, CheckSquare, Info } from 'lucide-react';
import { apiFetch } from '../utils/api';

const ActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/activity-logs');
        if (res.success && Array.isArray(res.data)) {
          setLogs(res.data);
          setFilteredLogs(res.data);
        }
      } catch (err: any) {
        console.error("Error fetching logs:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setFilteredLogs(logs);
    } else if (filter === 'Approvals') {
      setFilteredLogs(logs.filter(l => 
        l.activity_type.toLowerCase().includes('approval') || 
        l.activity_type.toLowerCase().includes('payment')
      ));
    } else if (filter === 'RFQs') {
      setFilteredLogs(logs.filter(l => 
        l.activity_type.toLowerCase().includes('rfq') || 
        l.activity_type.toLowerCase().includes('quotation')
      ));
    } else if (filter === 'System') {
      setFilteredLogs(logs.filter(l => 
        !l.activity_type.toLowerCase().includes('approval') && 
        !l.activity_type.toLowerCase().includes('payment') &&
        !l.activity_type.toLowerCase().includes('rfq') && 
        !l.activity_type.toLowerCase().includes('quotation')
      ));
    }
  };

  const getLogIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('approve') || t.includes('payment') || t.includes('order')) {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <CheckSquare size={20} />
        </div>
      );
    }
    if (t.includes('rfq') || t.includes('quotation') || t.includes('invoice')) {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
          <FileText size={20} />
        </div>
      );
    }
    if (t.includes('register') || t.includes('login') || t.includes('user') || t.includes('vendor')) {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
          <User size={20} />
        </div>
      );
    }
    return (
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <Info size={20} />
      </div>
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Activity & Logs</h1>
        <p className="text-muted">System-wide audit trail</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {['All', 'Approvals', 'RFQs', 'System'].map((f) => (
            <button 
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`btn ${activeFilter === f ? 'btn-primary' : 'btn-outline'}`} 
              style={{ borderRadius: '999px' }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center p-8">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center p-8 text-muted">No activity logs found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '0', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
            
            {filteredLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                {getLogIcon(log.activity_type)}
                <div style={{ flex: 1, backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="font-bold">{log.activity_type}</span>
                    <span className="text-sm text-muted">{formatTime(log.recorded_at)}</span>
                  </div>
                  <p className="text-muted text-sm">{log.log_summary}</p>
                  {log.user_name && (
                    <div className="text-xs text-muted mt-2" style={{ fontStyle: 'italic' }}>
                      Logged by: {log.user_name} ({log.user_role})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
