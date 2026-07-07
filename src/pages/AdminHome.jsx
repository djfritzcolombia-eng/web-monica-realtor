import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLoadingState from "../components/admin/AdminLoadingState";
import AdminShell from "../components/admin/AdminShell";
import { fetchCreditApplications } from "../services/adminCreditApplications";
import { fetchSessions } from "../services/adminData";
import { fetchSellListings, SELL_LISTING_STATUSES } from "../services/sellListingService";
import { CREDIT_APP_STATUSES } from "../utils/creditApplicationForm";
import styles from "./Admin.module.css";

function HomeCard({ title, description, to, stat, statLabel, pending, accent }) {
    return (
        <Link to={to} className={`${styles.homeCard} ${accent ? styles.homeCardAccent : ""}`}>
            <div className={styles.homeCardTop}>
                <h2 className={styles.homeCardTitle}>{title}</h2>
                {pending > 0 && (
                    <span className={styles.homeCardBadge}>{pending} pendiente{pending === 1 ? "" : "s"}</span>
                )}
            </div>
            <p className={styles.homeCardDescription}>{description}</p>
            <div className={styles.homeCardStat}>
                <span className={styles.homeCardStatValue}>{stat}</span>
                <span className={styles.homeCardStatLabel}>{statLabel}</span>
            </div>
            <span className={styles.homeCardCta}>Abrir sección →</span>
        </Link>
    );
}

export default function AdminHome() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState({
        sessions: 0,
        sellListings: 0,
        sellPending: 0,
        creditApps: 0,
        creditPending: 0,
    });

    const loadSummary = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [sessions, listings, applications] = await Promise.all([
                fetchSessions(),
                fetchSellListings(),
                fetchCreditApplications(),
            ]);

            setSummary({
                sessions: sessions.length,
                sellListings: listings.length,
                sellPending: listings.filter((item) => item.status === SELL_LISTING_STATUSES.pending).length,
                creditApps: applications.length,
                creditPending: applications.filter(
                    (item) => (item.adminStatus || CREDIT_APP_STATUSES.pending) === CREDIT_APP_STATUSES.pending
                ).length,
            });
        } catch (err) {
            setError(err?.message || "No se pudo cargar el resumen del panel.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const totalPending = summary.sellPending + summary.creditPending;

    return (
        <AdminShell
            title="Panel de administración"
            subtitle="Resumen de actividad y solicitudes pendientes"
            onRefresh={loadSummary}
            error={error}
        >
            <div className={styles.homePage}>
                <div className={styles.homeIntro}>
                    <p className={styles.homeIntroLead}>
                        Gestiona desde un solo lugar las consultas de crédito, los inmuebles enviados
                        para vender y la analítica de visitantes del sitio.
                    </p>
                    {!loading && totalPending > 0 && (
                        <p className={styles.homeIntroAlert}>
                            Tienes <strong>{totalPending}</strong> solicitud{totalPending === 1 ? "" : "es"} pendiente{totalPending === 1 ? "" : "s"} de revisión.
                        </p>
                    )}
                </div>

                {loading ? (
                    <AdminLoadingState label="Cargando resumen del panel…" />
                ) : (
                    <div className={styles.homeGrid}>
                        <HomeCard
                            title="Catálogos personalizados"
                            description="Selecciona inmuebles y genera un enlace privado para enviar opciones curadas a cada cliente."
                            to="/admin/catalogo"
                            stat="→"
                            statLabel="crear selección"
                            pending={0}
                            accent
                        />
                        <HomeCard
                            title="Consultas de crédito"
                            description="Revisa consultas de viabilidad, descarga PDF y gestiona el seguimiento con cada solicitante."
                            to="/admin/credito"
                            stat={summary.creditApps}
                            statLabel="consultas registradas"
                            pending={summary.creditPending}
                            accent={summary.creditPending > 0}
                        />
                        <HomeCard
                            title="Inmuebles en venta"
                            description="Aprueba, publica o solicita correcciones a los propietarios que envían su inmueble."
                            to="/admin/vender"
                            stat={summary.sellListings}
                            statLabel="solicitudes de venta"
                            pending={summary.sellPending}
                            accent={summary.sellPending > 0}
                        />
                        <HomeCard
                            title="Analítica del sitio"
                            description="Sesiones, búsquedas, propiedades vistas y eventos de los visitantes en tiempo real."
                            to="/admin/dashboard"
                            stat={summary.sessions}
                            statLabel="sesiones registradas"
                            pending={0}
                        />
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
