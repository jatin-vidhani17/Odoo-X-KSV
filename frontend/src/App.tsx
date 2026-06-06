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
import CreateRFQ from './pages/CreateRFQ';
import SelectQuotations from './pages/SelectQuotations';
import QuotationComparison from './pages/QuotationComparison';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import PurchaseOrder from './pages/PurchaseOrder';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminVendorsReview from './pages/AdminVendorsReview';

// Vendor Pages
import VendorDashboard from './pages/VendorDashboard';

// Manager Pages
import ManagerDashboard from './pages/ManagerDashboard';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Redirect root to login or a default role dashboard. Let's redirect to procurement dashboard for now */}
        <Route path="/" element={<Navigate to="/procurement/dashboard" replace />} />
        
        {/* Procurement Role */}
        <Route path="/procurement" element={<ProcurementLayout />}>
          <Route index element={<Navigate to="/procurement/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="rfqs/create" element={<CreateRFQ />} />
          <Route path="quotations/select" element={<SelectQuotations />} />
          <Route path="quotations/compare" element={<QuotationComparison />} />
          <Route path="approvals" element={<ApprovalWorkflow />} />
          <Route path="purchase-orders" element={<PurchaseOrder />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Admin Role */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vendors" element={<AdminVendorsReview />} />
        </Route>

        {/* Vendor Role */}
        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          {/* Reusing some components for visual placeholder or you can create specific ones later */}
          <Route path="rfqs" element={<div style={{ padding: '2rem' }}><h2>Vendor RFQs</h2><p className="text-muted">List of RFQs assigned to this vendor.</p></div>} />
          <Route path="quotations" element={<div style={{ padding: '2rem' }}><h2>My Quotations</h2><p className="text-muted">Manage submitted quotations.</p></div>} />
          <Route path="purchase-orders" element={<PurchaseOrder />} />
        </Route>

        {/* Manager Role */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="approvals" element={<ApprovalWorkflow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
