import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
            navigate("/admin/dashboard", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await loginAdmin(usuario, clave);
            navigate("/admin/dashboard", { replace: true });
        } catch (err) {
            setError(err?.message || "No se pudo iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginBrand}>
                <div className={styles.loginBrandLogo}>MF</div>
                <h1 className={styles.loginBrandTitle}>
                    Panel de<br />analítica
                </h1>
                <p className={styles.loginBrandSubtitle}>
                    Monitorea las sesiones, búsquedas y eventos de los visitantes en tiempo real.
                </p>
                <div className={styles.loginBrandFeatures}>
                    <div className={styles.loginBrandFeature}>
                        <span>📊</span>
                        Sesiones y trazas completas
                    </div>
                    <div className={styles.loginBrandFeature}>
                        <span>🏠</span>
                        Propiedades e inmuebles vistos
                    </div>
                    <div className={styles.loginBrandFeature}>
                        <span>🔍</span>
                        Búsquedas por zona y sector
                    </div>
                </div>
            </div>

            <div className={styles.loginFormSide}>
                <form className={styles.loginCard} onSubmit={handleSubmit}>
                    <h2 className={styles.loginCardTitle}>Iniciar sesión</h2>
                    <p className={styles.loginCardSubtitle}>Mónica Fritz Realtor</p>

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

                    <button type="submit" className={styles.btnPrimary} disabled={loading}>
                        {loading ? "Ingresando…" : "Ingresar al panel"}
                    </button>
                </form>
            </div>
        </div>
    );
}
