import { Navigate, Route, Routes } from "react-router-dom";
import AdminGuard from "../components/admin/AdminGuard";
import AdminDashboard from "./AdminDashboard";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminSellListings from "./AdminSellListings";

export default function AdminApp() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="/" element={<AdminLogin />} />
                <Route
                    path="/dashboard"
                    element={(
                        <AdminGuard>
                            <AdminDashboard />
                        </AdminGuard>
                    )}
                />
                <Route
                    path="/vender"
                    element={(
                        <AdminGuard>
                            <AdminSellListings />
                        </AdminGuard>
                    )}
                />
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}
