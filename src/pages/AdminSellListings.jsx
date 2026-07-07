import { useCallback, useEffect, useState } from "react";
import AdminLoadingState from "../components/admin/AdminLoadingState";
import AdminShell from "../components/admin/AdminShell";
import {
    fetchSellListings,
    SELL_LISTING_STATUSES,
    SELL_STATUS_LABELS,
    updateSellListingReview,
} from "../services/sellListingService";
import { REVISION_CHECKLIST_ITEMS, getRevisionLabels } from "../constants/sellListingRevision";
import { inferSearchGroupKeys } from "../utils/sellListingInventory";
import {
    buildOwnerMailto,
    buildOwnerRevisionDraftMessage,
    buildOwnerStatusMessage,
    buildSellListingUrl,
    buildWhatsAppUrl,
    copyText,
    normalizeOwnerPhone,
} from "../utils/sellListingLinks";
import { formatSellCurrencyDisplay } from "../utils/sellListingCurrency";
import { getAdminUser } from "../services/adminAuth";
import SellListingSubmissionReview from "../components/SellListingSubmissionReview";
import uxStyles from "../components/SellListingUx.module.css";
import reviewStyles from "../components/AdminSellReview.module.css";
import styles from "./Admin.module.css";

const CONFIRM_COPY = {
    reject: {
        title: "¿Rechazar esta solicitud?",
        detail: "El propietario podrá consultar el estado con el enlace de seguimiento. Luego envíale el deeplink por WhatsApp o correo.",
        confirm: "Sí, rechazar",
    },
    revision: {
        title: "¿Enviar correcciones al propietario?",
        detail: "La solicitud quedará en estado «Requiere correcciones». Después copia el enlace y notifícalo.",
        confirm: "Sí, enviar correcciones",
    },
    approve: {
        title: "¿Aprobar esta solicitud?",
        detail: "Confirmas que el inmueble está listo. El siguiente paso será publicarlo en la búsqueda del sitio.",
        confirm: "Sí, aprobar",
    },
    publish: {
        title: "¿Publicar en la búsqueda del sitio?",
        detail: "El inmueble aparecerá como tarjeta en el inventario, con el mismo formato de las demás propiedades.",
        confirm: "Sí, publicar ahora",
    },
    withdraw: {
        title: "¿Retirar este inmueble de la búsqueda?",
        detail: "Dejará de aparecer en el sitio (por venta, error de publicación u otro motivo). La solicitud se conserva en el panel admin.",
        confirm: "Sí, retirar de búsqueda",
    },
    unapprove: {
        title: "¿Cancelar la aprobación?",
        detail: "La solicitud volverá a «Pendiente de revisión» y no podrá publicarse hasta que la apruebes de nuevo.",
        confirm: "Sí, cancelar aprobación",
    },
    reapprove: {
        title: "¿Volver a aprobar esta solicitud?",
        detail: "Podrás publicarla de nuevo en la búsqueda cuando lo confirmes.",
        confirm: "Sí, volver a aprobar",
    },
};

function formatListingDate(value) {
    if (!value) return "—";
    if (typeof value?.toDate === "function") {
        return value.toDate().toLocaleString("es-CO");
    }
    return String(value);
}

function formatPrice(value, currency = "COP") {
    return formatSellCurrencyDisplay(value, currency === "USD" ? "USD" : "COP");
}

function OwnerShareSequence({
    ownerLink,
    ownerPhone,
    ownerEmail,
    message,
    mailListing,
    mailSubject,
    copied,
    onCopy,
}) {
    return (
        <div className={reviewStyles.shareSequence}>
            <p className={reviewStyles.shareSequenceTitle}>Notificar al propietario</p>
            <ol className={reviewStyles.shareStepList}>
                <li className={reviewStyles.shareStep}>
                    <span className={reviewStyles.shareStepNum}>1</span>
                    <span className={reviewStyles.shareStepText}>Copia el enlace de seguimiento (deeplink)</span>
                    <button type="button" className={styles.btnOnLight} onClick={() => onCopy("link", ownerLink)}>
                        {copied === "link" ? "Enlace copiado" : "Copiar enlace"}
                    </button>
                </li>
                {ownerPhone && (
                    <li className={reviewStyles.shareStep}>
                        <span className={reviewStyles.shareStepNum}>2</span>
                        <span className={reviewStyles.shareStepText}>Envía WhatsApp con el mensaje y el enlace</span>
                        <a
                            href={buildWhatsAppUrl(message, ownerPhone)}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnWhatsApp}
                        >
                            Enviar WhatsApp
                        </a>
                    </li>
                )}
                {ownerEmail && (
                    <li className={reviewStyles.shareStep}>
                        <span className={reviewStyles.shareStepNum}>{ownerPhone ? "3" : "2"}</span>
                        <span className={reviewStyles.shareStepText}>Envía correo con las observaciones</span>
                        <a
                            href={buildOwnerMailto(mailListing, mailSubject)}
                            className={styles.btnEmail}
                        >
                            Enviar correo
                        </a>
                    </li>
                )}
            </ol>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#6e6259", wordBreak: "break-all" }}>{ownerLink}</p>
        </div>
    );
}

