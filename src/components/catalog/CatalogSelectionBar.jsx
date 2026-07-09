import { useState } from "react";
import {
    buildCatalogShareMessage,
    MAX_CATALOG_PROPERTIES,
} from "../../utils/propertyCatalog";
import { copyToClipboard } from "../../utils/clipboard";
import { buildWhatsAppUrl } from "../../utils/sellListingLinks";
import styles from "./CatalogSelectionBar.module.css";

export default function CatalogSelectionBar({
    selectedCount,
    clientName,
    onClientNameChange,
    onGenerate,
    generating = false,
    generatedUrl = "",
    shareMessage = "",
    onClearSelection,
}) {
    const [copyFeedback, setCopyFeedback] = useState("");
    const canGenerate = selectedCount > 0 && selectedCount <= MAX_CATALOG_PROPERTIES;

    const showCopyFeedback = (message) => {
        setCopyFeedback(message);
        window.setTimeout(() => setCopyFeedback(""), 3200);
    };

    const handleCopyLink = async () => {
        if (!generatedUrl) return;
        const copied = await copyToClipboard(generatedUrl);
        showCopyFeedback(
            copied
                ? "Enlace copiado al portapapeles."
                : "No se pudo copiar automáticamente. Selecciona el enlace de abajo y cópialo manualmente."
        );
    };

    const handleCopyMessage = async () => {
        const message = shareMessage || buildCatalogShareMessage({
            clientName,
            catalogUrl: generatedUrl,
        });
        if (!message) return;
        const copied = await copyToClipboard(message);
        showCopyFeedback(
            copied
                ? "Mensaje copiado al portapapeles."
                : "No se pudo copiar el mensaje. Intenta desde «Enviar WhatsApp»."
        );
    };

    const handleSelectUrl = (event) => {
        event.currentTarget.select();
    };

    return (
        <div className={styles.bar}>
            <div className={styles.inner}>
                <div className={styles.summary}>
                    <strong>{selectedCount}</strong>
                    <span>
                        {selectedCount === 1 ? "inmueble seleccionado" : "inmuebles seleccionados"}
                        {selectedCount > MAX_CATALOG_PROPERTIES ? ` · máximo ${MAX_CATALOG_PROPERTIES}` : ""}
                    </span>
                </div>

                <label className={styles.field}>
                    <span>Nombre del cliente (opcional)</span>
                    <input
                        type="text"
                        value={clientName}
                        onChange={(event) => onClientNameChange(event.target.value)}
                        placeholder="Ej. Laura"
                    />
                </label>

                <div className={styles.actions}>
                    {!generatedUrl ? (
                        <>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                disabled={!canGenerate || generating}
                                onClick={onGenerate}
                            >
                                {generating ? "Generando enlace…" : "Generar catálogo"}
                            </button>
                            {selectedCount > 0 && (
                                <button type="button" className={styles.secondaryBtn} onClick={onClearSelection}>
                                    Limpiar selección
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button type="button" className={styles.primaryBtn} onClick={handleCopyLink}>
                                {copyFeedback.includes("Enlace") ? "Enlace copiado" : "Copiar enlace"}
                            </button>
                            <button type="button" className={styles.secondaryBtn} onClick={handleCopyMessage}>
                                {copyFeedback.includes("Mensaje") ? "Mensaje copiado" : "Copiar mensaje"}
                            </button>
                            <a
                                href={buildWhatsAppUrl(shareMessage || buildCatalogShareMessage({
                                    clientName,
                                    catalogUrl: generatedUrl,
                                }))}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.whatsappBtn}
                            >
                                Enviar WhatsApp
                            </a>
                            <a
                                href={generatedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.secondaryBtn}
                            >
                                Ver catálogo
                            </a>
                        </>
                    )}
                </div>

                {copyFeedback && (
                    <p className={styles.copyFeedback} role="status">{copyFeedback}</p>
                )}

                {generatedUrl && (
                    <input
                        type="text"
                        readOnly
                        className={styles.generatedUrlInput}
                        value={generatedUrl}
                        onFocus={handleSelectUrl}
                        onClick={handleSelectUrl}
                        aria-label="Enlace del catálogo generado"
                    />
                )}
            </div>
        </div>
    );
}
