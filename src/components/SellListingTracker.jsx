import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lookupSellListing, SELL_STATUS_LABELS } from "../services/sellListingService";
import { markListingVerified, saveSellListingTracking } from "../utils/sellListingTracking";
import styles from "./SellListingUx.module.css";

export default function SellListingTracker({ onStartNew }) {
    const navigate = useNavigate();
    const [listingId, setListingId] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);

    const handleLookup = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setPreview(null);

        try {
            const listing = await lookupSellListing(listingId.trim(), { email, phone, accessCode });
            markListingVerified(listing.id);
            saveSellListingTracking({
                id: listing.id,
                accessCode: listing.accessCode || accessCode,
                email: listing.ownerEmail,
                phone: listing.ownerPhone,
                status: listing.status,
                title: listing.title,
            });
            setPreview(listing);
        } catch (err) {
            setError(err?.message || "No pudimos consultar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    const openListing = () => {
        if (!preview?.id) return;
        navigate(`/vender?id=${preview.id}`);
    };

    return (
        <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Consultar mi solicitud</h2>
            <p className={styles.panelLead}>
                Ingresa la referencia que recibiste al enviar tu inmueble, junto con tu correo y teléfono
                o tu código de acceso de 6 dígitos.
            </p>

            <form className={styles.formStack} onSubmit={handleLookup}>
                <label className={styles.field}>
                    <span>Referencia *</span>
                    <input
                        required
                        value={listingId}
                        onChange={(e) => setListingId(e.target.value.trim())}
                        placeholder="Ej. a1B2c3D4e5"
                    />
                </label>
                <label className={styles.field}>
                    <span>Correo electrónico</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>
                <label className={styles.field}>
                    <span>Teléfono / WhatsApp</span>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </label>
                <div className={styles.dividerText}>o usa tu código de acceso</div>
                <label className={styles.field}>
                    <span>Código de acceso</span>
                    <input
                        inputMode="numeric"
                        maxLength={6}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                </label>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                    {loading ? "Consultando…" : "Ver estado"}
                </button>
            </form>

            {preview && (
                <div className={styles.statusCard}>
                    <strong>{preview.title || "Tu solicitud"}</strong>
                    <p>
                        Estado: <span>{SELL_STATUS_LABELS[preview.status] || preview.status}</span>
                    </p>
                    <p className={styles.muted}>Referencia: {preview.id}</p>
                    {preview.revisionNotes && preview.status === "needs_revision" && (
                        <div className={styles.revisionPreview}>
                            <span>Observaciones de Mónica</span>
                            <p>{preview.revisionNotes}</p>
                        </div>
                    )}
                    <div className={styles.actionRow}>
                        <button type="button" className={styles.primaryBtn} onClick={openListing}>
                            {preview.status === "needs_revision" ? "Corregir y reenviar" : "Abrir solicitud"}
                        </button>
                        {onStartNew && (
                            <button type="button" className={styles.secondaryBtn} onClick={onStartNew}>
                                Enviar otro inmueble
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
