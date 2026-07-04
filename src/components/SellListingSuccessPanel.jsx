import { useState } from "react";
import { Link } from "react-router-dom";
import {
    buildOwnerMailto,
    buildOwnerSubmissionMessage,
    buildSellListingUrl,
    buildWhatsAppUrl,
    copyText,
} from "../utils/sellListingLinks";
import styles from "./SellListingUx.module.css";

export default function SellListingSuccessPanel({
    title,
    message,
    listing,
    onSendAnother,
    showSendAnother = true,
}) {
    const [copied, setCopied] = useState("");
    const trackingUrl = buildSellListingUrl(listing.id);
    const whatsappMessage = buildOwnerSubmissionMessage({
        ...listing,
        accessCode: listing.accessCode,
    });

    const handleCopy = async (label, text) => {
        const ok = await copyText(text);
        if (ok) {
            setCopied(label);
            window.setTimeout(() => setCopied(""), 2000);
        }
    };

    return (
        <div className={styles.successPanel}>
            <h2>{title}</h2>
            <p>{message}</p>

            <div className={styles.trackingCard}>
                <div className={styles.trackingRow}>
                    <span>Referencia</span>
                    <strong>{listing.id}</strong>
                </div>
                {listing.accessCode && (
                    <div className={styles.trackingRow}>
                        <span>Código de acceso</span>
                        <strong>{listing.accessCode}</strong>
                    </div>
                )}
                <p className={styles.muted}>
                    Guarda la referencia y el código. Los necesitarás para consultar o corregir tu solicitud.
                </p>
            </div>

            <div className={styles.actionRow}>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => handleCopy("link", trackingUrl)}
                >
                    {copied === "link" ? "Enlace copiado" : "Copiar enlace de seguimiento"}
                </button>
                {listing.accessCode && (
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => handleCopy("code", listing.accessCode)}
                    >
                        {copied === "code" ? "Código copiado" : "Copiar código"}
                    </button>
                )}
                <a
                    href={buildWhatsAppUrl(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.secondaryBtn}
                >
                    Enviar enlace a WhatsApp
                </a>
                {listing.ownerEmail && (
                    <a href={buildOwnerMailto(listing)} className={styles.secondaryBtn}>
                        Enviar enlace a mi correo
                    </a>
                )}
            </div>

            <div className={styles.actionRow}>
                <Link to={`/vender?id=${listing.id}`} className={styles.primaryBtn}>
                    Ver mi solicitud
                </Link>
                {showSendAnother && onSendAnother && (
                    <button type="button" className={styles.secondaryBtn} onClick={onSendAnother}>
                        Enviar otro inmueble
                    </button>
                )}
                <Link to="/" className={styles.secondaryBtn}>Volver a buscar</Link>
            </div>
        </div>
    );
}
