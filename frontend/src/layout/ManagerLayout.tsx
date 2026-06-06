import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare,
  LogOut,
  Bell,
  User,
  Settings
} from 'lucide-react';

const ManagerLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          VendorBridge <span style={{fontSize: '0.75rem', marginLeft: '8px', color: 'var(--text-muted)'}}>MGR</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/manager/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/manager/approvals" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} />
            <span>Pending Approvals</span>
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="text-muted text-sm">
            Manager - Approvals
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

export default ManagerLayout;
