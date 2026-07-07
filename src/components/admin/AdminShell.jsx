import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminHouseMark from "./AdminHouseMark";
import { getAdminUser, logoutAdmin } from "../../services/adminAuth";
import styles from "../../pages/Admin.module.css";

const NAV_ITEMS = [
    {
        to: "/admin/inicio",
        label: "Inicio",
        isActive: (path) => path === "/admin/inicio",
    },
    {
        to: "/admin/catalogo",
        label: "Catálogos",
        isActive: (path) => path.startsWith("/admin/catalogo"),
    },
    {
        to: "/admin/credito",
        label: "Crédito",
        isActive: (path) => path.startsWith("/admin/credito"),
    },
    {
        to: "/admin/vender",
        label: "Vender",
        isActive: (path) => path.startsWith("/admin/vender"),
    },
    {
        to: "/admin/dashboard",
        label: "Analítica",
        isActive: (path) => path.startsWith("/admin/dashboard"),
    },
];

export default function AdminShell({
    title,
    subtitle,
    onRefresh,
    error,
    children,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const adminUser = getAdminUser();
    const currentPath = location.pathname.replace(/\/$/, "") || "/admin";

    const handleLogout = () => {
        logoutAdmin();
        navigate("/admin", { replace: true });
    };

    return (
        <div className={styles.adminPage}>
            <header className={styles.header}>
                <div className={styles.headerBrand}>
                    <AdminHouseMark className={styles.headerHouseMark} />
                    <div>
                        <p className={styles.headerEyebrow}>Mónica Fritz Realtor</p>
                        <h1 className={styles.headerTitle}>{title}</h1>
                        <p className={styles.headerMeta}>
                            {subtitle || (
                                <>
                                    Sesión de <strong>{adminUser?.usuario || "admin"}</strong>
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    {onRefresh && (
                        <button type="button" className={styles.btnGhost} onClick={onRefresh}>
                            Actualizar
                        </button>
                    )}
                    <button type="button" className={styles.btnGhost} onClick={handleLogout}>
                        Salir
                    </button>
                </div>
            </header>

            <nav className={styles.adminNav} aria-label="Secciones del panel">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`${styles.adminNavLink} ${item.isActive(currentPath) ? styles.adminNavLinkActive : ""}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            {error && <p className={styles.errorBanner}>{error}</p>}

            {children}
        </div>
    );
}
