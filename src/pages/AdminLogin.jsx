import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HouseLineLoader from "../components/HouseLineLoader";
import { ADMIN_MODULES } from "../constants/adminModules";
import { isAdminAuthenticated, loginAdmin } from "../services/adminAuth";
import styles from "./Admin.module.css";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState("");
    const [clave, setClave] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAdminAuthenticated()) {
            navigate("/admin/inicio", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await loginAdmin(usuario, clave);
            navigate("/admin/inicio", { replace: true });
        } catch (err) {
            setError(err?.message || "No se pudo iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginBrand}>
                <div className={styles.loginBrandInner}>
                    <HouseLineLoader
                        label="Panel privado"
                        compact
                        className={styles.loginHouseLoader}
                    />
                    <p className={styles.loginEyebrow}>Mónica Fritz Realtor</p>
                    <h1 className={styles.loginBrandTitle}>
                        Panel de<br />administración
                    </h1>
                    <p className={styles.loginBrandSubtitle}>
                        Gestiona consultas de crédito, inmuebles en venta y la analítica de visitantes del sitio.
                    </p>

                    <ul className={styles.loginModuleList}>
                        {ADMIN_MODULES.map((module) => (
                            <li key={module.id} className={styles.loginModuleItem}>
                                <span className={styles.loginModuleTitle}>{module.title}</span>
                                <span className={styles.loginModuleDescription}>{module.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={styles.loginFormSide}>
                {loading ? (
                    <div className={styles.loginLoadingCard}>
                        <HouseLineLoader label="Ingresando al panel…" compact />
                    </div>
                ) : (
                    <form className={styles.loginCard} onSubmit={handleSubmit}>
                        <p className={styles.loginCardEyebrow}>Acceso restringido</p>
                        <h2 className={styles.loginCardTitle}>Iniciar sesión</h2>
                        <p className={styles.loginCardSubtitle}>
                            Solo para el equipo de Mónica Fritz Realtor.
                        </p>

                        <label className={styles.label}>
                            <span className={styles.labelText}>Usuario</span>
                            <input
                                className={styles.input}
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                autoComplete="username"
                                required
                            />
                        </label>

                        <label className={styles.label}>
                            <span className={styles.labelText}>Contraseña</span>
                            <input
                                className={styles.input}
                                type="password"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                placeholder="Ingresa tu contraseña"
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        {error && <p className={styles.error}>{error}</p>}

                        <button type="submit" className={styles.loginSubmitBtn} disabled={loading}>
                            Ingresar al panel
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
