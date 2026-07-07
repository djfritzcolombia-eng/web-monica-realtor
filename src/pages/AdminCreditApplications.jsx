import { useCallback, useEffect, useState } from "react";
import AdminLoadingState from "../components/admin/AdminLoadingState";
import AdminShell from "../components/admin/AdminShell";
import CreditApplicationReview from "../components/CreditApplicationReview";
import {
    CREDIT_APP_STATUSES,
    CREDIT_APP_STATUS_LABELS,
    formatCreditApplicationDate,
    getApplicantFullName,
} from "../utils/creditApplicationForm";
import { downloadCreditApplicationPdf } from "../utils/creditApplicationPdf";
import {
    fetchCreditApplications,
    updateCreditApplicationReview,
} from "../services/adminCreditApplications";
import { getAdminUser } from "../services/adminAuth";
import styles from "./Admin.module.css";

function CreditApplicationDetail({ application, onRefresh, adminUser }) {
    const [adminStatus, setAdminStatus] = useState(application.adminStatus || CREDIT_APP_STATUSES.pending);
    const [adminNotes, setAdminNotes] = useState(application.adminNotes || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setAdminStatus(application.adminStatus || CREDIT_APP_STATUSES.pending);
        setAdminNotes(application.adminNotes || "");
        setMessage("");
    }, [application.id, application.adminStatus, application.adminNotes]);

    const handleDownloadPdf = () => {
        const submittedAt = formatCreditApplicationDate(application.createdAt);
        downloadCreditApplicationPdf({
            form: application,
            simulation: application.simulationSummary,
            submittedAt: submittedAt !== "—" ? submittedAt : undefined,
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            await updateCreditApplicationReview(application.id, { adminStatus, adminNotes });
            setMessage("Cambios guardados.");
            await onRefresh?.();
        } catch (err) {
            setMessage(err?.message || "No se pudieron guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.sessionDetailCard}>
            <div className={styles.reviewActionBar} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <button type="button" className={styles.btnPublish} onClick={handleDownloadPdf}>
                    Descargar PDF
                </button>
                <a
                    href={`mailto:${application.email}`}
                    className={styles.btnEmail}
                >
                    Contactar solicitante
                </a>
            </div>

            <CreditApplicationReview application={application} />

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e6dace" }}>
                <p className={styles.reviewSectionTitle}>Gestión interna</p>
                <p className={styles.panelSubtitle}>
                    Correo enviado a {application.emailSentTo || "monicafritzrealtor@gmail.com"}
                    {application.pdfFileName ? ` · ${application.pdfFileName}` : ""}
                </p>

                <label className={styles.detailItem} style={{ display: "block", marginBottom: 12 }}>
                    <span className={styles.detailLabel}>Estado</span>
                    <select
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value)}
                        style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1px solid #e6dace" }}
                    >
                        {Object.entries(CREDIT_APP_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>

                <label className={styles.detailItem} style={{ display: "block", marginBottom: 12 }}>
                    <span className={styles.detailLabel}>Notas internas</span>
                    <textarea
                        rows={4}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Seguimiento, llamadas, documentos pendientes…"
                        style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1px solid #e6dace", fontFamily: "inherit" }}
                    />
                </label>

                <div className={styles.reviewActionBar}>
                    <button type="button" className={styles.btnApprove} onClick={handleSave} disabled={saving}>
                        {saving ? "Guardando…" : "Guardar gestión"}
                    </button>
                </div>

                {message && <p className={styles.panelSubtitle} style={{ marginTop: 12 }}>{message}</p>}
                {adminUser?.usuario && (
                    <p className={styles.panelSubtitle}>Sesión: {adminUser.usuario}</p>
                )}
            </div>
        </div>
    );
}

export default function AdminCreditApplications() {
    const adminUser = getAdminUser();
    const [applications, setApplications] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await fetchCreditApplications();
            setApplications(data);
            setSelectedId((prev) => prev || data[0]?.id || null);
        } catch (err) {
            setError(err?.message || "No se pudieron cargar las consultas de crédito.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const selectedApplication = applications.find((item) => item.id === selectedId) || null;
    const pendingCount = applications.filter(
        (item) => (item.adminStatus || CREDIT_APP_STATUSES.pending) === CREDIT_APP_STATUSES.pending
    ).length;

    return (
        <AdminShell
            title="Consultas de viabilidad · Crédito"
            onRefresh={loadApplications}
            error={error}
        >
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Consultas</span>
                    <span className={styles.statValue}>{applications.length}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pendientes</span>
                    <span className={styles.statValue}>{pendingCount}</span>
                </div>
            </div>

            <div className={styles.layout}>
                <aside className={styles.sessionsPanel}>
                    <div className={styles.sessionsPanelHeader}>
                        <h2 className={styles.panelTitle}>Solicitudes</h2>
                        <p className={styles.panelSubtitle}>{applications.length} registradas</p>
                    </div>
                    <div className={styles.sessionsScroll}>
                        {loading ? (
                            <AdminLoadingState label="Cargando consultas de crédito…" />
                        ) : applications.length === 0 ? (
                            <p className={styles.emptyState}>Aún no hay consultas de viabilidad enviadas.</p>
                        ) : (
                            <ul className={styles.sessionList}>
                                {applications.map((application) => {
                                    const isActive = application.id === selectedId;
                                    const name = getApplicantFullName(application);
                                    return (
                                        <li key={application.id}>
                                            <button
                                                type="button"
                                                className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ""}`}
                                                onClick={() => setSelectedId(application.id)}
                                            >
                                                <div className={styles.sessionTop}>
                                                    <span className={styles.sessionId}>{name || "Sin nombre"}</span>
                                                    <span className={styles.sessionDate}>
                                                        {formatCreditApplicationDate(application.createdAt)}
                                                    </span>
                                                </div>
                                                <div className={styles.sessionSummary}>
                                                    {application.workCity || application.propertyCity || "—"}
                                                    {" · "}
                                                    {application.docNumber || "—"}
                                                </div>
                                                <div className={styles.sessionTags}>
                                                    <span className={`${styles.tag} ${styles.tagAccent}`}>
                                                        {CREDIT_APP_STATUS_LABELS[application.adminStatus]
                                                            || CREDIT_APP_STATUS_LABELS[CREDIT_APP_STATUSES.pending]}
                                                    </span>
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
                        {!selectedApplication ? (
                            <p className={styles.emptyState}>Selecciona una consulta para revisarla.</p>
                        ) : (
                            <CreditApplicationDetail
                                application={selectedApplication}
                                onRefresh={loadApplications}
                                adminUser={adminUser}
                            />
                        )}
                    </div>
                </main>
            </div>
        </AdminShell>
    );
}
