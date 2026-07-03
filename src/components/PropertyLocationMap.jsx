import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    buildGoogleMapsDirectionsUrl,
    buildGoogleMapsEmbedUrl,
    buildGoogleMapsSearchUrl,
    buildPropertyMapQuery,
} from "../utils/propertyMapQuery";
import styles from "./PropertyLocationMap.module.css";

function MapPinIcon() {
    return (
        <svg
            className={styles.mapIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M12 21s6-5.2 6-10.2a6 6 0 10-12 0C6 15.8 12 21 12 21z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="10.8" r="2.1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}

export default function PropertyLocationMap({ address, zone, city }) {
    const query = useMemo(
        () => buildPropertyMapQuery({ address, zone, city }),
        [address, zone, city]
    );
    const [expanded, setExpanded] = useState(false);

    const embedUrl = useMemo(() => buildGoogleMapsEmbedUrl(query), [query]);
    const searchUrl = useMemo(() => buildGoogleMapsSearchUrl(query), [query]);
    const directionsUrl = useMemo(() => buildGoogleMapsDirectionsUrl(query), [query]);

    useEffect(() => {
        if (!expanded) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event) => {
            if (event.key === "Escape") setExpanded(false);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev || "";
            window.removeEventListener("keydown", onKey);
        };
    }, [expanded]);

    if (!query) return null;

    return (
        <>
            <button
                type="button"
                className={styles.mapTrigger}
                onClick={() => setExpanded(true)}
                aria-label={`Ver mapa de ${query}`}
            >
                <MapPinIcon />
                <span>Ver mapa</span>
            </button>

            {expanded && createPortal(
                <div
                    className={styles.modalBackdrop}
                    role="presentation"
                    onClick={() => setExpanded(false)}
                >
                    <div
                        className={styles.modalPanel}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mapa de ubicación"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className={styles.modalHeader}>
                            <div>
                                <p className={styles.modalEyebrow}>Ubicación</p>
                                <p className={styles.modalQuery}>{query}</p>
                            </div>
                            <button
                                type="button"
                                className={styles.closeBtn}
                                onClick={() => setExpanded(false)}
                                aria-label="Cerrar mapa"
                            >
                                ×
                            </button>
                        </header>

                        <div className={styles.modalMapFrame}>
                            <iframe
                                title={`Mapa ${query}`}
                                src={embedUrl}
                                className={styles.modalIframe}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <a
                                href={searchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.actionPrimary}
                            >
                                Abrir en Google Maps
                            </a>
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.actionGhost}
                            >
                                Cómo llegar
                            </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
