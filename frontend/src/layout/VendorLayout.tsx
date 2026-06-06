import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  CheckSquare,
  LogOut,
  Bell,
  User,
  Settings
} from 'lucide-react';

const VendorLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          VendorBridge <span style={{fontSize: '0.75rem', marginLeft: '8px', color: 'var(--text-muted)'}}>VENDOR</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/vendor/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/vendor/rfqs" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>New RFQs</span>
          </NavLink>
          <NavLink to="/vendor/quotations" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} />
            <span>My Quotations</span>
          </NavLink>
          <NavLink to="/vendor/purchase-orders" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} />
            <span>Purchase Orders</span>
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="text-muted text-sm">
            Vendor Portal - Global Furniture
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button className="text-muted" aria-label="Settings">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-2 border-l border-gray-700 pl-4 ml-2">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--warning)' }}>
                <User size={16} />
              </div>
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

export default VendorLayout;
