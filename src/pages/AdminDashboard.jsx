import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    fetchSessionById,
    fetchSessionEvents,
    fetchSessions,
    formatFirestoreDate,
    formatUbicacion,
} from "../services/adminData";
import { getAdminUser, logoutAdmin } from "../services/adminAuth";
import {
    buildEventSummaryEs,
    getActionEs,
    getEventTypeEs,
    getScreenNameEs,
} from "../utils/adminLabels";
import styles from "./Admin.module.css";

function MetadataView({ metadata }) {
    if (!metadata || typeof metadata !== "object") return null;

    const sections = Object.entries(metadata);
    return (
        <div className={styles.metadataBlock}>
            <div className={styles.metadataTitle}>Metadata</div>
            {sections.map(([key, value]) => (
                <div key={key} className={styles.metadataSection}>
                    <strong>{key}</strong>
                    <pre className={styles.metadataPre}>
                        {typeof value === "object"
                            ? JSON.stringify(value, null, 2)
                            : String(value)}
                    </pre>
                </div>
            ))}
        </div>
    );
}

function SessionDetail({ session }) {
    if (!session) return null;

    const search = session.lastSearch;
    const property = session.lastViewedProperty;

    return (
        <div className={styles.sessionDetailCard}>
            <h2 className={styles.panelTitle} style={{ padding: 0, marginBottom: 8 }}>
                Detalle de sesión
            </h2>
            <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Inicio</span>
                    <span className={styles.detailValue}>{formatFirestoreDate(session.startedAt)}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Última actividad</span>
                    <span className={styles.detailValue}>{formatFirestoreDate(session.lastActivityAt)}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Visitante</span>
                    <span className={styles.detailValue}>{session.visitorId || "—"}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Eventos</span>
                    <span className={styles.detailValue}>{session.metrics?.eventCount ?? "—"}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Búsquedas</span>
                    <span className={styles.detailValue}>{session.metrics?.searches ?? "—"}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ubicación</span>
                    <span className={styles.detailValue}>
                        {formatUbicacion(session.ubicacion)}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Zona horaria</span>
                    <span className={styles.detailValue}>
                        {session.ubicacion?.zonaHoraria || session.device?.timezone || "—"}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Última acción</span>
                    <span className={styles.detailValue}>
                        {getEventTypeEs(session.lastAction)}
                    </span>
                </div>
            </div>

            {search && (
                <MetadataView metadata={{ busqueda: search }} />
            )}
            {property && (
                <MetadataView metadata={{ inmueble: property }} />
            )}
            {session.device && (
                <MetadataView
                    metadata={{
                        dispositivo: {
                            idioma: session.device.language,
                            plataforma: session.device.platform,
                            pantalla: session.device.screen,
                            viewport: session.device.viewport,
                        },
                    }}
                />
            )}
        </div>
    );
}

