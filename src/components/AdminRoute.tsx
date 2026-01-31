import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading, authInitialized } = useAuth(); // Add authInitialized

  // Wait for auth to be fully initialized
  if (isLoading || !authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

 if (user.role !== 'admin' && user.role !== 'staff') {
  return <Navigate to="/login" replace />;
}

  return <>{children}</>;
};

export default AdminRoute;