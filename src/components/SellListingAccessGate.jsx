import { useState } from "react";
import { lookupSellListing } from "../services/sellListingService";
import { markListingVerified } from "../utils/sellListingTracking";
import styles from "./SellListingUx.module.css";

export default function SellListingAccessGate({
    listingId,
    onVerified,
    initialEmail = "",
    initialPhone = "",
    initialAccessCode = "",
}) {
    const [email, setEmail] = useState(initialEmail);
    const [phone, setPhone] = useState(initialPhone);
    const [accessCode, setAccessCode] = useState(initialAccessCode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const listing = await lookupSellListing(listingId, { email, phone, accessCode });
            markListingVerified(listingId);
            onVerified(listing);
        } catch (err) {
            setError(err?.message || "No pudimos verificar tu acceso.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Verifica tu acceso</h2>
            <p className={styles.panelLead}>
                Para proteger tu solicitud, confirma tu identidad con el correo y teléfono registrados
                o con el código de acceso que recibiste al enviar.
            </p>
            <form className={styles.formStack} onSubmit={handleSubmit}>
                <label className={styles.field}>
                    <span>Referencia</span>
                    <input value={listingId} readOnly />
                </label>
                <label className={styles.field}>
                    <span>Correo electrónico</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="El mismo del formulario"
                    />
                </label>
                <label className={styles.field}>
                    <span>Teléfono / WhatsApp</span>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="El mismo del formulario"
                    />
                </label>
                <div className={styles.dividerText}>o usa tu código de acceso</div>
                <label className={styles.field}>
                    <span>Código de acceso (6 dígitos)</span>
                    <input
                        inputMode="numeric"
                        maxLength={6}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Ej. 482913"
                    />
                </label>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                    {loading ? "Verificando…" : "Continuar"}
                </button>
            </form>
        </div>
    );
}
