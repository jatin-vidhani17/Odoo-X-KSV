import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (!allowedRoles.includes(user.role)) {
      // Redirect to their respective dashboard if role doesn't match
      switch (user.role) {
        case 'Admin': return <Navigate to="/admin" replace />;
        case 'Vendor': return <Navigate to="/vendor" replace />;
        case 'Manager': return <Navigate to="/manager" replace />;
        case 'Procurement Officer': return <Navigate to="/procurement" replace />;
        default: 
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return <Navigate to="/login" replace />;
      }
    }
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