function EventCard({ event }) {
    const tipoEs = getEventTypeEs(event.type);
    const accionEs = getActionEs(event.action);
    const pantallaEs = getScreenNameEs(event);
    const resumen = buildEventSummaryEs(event);
    const ubicacion = formatUbicacion(event.ubicacion);

    return (
        <article className={styles.eventCard}>
            <div className={styles.eventHeader}>
                <span className={styles.eventType}>
                    #{event.sequence ?? "—"} · {tipoEs}
                </span>
                <span className={styles.eventTime}>
                    {formatFirestoreDate(event.clientTimestamp || event.createdAt)}
                </span>
            </div>
            <p className={styles.eventScreen}>Pantalla: {pantallaEs}</p>
            {accionEs && (
                <p className={styles.eventAction}>{accionEs}</p>
            )}
            {resumen && (
                <p className={styles.eventSummary}>{resumen}</p>
            )}
            {ubicacion !== "—" && (
                <p className={styles.eventLocation}>📍 {ubicacion}</p>
            )}
            {event.metadata && <MetadataView metadata={event.metadata} />}
            {!event.metadata && (event.target || event.groups || event.zones) && (
                <MetadataView
                    metadata={{
                        extra: {
                            target: event.target,
                            groups: event.groups,
                            zones: event.zones,
                            page: event.page,
                        },
                    }}
                />
            )}
        </article>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const adminUser = getAdminUser();
    const [sessions, setSessions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [error, setError] = useState("");

    const loadSessions = useCallback(async () => {
        setLoadingSessions(true);
        setError("");
        try {
            const data = await fetchSessions();
            setSessions(data);
            setSelectedId((prev) => prev || data[0]?.id || null);
        } catch (err) {
            setError(err?.message || "No se pudieron cargar las sesiones.");
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    const loadSessionDetail = useCallback(async (sessionId) => {
        if (!sessionId) return;
        setLoadingEvents(true);
        setError("");
        try {
            const [session, sessionEvents] = await Promise.all([
                fetchSessionById(sessionId),
                fetchSessionEvents(sessionId),
            ]);
            setSelectedSession(session);
            setEvents(sessionEvents);
        } catch (err) {
            setError(err?.message || "No se pudieron cargar los eventos.");
        } finally {
            setLoadingEvents(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    useEffect(() => {
        if (selectedId) {
            loadSessionDetail(selectedId);
        }
    }, [selectedId, loadSessionDetail]);

    const handleLogout = () => {
        logoutAdmin();
        navigate("/admin", { replace: true });
    };

    const totalEvents = sessions.reduce((sum, s) => sum + (s.metrics?.eventCount ?? 0), 0);
    const totalSearches = sessions.reduce((sum, s) => sum + (s.metrics?.searches ?? 0), 0);
    const returningCount = sessions.filter((s) => s.isReturning).length;

    return (
        <div className={styles.adminPage}>
            <header className={styles.header}>
                <div className={styles.headerBrand}>
                    <div className={styles.headerLogo}>MF</div>
                    <div>
                        <h1 className={styles.headerTitle}>Panel de analítica</h1>
                        <p className={styles.headerMeta}>
                            Conectado como <strong>{adminUser?.usuario || "admin"}</strong>
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/admin/vender" className={styles.btnGhost}>Revisar ventas</Link>
                    <button type="button" className={styles.btnGhost} onClick={loadSessions}>
                        ↻ Actualizar
                    </button>
                    <button type="button" className={styles.btnGhost} onClick={handleLogout}>
                        Salir
                    </button>
                </div>
            </header>

            {error && <p className={styles.errorBanner}>{error}</p>}

            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Sesiones</span>
                    <span className={styles.statValue}>{sessions.length}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Eventos totales</span>
                    <span className={styles.statValue}>{totalEvents}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Búsquedas</span>
                    <span className={styles.statValue}>{totalSearches}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Recurrentes</span>
                    <span className={styles.statValue}>{returningCount}</span>
                </div>
            </div>

            <div className={styles.layout}>
                <aside className={styles.sessionsPanel}>
                    <div className={styles.sessionsPanelHeader}>
                        <h2 className={styles.panelTitle}>Sesiones</h2>
                        <p className={styles.panelSubtitle}>{sessions.length} registradas</p>
                    </div>
                    <div className={styles.sessionsScroll}>
                    {loadingSessions ? (
                        <p className={styles.emptyState}>Cargando sesiones…</p>
                    ) : sessions.length === 0 ? (
                        <p className={styles.emptyState}>No hay sesiones registradas aún.</p>
                    ) : (
                        <ul className={styles.sessionList}>
                            {sessions.map((session) => {
                                const isActive = session.id === selectedId;
                                const searchText = session.lastSearch?.textoResumen
                                    || session.lastSearch?.zonas?.join(", ")
                                    || "Sin búsqueda";
                                const propertyText = session.lastViewedProperty?.titulo
                                    || session.lastViewedProperty?.valorLabel
                                    || null;

                                return (
                                    <li key={session.id}>
                                        <button
                                            type="button"
                                            className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ""}`}
                                            onClick={() => setSelectedId(session.id)}
                                        >
                                            <div className={styles.sessionTop}>
                                                <span className={styles.sessionId}>{session.id}</span>
                                                <span className={styles.sessionDate}>
                                                    {formatFirestoreDate(session.startedAt)}
                                                </span>
                                            </div>
                                            <div className={styles.sessionSummary}>
                                                {searchText}
                                                {formatUbicacion(session.ubicacion) !== "—" && (
                                                    <span className={styles.sessionLocation}>
                                                        📍 {formatUbicacion(session.ubicacion)}
                                                    </span>
                                                )}
                                                {propertyText && (
                                                    <span className={styles.sessionProperty}>
                                                        {propertyText}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.sessionTags}>
                                                <span className={`${styles.tag} ${styles.tagAccent}`}>
                                                    {session.metrics?.eventCount ?? 0} eventos
                                                </span>
                                                <span className={styles.tag}>
                                                    {getEventTypeEs(session.lastAction)}
                                                </span>
                                                {session.isReturning && (
                                                    <span className={styles.tag}>Recurrente</span>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    </div>
                </aside>

                <main className={styles.eventsPanel}>
                    <div className={styles.eventsPanelScroll}>
                    {!selectedId ? (
                        <p className={styles.emptyState}>Selecciona una sesión para ver su traza completa.</p>
                    ) : (
                        <>
                            <SessionDetail session={selectedSession} />
                            <h2 className={styles.panelTitle} style={{ marginBottom: 4 }}>
                                Eventos de la sesión
                            </h2>
                            <p className={styles.panelSubtitle} style={{ marginBottom: 16 }}>
                                {events.length} acciones registradas
                            </p>
                            {loadingEvents ? (
                                <p className={styles.emptyState}>Cargando eventos…</p>
                            ) : events.length === 0 ? (
                                <p className={styles.emptyState}>Esta sesión no tiene eventos.</p>
                            ) : (
                                <div className={styles.eventsList}>
                                    {events.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    </div>
                </main>
            </div>
        </div>
    );
}
