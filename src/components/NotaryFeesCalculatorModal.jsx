import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSessionTracking } from "../context/SessionTrackingContext";
import {
    buildSimulatorMetadata,
    mergeMetadata,
} from "../utils/eventMetadata";
import {
    calculateNotaryFees,
    formatCOP,
    formatCurrencyInput,
    parseCurrencyInput,
} from "../utils/notaryFeesCalculator";
import {
    buildSimulatorShareUrl,
    shareSimulatorLink,
} from "../utils/simulatorDeepLink";
import styles from "./NotaryFeesCalculatorModal.module.css";

function CurrencyInput({ label, value, onChange, placeholder, hint }) {
    return (
        <div className={styles.fieldGroup}>
            <label className={styles.label}>
                {label}
                {hint && (
                    <span className={styles.infoIcon} title={hint}>i</span>
                )}
            </label>
            <input
                type="text"
                inputMode="numeric"
                className={styles.input}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function PartyBreakdown({ title, total, items }) {
    return (
        <div className={styles.partyCard}>
            <h3 className={styles.partyTitle}>{title}</h3>
            <p className={styles.partyTotal}>
                {formatCOP(total)} <span>Aprox.</span>
            </p>
            {items.map((item) => (
                <div key={item.label} className={styles.itemRow}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    <span className={styles.itemAmount}>{formatCOP(item.amount)}</span>
                </div>
            ))}
        </div>
    );
}

function applySimulationToState(data, setters) {
    const {
        setPropertyValueRaw,
        setMortgageRaw,
        setPropertyType,
        setResults,
        setStep,
        setError,
    } = setters;

    const propertyValue = Math.max(0, Number(data.propertyValue) || 0);
    const mortgageBalance = Math.max(0, Math.min(Number(data.mortgageBalance) || 0, propertyValue));
    const propertyType = data.propertyType === "VIS" ? "VIS" : "NO_VIS";

    setPropertyValueRaw(propertyValue ? formatCurrencyInput(propertyValue) : "");
    setMortgageRaw(mortgageBalance ? formatCurrencyInput(mortgageBalance) : "");
    setPropertyType(propertyType);
    setError("");

    if (data.showResults && propertyValue > 0) {
        setResults(calculateNotaryFees({ propertyValue, mortgageBalance, propertyType }));
        setStep("results");
    } else {
        setResults(null);
        setStep("form");
    }
}

export default function NotaryFeesCalculatorModal({ open, onClose, initialData = null }) {
    const [step, setStep] = useState("form");
    const [propertyValueRaw, setPropertyValueRaw] = useState("");
    const [mortgageRaw, setMortgageRaw] = useState("");
    const [propertyType, setPropertyType] = useState("NO_VIS");
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");
    const [shareFeedback, setShareFeedback] = useState("");
    const { track } = useSessionTracking();

    useEffect(() => {
        if (!open) return undefined;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.classList.add("modal-open");
        return () => {
            document.body.style.overflow = prevOverflow || "";
            document.body.classList.remove("modal-open");
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            setShareFeedback("");
            return;
        }

        if (initialData) {
            applySimulationToState(initialData, {
                setPropertyValueRaw,
                setMortgageRaw,
                setPropertyType,
                setResults,
                setStep,
                setError,
            });
            return;
        }

        setStep("form");
        setPropertyValueRaw("");
        setMortgageRaw("");
        setPropertyType("NO_VIS");
        setResults(null);
        setError("");
    }, [open, initialData]);

    if (!open) return null;

    const propertyValue = parseCurrencyInput(propertyValueRaw);
    const mortgageBalance = parseCurrencyInput(mortgageRaw);
    const canCalculate = propertyValue > 0;

    const handlePropertyChange = (raw) => {
        const parsed = parseCurrencyInput(raw);
        setPropertyValueRaw(parsed ? formatCurrencyInput(parsed) : "");
    };

    const handleMortgageChange = (raw) => {
        const parsed = parseCurrencyInput(raw);
        setMortgageRaw(parsed ? formatCurrencyInput(parsed) : "");
    };

    const handleCalculate = () => {
        if (!canCalculate) {
            setError("Ingresa el valor del inmueble para continuar.");
            return;
        }
        if (mortgageBalance > propertyValue) {
            setError("El saldo de hipoteca no puede ser mayor al valor del inmueble.");
            return;
        }
        setError("");
        const calcResults = calculateNotaryFees({ propertyValue, mortgageBalance, propertyType });
        setResults(calcResults);
        setStep("results");
        track("simulator_calculate", {
            action: "calculate_notary_fees",
            propertyValue,
            mortgageBalance,
            propertyType,
            buyerTotal: calcResults.buyer.total,
            sellerTotal: calcResults.seller.total,
            metadata: buildSimulatorMetadata({
                propertyValue,
                mortgageBalance,
                propertyType,
                buyerTotal: calcResults.buyer.total,
                sellerTotal: calcResults.seller.total,
            }),
        });
    };

    const handlePropertyTypeChange = (nextType) => {
        setPropertyType(nextType);
        track("simulator_input", {
            action: "change_property_type",
            propertyType: nextType,
            metadata: buildSimulatorMetadata({ propertyType: nextType }),
        });
        if (results) {
            setResults(calculateNotaryFees({
                propertyValue: results.propertyValue,
                mortgageBalance: results.mortgageBalance,
                propertyType: nextType,
            }));
        }
    };

    const handleShare = async () => {
        if (!results) return;
        try {
            const url = buildSimulatorShareUrl({
                propertyValue: results.propertyValue,
                mortgageBalance: results.mortgageBalance,
                propertyType: results.propertyType,
            });
            const outcome = await shareSimulatorLink(url);
            track("simulator_share", {
                action: "share_link",
                outcome,
                propertyValue: results.propertyValue,
                mortgageBalance: results.mortgageBalance,
                propertyType: results.propertyType,
                url,
                metadata: buildSimulatorMetadata({
                    propertyValue: results.propertyValue,
                    mortgageBalance: results.mortgageBalance,
                    propertyType: results.propertyType,
                    buyerTotal: results.buyer?.total,
                    sellerTotal: results.seller?.total,
                }),
            });
            setShareFeedback(
                outcome === "shared"
                    ? "Enlace compartido correctamente."
                    : "Enlace copiado al portapapeles."
            );
        } catch {
            track("simulator_share", { action: "share_link_failed" });
            setShareFeedback("No se pudo compartir el enlace. Intenta de nuevo.");
        }
    };

    const modal = (
        <div className={styles.overlay} onClick={onClose} role="presentation">
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notary-calc-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                    ×
                </button>

                {step === "form" ? (
                    <>
                        <h2 id="notary-calc-title" className={styles.title}>
                            Simulador de gastos notariales
                        </h2>
                        <p className={styles.subtitle}>Ingresa los siguientes datos.</p>

                        <div className={styles.formGrid}>
                            <CurrencyInput
                                label="Valor del inmueble"
                                placeholder="Ej. $200.000.000"
                                value={propertyValueRaw}
                                onChange={handlePropertyChange}
                            />
                            <CurrencyInput
                                label="Saldo hipoteca"
                                placeholder="Ej. $100.000.000"
                                value={mortgageRaw}
                                onChange={handleMortgageChange}
                                hint="Monto pendiente del crédito hipotecario, si aplica."
                            />
                        </div>

                        <div className={styles.typeRow}>
                            <span className={styles.typeLabel}>Tipo de inmueble</span>
                            <select
                                className={styles.typeSelect}
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                            >
                                <option value="NO_VIS">No VIS</option>
                                <option value="VIS">VIS</option>
                            </select>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <div className={styles.actions}>
                            <button type="button" className={styles.btnBack} onClick={onClose}>
                                ← Volver
                            </button>
                            <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={handleCalculate}
                                disabled={!canCalculate}
                            >
                                Calcular gastos notariales →
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 id="notary-calc-title" className={styles.title}>
                            Gastos notariales
                        </h2>
                        <p className={styles.subtitle}>
                            Estos son los <strong>gastos adicionales</strong> en la compra de un inmueble, divididos así:
                        </p>

                        <div className={styles.typeRow}>
                            <span className={styles.typeLabel}>Tipo de inmueble</span>
                            <select
                                className={styles.typeSelect}
                                value={propertyType}
                                onChange={(e) => handlePropertyTypeChange(e.target.value)}
                            >
                                <option value="NO_VIS">No VIS</option>
                                <option value="VIS">VIS</option>
                            </select>
                        </div>

                        <div className={styles.resultsGrid}>
                            <PartyBreakdown
                                title="Comprador"
                                total={results.buyer.total}
                                items={results.buyer.items}
                            />
                            <PartyBreakdown
                                title="Vendedor"
                                total={results.seller.total}
                                items={results.seller.items}
                            />
                        </div>

                        <div className={styles.disclaimer}>
                            <span className={styles.disclaimerIcon}>i</span>
                            <p>
                                Los valores aquí presentados son estimados y pueden variar según las
                                disposiciones legales vigentes y las características específicas del
                                inmueble. Consulta con tu abogado o notaría para cifras exactas.
                            </p>
                        </div>

                        {shareFeedback && <p className={styles.shareFeedback}>{shareFeedback}</p>}

                        <div className={`${styles.actions} ${styles.actionsResults}`} style={{ marginTop: 24 }}>
                            <button type="button" className={styles.btnBack} onClick={() => {
                                track("simulator_step", { action: "back_to_form" });
                                setStep("form");
                            }}>
                                ← Volver
                            </button>
                            <button type="button" className={styles.btnShare} onClick={handleShare}>
                                Compartir enlace
                            </button>
                            <button type="button" className={styles.btnPrimary} onClick={onClose}>
                                Cerrar y ver página
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
