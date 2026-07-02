import {
    buildWhatsAppCreditMessage,
    formatCreditFilterMessage,
    loadCreditSession,
} from "../utils/creditSimulatorDeepLink";
import styles from "./CreditFilterBanner.module.css";

const WHATSAPP_PHONE = "573212080985";

export default function CreditFilterBanner({
    filter,
    zoneLabels = [],
    resultCount = null,
    onClear,
    onExpand,
}) {
    if (!filter?.maxPropertyPrice) return null;

    const zonesText = zoneLabels.length > 0
        ? zoneLabels.join(", ")
        : null;

    const handleWhatsApp = () => {
        const session = loadCreditSession();
        const text = buildWhatsAppCreditMessage(filter, session);
        window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    };

    return (
        <div className={styles.banner}>
            <div className={styles.main}>
                <p className={styles.message}>{formatCreditFilterMessage(filter)}</p>
                {zonesText && (
                    <p className={styles.zones}>Zonas: {zonesText}</p>
                )}
                {resultCount != null && (
                    <p className={styles.count}>{resultCount} propiedad{resultCount !== 1 ? "es" : ""} encontrada{resultCount !== 1 ? "s" : ""}</p>
                )}
            </div>
            <div className={styles.actions}>
                <button type="button" className={styles.btnWhatsApp} onClick={handleWhatsApp}>
                    Asesoría WhatsApp
                </button>
                {onExpand && (
                    <button type="button" className={styles.btnExpand} onClick={onExpand}>
                        Ampliar zonas
                    </button>
                )}
                {onClear && (
                    <button type="button" className={styles.btnClear} onClick={onClear}>
                        Quitar filtro
                    </button>
                )}
            </div>
        </div>
    );
}
