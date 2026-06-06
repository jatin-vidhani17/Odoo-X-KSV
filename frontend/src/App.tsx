import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import ProcurementLayout from './layout/ProcurementLayout';
import AdminLayout from './layout/AdminLayout';
import VendorLayout from './layout/VendorLayout';
import ManagerLayout from './layout/ManagerLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Procurement Pages
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import RFQsList from './pages/RFQsList';
import CreateRFQ from './pages/CreateRFQ';
import SelectQuotations from './pages/SelectQuotations';
import QuotationComparison from './pages/QuotationComparison';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import PurchaseOrder from './pages/PurchaseOrder';
import Invoices from './pages/Invoices';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminVendorsReview from './pages/AdminVendorsReview';

// Vendor Pages
import VendorDashboard from './pages/VendorDashboard';
import VendorRFQs from './pages/VendorRFQs';
import VendorQuotations from './pages/VendorQuotations';

// Manager Pages
import ManagerDashboard from './pages/ManagerDashboard';

// Auth Wrapper
import ProtectedRoute from './components/ProtectedRoute';

import './index.css';

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    switch (user.role) {
      case 'Admin': return <Navigate to="/admin" replace />;
      case 'Vendor': return <Navigate to="/vendor" replace />;
      case 'Manager': return <Navigate to="/manager" replace />;
      case 'Procurement Officer': return <Navigate to="/procurement" replace />;
      default: return <Navigate to="/login" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dynamic Root Redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Procurement Role */}
        <Route element={<ProtectedRoute allowedRoles={['Procurement Officer']} />}>
          <Route path="/procurement" element={<ProcurementLayout />}>
            <Route index element={<Navigate to="/procurement/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="rfqs" element={<RFQsList />} />
            <Route path="rfqs/create" element={<CreateRFQ />} />
            <Route path="quotations/select" element={<SelectQuotations />} />
            <Route path="quotations/compare" element={<QuotationComparison />} />
            <Route path="approvals" element={<ApprovalWorkflow />} />
            <Route path="purchase-orders" element={<PurchaseOrder />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="activity" element={<ActivityLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Admin Role */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="vendors" element={<AdminVendorsReview />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Vendor Role */}
        <Route element={<ProtectedRoute allowedRoles={['Vendor']} />}>
          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="rfqs" element={<VendorRFQs />} />
            <Route path="quotations" element={<VendorQuotations />} />
            <Route path="purchase-orders" element={<PurchaseOrder />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Manager Role */}
        <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="approvals" element={<ApprovalWorkflow />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
