import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  ShoppingCart, 
  BarChart2, 
  Activity,
  LogOut,
  Bell,
  User,
  Settings
} from 'lucide-react';

const ProcurementLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          VendorBridge <span style={{fontSize: '0.75rem', marginLeft: '8px', color: 'var(--text-muted)'}}>PROC</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/procurement/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/procurement/vendors" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Vendors</span>
          </NavLink>
          <NavLink to="/procurement/rfqs/create" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>RFQs</span>
          </NavLink>
          <NavLink to="/procurement/quotations/select" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Quotations</span>
          </NavLink>
          <NavLink to="/procurement/approvals" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} />
            <span>Approvals</span>
          </NavLink>
          <NavLink to="/procurement/purchase-orders" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} />
            <span>Purchase Orders</span>
          </NavLink>
          <NavLink to="/procurement/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart2 size={20} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/procurement/activity" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={20} />
            <span>Activity</span>
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="text-muted text-sm">
            Procurement Officer - Welcome back!
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button className="text-muted" aria-label="Settings">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-2 border-l border-gray-700 pl-4 ml-2">
              <Link to="profile" className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold border border-gray-600 hover:border-gray-400 transition-colors" style={{ overflow: 'hidden' }}>
                {localStorage.getItem('profilePhoto') ? (
                  <img src={localStorage.getItem('profilePhoto') as string} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={16} />
                )}
              </Link>
              <button onClick={handleLogout} className="text-muted flex items-center gap-1 hover:text-white" style={{fontSize: '0.875rem'}}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProcurementLayout;
