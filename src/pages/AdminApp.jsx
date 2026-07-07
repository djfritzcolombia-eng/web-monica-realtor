import { Navigate, Route, Routes } from "react-router-dom";
import AdminGuard from "../components/admin/AdminGuard";
import AdminCatalogBuilder from "./AdminCatalogBuilder";
import AdminCreditApplications from "./AdminCreditApplications";
import AdminDashboard from "./AdminDashboard";
import AdminHome from "./AdminHome";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminSellListings from "./AdminSellListings";

export default function AdminApp() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="/" element={<AdminLogin />} />
                <Route
                    path="/inicio"
                    element={(
                        <AdminGuard>
                            <AdminHome />
                        </AdminGuard>
                    )}
                />
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
                <Route
                    path="/catalogo"
                    element={(
                        <AdminGuard>
                            <AdminCatalogBuilder />
                        </AdminGuard>
                    )}
                />
                <Route
                    path="/credito"
                    element={(
                        <AdminGuard>
                            <AdminCreditApplications />
                        </AdminGuard>
                    )}
                />
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}
