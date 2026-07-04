import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    fetchSellListings,
    SELL_LISTING_STATUSES,
    SELL_STATUS_LABELS,
    updateSellListingReview,
} from "../services/sellListingService";
import { REVISION_CHECKLIST_ITEMS } from "../constants/sellListingRevision";
import {
    buildOwnerMailto,
    buildOwnerStatusMessage,
    buildSellListingUrl,
    buildWhatsAppUrl,
    copyText,
} from "../utils/sellListingLinks";
import { getAdminUser, logoutAdmin } from "../services/adminAuth";
import uxStyles from "../components/SellListingUx.module.css";
import styles from "./Admin.module.css";

function formatListingDate(value) {
    if (!value) return "—";
    if (typeof value?.toDate === "function") {
        return value.toDate().toLocaleString("es-CO");
    }
    return String(value);
}

function formatPrice(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function SellListingDetail({ listing, onRefresh, adminUser }) {
    const [revisionNotes, setRevisionNotes] = useState(listing.revisionNotes || "");
    const [revisionChecklist, setRevisionChecklist] = useState(listing.revisionChecklist || []);
    const [adminNotes, setAdminNotes] = useState(listing.adminNotes || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState("");

    useEffect(() => {
        setRevisionNotes(listing.revisionNotes || "");
        setRevisionChecklist(listing.revisionChecklist || []);
        setAdminNotes(listing.adminNotes || "");
    }, [listing]);

    const ownerLink = buildSellListingUrl(listing.id);

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

    const runAction = async (status) => {
        if (status === SELL_LISTING_STATUSES.needs_revision && !String(revisionNotes || "").trim()) {
            setMessage("Escribe las observaciones que debe corregir el propietario.");
            return;
        }

        setSaving(true);
        setMessage("");
        try {
            await updateSellListingReview(
                listing.id,
                {
                    status,
                    revisionNotes: status === SELL_LISTING_STATUSES.needs_revision ? revisionNotes : "",
                    revisionChecklist: status === SELL_LISTING_STATUSES.needs_revision ? revisionChecklist : (listing.revisionChecklist || []),
                    adminNotes,
                },
                adminUser?.usuario || ""
            );
            setMessage(`Estado actualizado a ${SELL_STATUS_LABELS[status]}.`);
            if (status === SELL_LISTING_STATUSES.needs_revision) {
                setMessage(`Estado actualizado. Comparte el enlace con ${listing.ownerName || "el propietario"} para que corrija su solicitud.`);
            }
            await onRefresh();
        } catch (err) {
            setMessage(err?.message || "No se pudo actualizar la solicitud.");
        } finally {
            setSaving(false);
        }
    };

    const ownerWhatsAppMessage = buildOwnerStatusMessage({
        ...listing,
        status: SELL_LISTING_STATUSES.needs_revision,
        revisionNotes,
    });

    return (
        <div className={styles.sessionDetailCard}>
            <h2 className={styles.panelTitle} style={{ padding: 0, marginBottom: 8 }}>
                {listing.title}
            </h2>
            <p className={styles.panelSubtitle} style={{ marginBottom: 16 }}>
                {SELL_STATUS_LABELS[listing.status] || listing.status}
            </p>

            <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Propietario</span>
                    <span className={styles.detailValue}>{listing.ownerName}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Correo</span>
                    <span className={styles.detailValue}>{listing.ownerEmail}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Teléfono</span>
                    <span className={styles.detailValue}>{listing.ownerPhone}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Precio</span>
                    <span className={styles.detailValue}>{formatPrice(listing.price)}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ciudad</span>
                    <span className={styles.detailValue}>{listing.city}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Dirección</span>
                    <span className={styles.detailValue}>{listing.address}</span>
                </div>
            </div>

            <div className={styles.metadataBlock}>
                <div className={styles.metadataTitle}>Descripción</div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{listing.description}</p>
            </div>

            {listing.amenities?.length > 0 && (
                <div className={styles.metadataBlock}>
                    <div className={styles.metadataTitle}>Amenidades</div>
                    <p style={{ margin: 0 }}>{listing.amenities.join(" · ")}</p>
                </div>
            )}

            {listing.photos?.length > 0 && (
                <div className={styles.metadataBlock}>
                    <div className={styles.metadataTitle}>Fotos ({listing.photos.length})</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                        {listing.photos.map((photo) => (
                            <a key={photo.storagePath || photo.url} href={photo.url} target="_blank" rel="noreferrer">
                                <img
                                    src={photo.url}
                                    alt={photo.name || "Foto"}
                                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8 }}
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <label className={styles.detailItem} style={{ display: "block", marginTop: 16 }}>
                <span className={styles.detailLabel}>Notas internas</span>
                <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                />
            </label>

            <label className={styles.detailItem} style={{ display: "block", marginTop: 12 }}>
                <span className={styles.detailLabel}>Observaciones para devolver al propietario</span>
                <textarea
                    rows={4}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Indica qué debe corregir el propietario."
                    style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                />
            </label>

            <div className={styles.metadataBlock}>
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

            <div className={styles.metadataBlock}>
                <div className={styles.metadataTitle}>Enlace para el propietario</div>
                <p style={{ margin: "0 0 8px", wordBreak: "break-all" }}>{ownerLink}</p>
                <div className={uxStyles.adminShareRow}>
                    <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => handleCopy("link", ownerLink)}
                    >
                        {copied === "link" ? "Enlace copiado" : "Copiar enlace"}
                    </button>
                    <a
                        href={buildWhatsAppUrl(ownerWhatsAppMessage, listing.ownerPhone?.replace(/\D/g, "") || undefined)}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.btnGhost}
                        style={{ textDecoration: "none" }}
                    >
                        WhatsApp propietario
                    </a>
                    {listing.ownerEmail && (
                        <a
                            href={buildOwnerMailto({
                                ...listing,
                                status: SELL_LISTING_STATUSES.needs_revision,
                                revisionNotes,
                            }, "Correcciones en tu solicitud de venta")}
                            className={styles.btnGhost}
                            style={{ textDecoration: "none" }}
                        >
                            Email propietario
                        </a>
                    )}
                </div>
            </div>

            <div className={styles.headerActions} style={{ marginTop: 18, flexWrap: "wrap" }}>
                <button
                    type="button"
                    className={styles.btnGhost}
                    disabled={saving}
                    onClick={() => runAction(SELL_LISTING_STATUSES.needs_revision)}
                >
                    Devolver correcciones
                </button>
                <button
                    type="button"
                    className={styles.btnGhost}
                    disabled={saving}
                    onClick={() => runAction(SELL_LISTING_STATUSES.approved)}
                >
                    Aprobar
                </button>
                <button
                    type="button"
                    className={styles.btnGhost}
                    disabled={saving}
                    onClick={() => runAction(SELL_LISTING_STATUSES.published)}
                >
                    Publicar
                </button>
                <button
                    type="button"
                    className={styles.btnGhost}
                    disabled={saving}
                    onClick={() => runAction(SELL_LISTING_STATUSES.rejected)}
                >
                    Rechazar
                </button>
                <Link
                    to={`/vender?id=${listing.id}`}
                    className={styles.btnGhost}
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                    Ver formulario
                </Link>
            </div>

            {message && <p className={styles.panelSubtitle} style={{ marginTop: 12 }}>{message}</p>}
        </div>
    );
}

export default function AdminSellListings() {
    const navigate = useNavigate();
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

    const handleLogout = () => {
        logoutAdmin();
        navigate("/admin", { replace: true });
    };

    return (
        <div className={styles.adminPage}>
            <header className={styles.header}>
                <div className={styles.headerBrand}>
                    <div className={styles.headerLogo}>MF</div>
                    <div>
                        <h1 className={styles.headerTitle}>Revisión de inmuebles · Vender</h1>
                        <p className={styles.headerMeta}>
                            Conectado como <strong>{adminUser?.usuario || "admin"}</strong>
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/admin/dashboard" className={styles.btnGhost}>Analítica</Link>
                    <button type="button" className={styles.btnGhost} onClick={loadListings}>
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
                            <p className={styles.emptyState}>Cargando solicitudes…</p>
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
                                                    {listing.city} · {formatPrice(listing.price)}
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
        </div>
    );
}
