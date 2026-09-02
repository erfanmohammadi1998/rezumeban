import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./ui";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <PageLoader />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
