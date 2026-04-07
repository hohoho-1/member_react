import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../utils/authFetch';

export default function PrivateRoute({ children }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