function SellListingDetail({ listing, onRefresh, adminUser }) {
    const [revisionNotes, setRevisionNotes] = useState(listing.revisionNotes || "");
    const [revisionChecklist, setRevisionChecklist] = useState(listing.revisionChecklist || []);
    const [adminNotes, setAdminNotes] = useState(listing.adminNotes || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState("");
    const [pendingConfirm, setPendingConfirm] = useState(null);

    useEffect(() => {
        setRevisionNotes(listing.revisionNotes || "");
        setRevisionChecklist(listing.revisionChecklist || []);
        setAdminNotes(listing.adminNotes || "");
        setPendingConfirm(null);
    }, [listing]);

    const ownerLink = buildSellListingUrl(listing.id);
    const ownerPhone = normalizeOwnerPhone(listing.ownerPhone);
    const status = listing.status;
    const isPending = status === SELL_LISTING_STATUSES.pending;
    const isApproved = status === SELL_LISTING_STATUSES.approved;
    const isPublished = status === SELL_LISTING_STATUSES.published;
    const isWithdrawn = status === SELL_LISTING_STATUSES.withdrawn;
    const isRejected = status === SELL_LISTING_STATUSES.rejected;
    const isNeedsRevision = status === SELL_LISTING_STATUSES.needs_revision;
    const showShareSequence = isNeedsRevision || isRejected;
    const showReviewTools = isPending;
    const searchGroups = listing.searchGroupKeys?.length
        ? listing.searchGroupKeys
        : inferSearchGroupKeys(listing);

    const toggleChecklistItem = (itemId) => {
        setRevisionChecklist((prev) => (
            prev.includes(itemId)
                ? prev.filter((item) => item !== itemId)
                : [...prev, itemId]
        ));
    };

    const handleCopy = async (label, text) => {
        const ok = await copyText(text);
        if (ok) {
            setCopied(label);
            window.setTimeout(() => setCopied(""), 2000);
        }
    };

    const requestAction = (actionKey, status) => {
        const hasRevisionFeedback = String(revisionNotes || "").trim() || revisionChecklist.length > 0;

        if (actionKey === "revision" && !hasRevisionFeedback) {
            setMessage("Escribe observaciones o marca al menos un punto del checklist.");
            return;
        }

        if (actionKey === "publish" && listing.status !== SELL_LISTING_STATUSES.approved) {
            setMessage("Primero debes aprobar la solicitud.");
            return;
        }

        if (actionKey === "withdraw" && listing.status !== SELL_LISTING_STATUSES.published) {
            setMessage("Solo puedes retirar inmuebles que estén publicados.");
            return;
        }

        if (actionKey === "unapprove" && listing.status !== SELL_LISTING_STATUSES.approved) {
            setMessage("Solo puedes cancelar solicitudes aprobadas que aún no se han publicado.");
            return;
        }

        if (actionKey === "reapprove" && listing.status !== SELL_LISTING_STATUSES.withdrawn) {
            setMessage("Esta acción solo aplica a inmuebles retirados del inventario.");
            return;
        }

        setMessage("");
        setPendingConfirm({ actionKey, status });
    };

    const runConfirmedAction = async () => {
        if (!pendingConfirm) return;

        const { status, actionKey } = pendingConfirm;
        setSaving(true);
        setMessage("");

        try {
            await updateSellListingReview(
                listing.id,
                {
                    status,
                    revisionNotes: status === SELL_LISTING_STATUSES.needs_revision ? revisionNotes : listing.revisionNotes || "",
                    revisionChecklist: status === SELL_LISTING_STATUSES.needs_revision
                        ? revisionChecklist
                        : (listing.revisionChecklist || []),
                    adminNotes,
                },
                adminUser?.usuario || ""
            );

            if (status === SELL_LISTING_STATUSES.needs_revision) {
                setMessage("Correcciones registradas. Sigue la secuencia abajo para notificar al propietario.");
            } else if (status === SELL_LISTING_STATUSES.approved) {
                setMessage("Solicitud aprobada. Confirma y publica para que aparezca en la búsqueda.");
            } else if (status === SELL_LISTING_STATUSES.published) {
                setMessage("Inmueble publicado. Ya está visible en la búsqueda del sitio.");
            } else if (status === SELL_LISTING_STATUSES.withdrawn) {
                setMessage("Inmueble retirado. Ya no aparece en la búsqueda del sitio.");
            } else if (status === SELL_LISTING_STATUSES.pending && actionKey === "unapprove") {
                setMessage("Aprobación cancelada. La solicitud volvió a pendiente de revisión.");
            } else if (status === SELL_LISTING_STATUSES.approved && actionKey === "reapprove") {
                setMessage("Solicitud aprobada de nuevo. Puedes publicarla cuando quieras.");
            } else if (status === SELL_LISTING_STATUSES.rejected) {
                setMessage("Solicitud rechazada. Envía el enlace de seguimiento al propietario.");
            } else {
                setMessage(`Estado actualizado a ${SELL_STATUS_LABELS[status]}.`);
            }

            setPendingConfirm(null);
            await onRefresh();
        } catch (err) {
            setMessage(err?.message || "No se pudo actualizar la solicitud.");
        } finally {
            setSaving(false);
        }
    };

    const shareListing = {
        ...listing,
        revisionNotes: isNeedsRevision ? listing.revisionNotes : revisionNotes,
        revisionChecklist: isNeedsRevision ? listing.revisionChecklist : revisionChecklist,
    };

    const ownerRevisionMessage = isNeedsRevision
        ? buildOwnerStatusMessage(listing)
        : buildOwnerRevisionDraftMessage(listing, revisionNotes, revisionChecklist);

    const ownerRejectedMessage = buildOwnerStatusMessage({ ...listing, status: SELL_LISTING_STATUSES.rejected });
    const shareMessage = isRejected ? ownerRejectedMessage : ownerRevisionMessage;
    const mailSubject = isRejected ? "Estado de tu solicitud de venta" : "Correcciones en tu solicitud de venta";

    return (
        <div className={styles.sessionDetailCard}>
            <div className={reviewStyles.reviewHeader}>
                <div>
                    <h2 className={reviewStyles.reviewTitle}>Revisar solicitud</h2>
                    <p className={reviewStyles.reviewMeta}>
                        <span className={styles.reviewStatusBadge}>
                            {SELL_STATUS_LABELS[status] || status}
                        </span>
                        {" · "}
                        Ref. {listing.id}
                        {" · "}
                        {formatListingDate(listing.createdAt)}
                    </p>
                </div>
            </div>

            <ol className={styles.reviewWorkflow}>
                <li className={styles.reviewWorkflowStep}>
                    <span className={`${styles.reviewWorkflowDot} ${!isRejected ? styles.reviewWorkflowDotDone : ""}`} />
                    <span><strong>1. Revisar solicitud</strong> — mismo formato que envió el cliente</span>
                </li>
                <li className={styles.reviewWorkflowStep}>
                    <span className={`${styles.reviewWorkflowDot} ${isApproved || isPublished ? styles.reviewWorkflowDotDone : isPending ? styles.reviewWorkflowDotCurrent : ""}`} />
                    <span><strong>2. Decidir</strong> — rechazar, correcciones o aprobar</span>
                </li>
                <li className={styles.reviewWorkflowStep}>
                    <span className={`${styles.reviewWorkflowDot} ${isPublished ? styles.reviewWorkflowDotDone : isApproved ? styles.reviewWorkflowDotCurrent : ""}`} />
                    <span><strong>3. Publicar</strong> — tarjeta en la búsqueda del sitio</span>
                </li>
            </ol>

            <SellListingSubmissionReview listing={listing} />

            {isPublished && (
                <p className={styles.reviewPublishedNote}>
                    Publicado en búsqueda
                    {searchGroups.length > 0 ? ` (${searchGroups.join(", ")})` : ""}.
                </p>
            )}

            {isWithdrawn && (
                <p className={styles.reviewPublishedNote} style={{ background: "#f5f5f5", borderColor: "#ddd", color: "#6e6259" }}>
                    Retirado del inventario. No aparece en la búsqueda del sitio.
                </p>
            )}

            <div className={reviewStyles.actionFooter}>
                {showReviewTools && (
                    <div className={reviewStyles.adminOnlyBlock} style={{ marginBottom: 16 }}>
                        <p className={reviewStyles.adminOnlyTitle}>Herramientas de revisión (solo admin)</p>

                        <label className={styles.detailItem} style={{ display: "block", marginBottom: 12 }}>
                            <span className={styles.detailLabel}>Notas internas</span>
                            <textarea
                                rows={2}
                                className={reviewStyles.adminTextarea}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                            />
                        </label>

                        <label className={styles.detailItem} style={{ display: "block", marginBottom: 12 }}>
                            <span className={styles.detailLabel}>Observaciones para el propietario</span>
                            <textarea
                                rows={4}
                                className={reviewStyles.adminTextarea}
                                value={revisionNotes}
                                onChange={(e) => setRevisionNotes(e.target.value)}
                                placeholder="Indica qué debe corregir el propietario."
                            />
                        </label>

                        <div className={styles.metadataTitle}>Checklist de correcciones</div>
                        <ul className={uxStyles.checklist}>
                            {REVISION_CHECKLIST_ITEMS.map((item) => (
                                <li key={item.id} className={uxStyles.checklistItem}>
                                    <input
                                        type="checkbox"
                                        checked={revisionChecklist.includes(item.id)}
                                        onChange={() => toggleChecklistItem(item.id)}
                                    />
                                    <span>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {pendingConfirm && (
                    <div className={reviewStyles.confirmBox}>
                        <p>
                            <strong>{CONFIRM_COPY[pendingConfirm.actionKey].title}</strong>
                            <br />
                            {CONFIRM_COPY[pendingConfirm.actionKey].detail}
                        </p>
                        <div className={reviewStyles.confirmActions}>
                            <button
                                type="button"
                                className={styles.btnOnLight}
                                disabled={saving}
                                onClick={() => setPendingConfirm(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={
                                    pendingConfirm.actionKey === "reject"
                                        ? styles.btnReject
                                        : pendingConfirm.actionKey === "revision"
                                            ? styles.btnRevision
                                            : pendingConfirm.actionKey === "publish"
                                                ? styles.btnPublish
                                                : pendingConfirm.actionKey === "withdraw"
                                                    ? styles.btnReject
                                                    : styles.btnApprove
                                }
                                disabled={saving}
                                onClick={runConfirmedAction}
                            >
                                {saving ? "Guardando…" : CONFIRM_COPY[pendingConfirm.actionKey].confirm}
                            </button>
                        </div>
                    </div>
                )}

                {isPending && !pendingConfirm && (
                    <div className={styles.reviewActionBar}>
                        <button
                            type="button"
                            className={styles.btnReject}
                            disabled={saving}
                            onClick={() => requestAction("reject", SELL_LISTING_STATUSES.rejected)}
                        >
                            Rechazar
                        </button>
                        <button
                            type="button"
                            className={styles.btnRevision}
                            disabled={saving}
                            onClick={() => requestAction("revision", SELL_LISTING_STATUSES.needs_revision)}
                        >
                            Enviar correcciones
                        </button>
                        <button
                            type="button"
                            className={styles.btnApprove}
                            disabled={saving}
                            onClick={() => requestAction("approve", SELL_LISTING_STATUSES.approved)}
                        >
                            Aprobar
                        </button>
                    </div>
                )}

                {isApproved && !pendingConfirm && (
                    <div className={styles.reviewActionBar}>
                        <button
                            type="button"
                            className={styles.btnPublish}
                            disabled={saving}
                            onClick={() => requestAction("publish", SELL_LISTING_STATUSES.published)}
                        >
                            Publicar en búsqueda
                        </button>
                        <button
                            type="button"
                            className={styles.btnOnLight}
                            disabled={saving}
                            onClick={() => requestAction("unapprove", SELL_LISTING_STATUSES.pending)}
                        >
                            Cancelar aprobación
                        </button>
                    </div>
                )}

                {isPublished && !pendingConfirm && (
                    <div className={styles.reviewActionBar}>
                        <button
                            type="button"
                            className={styles.btnReject}
                            disabled={saving}
                            onClick={() => requestAction("withdraw", SELL_LISTING_STATUSES.withdrawn)}
                        >
                            Retirar de búsqueda
                        </button>
                    </div>
                )}

                {isWithdrawn && !pendingConfirm && (
                    <div className={styles.reviewActionBar}>
                        <button
                            type="button"
                            className={styles.btnApprove}
                            disabled={saving}
                            onClick={() => requestAction("reapprove", SELL_LISTING_STATUSES.approved)}
                        >
                            Volver a aprobar
                        </button>
                    </div>
                )}

                {showShareSequence && (
                    <>
                        {isNeedsRevision && (listing.revisionNotes || listing.revisionChecklist?.length > 0) && (
                            <div className={styles.reviewFeedbackBox} style={{ marginBottom: 14 }}>
                                <strong>Correcciones enviadas al propietario:</strong>
                                {getRevisionLabels(listing.revisionChecklist || []).length > 0 && (
                                    <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
                                        {getRevisionLabels(listing.revisionChecklist || []).map((label) => (
                                            <li key={label}>{label}</li>
                                        ))}
                                    </ul>
                                )}
                                {listing.revisionNotes && (
                                    <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{listing.revisionNotes}</p>
                                )}
                            </div>
                        )}
                        <OwnerShareSequence
                        ownerLink={ownerLink}
                        ownerPhone={ownerPhone}
                        ownerEmail={listing.ownerEmail}
                        message={shareMessage}
                        mailListing={{
                            ...shareListing,
                            status: isRejected
                                ? SELL_LISTING_STATUSES.rejected
                                : SELL_LISTING_STATUSES.needs_revision,
                        }}
                        mailSubject={mailSubject}
                        copied={copied}
                        onCopy={handleCopy}
                    />
                    </>
                )}

                {message && <p className={styles.panelSubtitle} style={{ marginTop: 12 }}>{message}</p>}
            </div>
        </div>
    );
}

export default function AdminSellListings() {
    const adminUser = getAdminUser();
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadListings = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await fetchSellListings();
            setListings(data);
            setSelectedId((prev) => prev || data[0]?.id || null);
        } catch (err) {
            setError(err?.message || "No se pudieron cargar las solicitudes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const selectedListing = listings.find((item) => item.id === selectedId) || null;
    const pendingCount = listings.filter((item) => item.status === SELL_LISTING_STATUSES.pending).length;

    return (
        <AdminShell
            title="Revisión de inmuebles · Vender"
            onRefresh={loadListings}
            error={error}
        >
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Solicitudes</span>
                    <span className={styles.statValue}>{listings.length}</span>
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
                        <p className={styles.panelSubtitle}>{listings.length} registradas</p>
                    </div>
                    <div className={styles.sessionsScroll}>
                        {loading ? (
                            <AdminLoadingState label="Cargando solicitudes de venta…" />
                        ) : listings.length === 0 ? (
                            <p className={styles.emptyState}>Aún no hay inmuebles enviados.</p>
                        ) : (
                            <ul className={styles.sessionList}>
                                {listings.map((listing) => {
                                    const isActive = listing.id === selectedId;
                                    return (
                                        <li key={listing.id}>
                                            <button
                                                type="button"
                                                className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ""}`}
                                                onClick={() => setSelectedId(listing.id)}
                                            >
                                                <div className={styles.sessionTop}>
                                                    <span className={styles.sessionId}>{listing.title}</span>
                                                    <span className={styles.sessionDate}>
                                                        {formatListingDate(listing.createdAt)}
                                                    </span>
                                                </div>
                                                <div className={styles.sessionSummary}>
                                                    {listing.city} · {formatPrice(listing.price, listing.priceCurrency)}
                                                </div>
                                                <div className={styles.sessionTags}>
                                                    <span className={`${styles.tag} ${styles.tagAccent}`}>
                                                        {SELL_STATUS_LABELS[listing.status] || listing.status}
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
                        {!selectedListing ? (
                            <p className={styles.emptyState}>Selecciona una solicitud para revisarla.</p>
                        ) : (
                            <SellListingDetail
                                listing={selectedListing}
                                onRefresh={loadListings}
                                adminUser={adminUser}
                            />
                        )}
                    </div>
                </main>
            </div>
        </AdminShell>
    );
}
