import { useEffect, useState } from "react";
import { CREDIT_SEARCH_ZONES } from "../constants/searchZones";
import { formatCOP, formatPercent } from "../utils/housingCreditCalculator";
import styles from "./HousingCreditSimulator.module.css";

export default function CreditZonePicker({
    results,
    filter,
    initialAllZones = false,
    initialSelectedKeys = [],
    error = "",
    onBack,
    onClose,
    onConfirm,
    showSummary = true,
}) {
    const [allZones, setAllZones] = useState(initialAllZones);
    const [selectedKeys, setSelectedKeys] = useState(initialSelectedKeys);

    useEffect(() => {
        setAllZones(initialAllZones);
        setSelectedKeys(initialSelectedKeys);
    }, [initialAllZones, initialSelectedKeys]);

    const toggleZone = (key) => {
        setAllZones(false);
        setSelectedKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const canSearch = allZones || selectedKeys.length > 0;

    return (
        <>
            {showSummary && results && filter && (
                <div className={styles.searchPickHero}>
                    <p className={styles.resultsLabel}>¿Dónde deseas buscar?</p>
                    <p className={styles.searchPickAmount}>
                        {formatCOP(filter.minPropertyPrice)} – {formatCOP(filter.maxPropertyPrice)}
                    </p>
                    <p className={styles.resultsSub}>
                        Tasa {formatPercent(results.annualRateEa * 100)} EA · Plazo {results.termYears} años
                    </p>
                </div>
            )}

            {!showSummary && (
                <div className={styles.searchPickHero}>
                    <p className={styles.resultsLabel}>Ampliar búsqueda</p>
                    <p className={styles.resultsSub}>
                        Selecciona una o más zonas. Puedes combinar libremente.
                    </p>
                </div>
            )}

            <div className={styles.budgetBanner}>
                Elige las zonas donde quieres ver propiedades en tu rango de precio.
            </div>

            <button
                type="button"
                className={`${styles.zoneChip} ${allZones ? styles.zoneChipActive : ""}`}
                onClick={() => {
                    setAllZones(true);
                    setSelectedKeys([]);
                }}
            >
                Todas las zonas
            </button>

            <div className={styles.zoneGrid}>
                {CREDIT_SEARCH_ZONES.map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        className={`${styles.zoneChip} ${!allZones && selectedKeys.includes(key) ? styles.zoneChipActive : ""}`}
                        onClick={() => toggleZone(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
                {onBack && (
                    <button type="button" className={styles.btnSecondary} onClick={onBack}>
                        ← Volver
                    </button>
                )}
                <button
                    type="button"
                    className={styles.simulateBtn}
                    style={{ margin: 0 }}
                    disabled={!canSearch}
                    onClick={() => onConfirm({ allZones, groupKeys: selectedKeys })}
                >
                    Buscar propiedades
                </button>
                {onClose && (
                    <button type="button" className={styles.btnSecondary} onClick={onClose}>
                        Cerrar
                    </button>
                )}
            </div>
        </>
    );
}
