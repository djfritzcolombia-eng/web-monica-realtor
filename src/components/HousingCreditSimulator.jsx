import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSessionTracking } from "../context/SessionTrackingContext";
import {
    DEFAULT_ANNUAL_RATE_EA,
    LOAN_PERCENT_OPTIONS,
    TERM_LIMITS,
    calcLoanFromProperty,
    formatAnnualRateInput,
    formatBirthDateInput,
    formatCOP,
    formatCurrencyInput,
    formatPercent,
    getMaxLoanPercent,
    parseAnnualRateInput,
    parseBirthDateInput,
    parseCurrencyInput,
    simulateByMonthlyPayment,
    simulateByPropertyValue,
} from "../utils/housingCreditCalculator";
import {
    buildCreditBudgetFilter,
    buildCreditSimulatorShareUrl,
    saveCreditSession,
    shareCreditSimulatorLink,
} from "../utils/creditSimulatorDeepLink";
import CreditSimulationSummary from "./CreditSimulationSummary";
import CreditZonePicker from "./CreditZonePicker";
import styles from "./HousingCreditSimulator.module.css";

const BIRTH_DATE_HINT_EXAMPLE = "08/03/1987";

const STEP_LABELS = {
    mode: "Tipo",
    form: "Datos",
    results: "Resultado",
    search_pick: "Zona",
};

function SimulatorStepBar({ step, onBack }) {
    const steps = ["mode", "form", "results", "search_pick"];
    const idx = steps.indexOf(step);
    if (idx < 0) return null;

    return (
        <div className={styles.stepBar}>
            <button type="button" className={styles.backBtn} onClick={onBack}>
                ← Atrás
            </button>
            <div className={styles.stepTrail} aria-label="Progreso del simulador">
                {steps.slice(0, step === "search_pick" ? 4 : 3).map((s, i) => (
                    <span
                        key={s}
                        className={`${styles.stepDot} ${i <= idx ? styles.stepDotActive : ""}`}
                        title={STEP_LABELS[s]}
                    />
                ))}
            </div>
        </div>
    );
}

function UnderlineCurrencyInput({ value, onChange, placeholder = "0", className }) {
    return (
        <input
            type="text"
            inputMode="numeric"
            className={className || styles.underlineInput}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

export default function HousingCreditSimulator({
    open,
    onClose,
    initialData = null,
    onBudgetApply = () => {},
    zonePickOnly = false,
}) {
    const [step, setStep] = useState("mode");
    const [mode, setMode] = useState(null);
    const [propertyValueRaw, setPropertyValueRaw] = useState("");
    const [loanPercent, setLoanPercent] = useState(70);
    const [loanAmountRaw, setLoanAmountRaw] = useState("");
    const [loanPercentCustom, setLoanPercentCustom] = useState(false);
    const [monthlyPaymentRaw, setMonthlyPaymentRaw] = useState("");
    const [termYears, setTermYears] = useState("15");
    const [birthDateRaw, setBirthDateRaw] = useState("");
    const [propertyType, setPropertyType] = useState("NO_VIS");
    const [modality, setModality] = useState("PESOS");
    const [annualRateRaw, setAnnualRateRaw] = useState(formatAnnualRateInput(DEFAULT_ANNUAL_RATE_EA));
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");
    const [shareFeedback, setShareFeedback] = useState("");
    const [searchPickError, setSearchPickError] = useState("");
    const [searchPickOrigin, setSearchPickOrigin] = useState(null);
    const { track } = useSessionTracking();

    const propertyValue = parseCurrencyInput(propertyValueRaw);
    const loanAmountParsed = parseCurrencyInput(loanAmountRaw);
    const monthlyPayment = parseCurrencyInput(monthlyPaymentRaw);
    const birthDate = parseBirthDateInput(birthDateRaw);
    const annualRateEa = parseAnnualRateInput(annualRateRaw, null);
    const activeFilter = useMemo(
        () => (results ? buildCreditBudgetFilter(results) : null),
        [results]
    );
    const maxPercent = getMaxLoanPercent(propertyType);
    const termLimits = TERM_LIMITS[modality] || TERM_LIMITS.PESOS;

    const computedLoan = useMemo(() => {
        if (mode !== "by_property") return 0;
        if (loanPercentCustom && loanAmountParsed > 0) return loanAmountParsed;
        const pct = loanPercentCustom ? loanPercent : (loanPercent === "custom" ? 70 : loanPercent);
        return calcLoanFromProperty(propertyValue, pct);
    }, [mode, propertyValue, loanPercent, loanPercentCustom, loanAmountParsed]);

    useEffect(() => {
        if (!open) return undefined;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow || "";
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
            setStep("mode");
            setMode(null);
            setPropertyValueRaw("");
            setLoanPercent(70);
            setLoanAmountRaw("");
            setLoanPercentCustom(false);
            setMonthlyPaymentRaw("");
            setTermYears("15");
            setBirthDateRaw("");
            setPropertyType("NO_VIS");
            setModality("PESOS");
            setAnnualRateRaw(formatAnnualRateInput(DEFAULT_ANNUAL_RATE_EA));
            setResults(null);
            setError("");
            setShareFeedback("");
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setShareFeedback("");

        if (zonePickOnly && initialData?.results) {
            setResults(initialData.results);
            setStep("search_pick");
            setSearchPickOrigin("expand");
            setMode(initialData.results.mode || "by_property");
            setError("");
            return;
        }

        if (initialData?.autoSearchPick && initialData.results) {
            setResults(initialData.results);
            setStep("search_pick");
            setSearchPickOrigin("link");
            setMode(initialData.results.mode || "by_property");
            setError("");
            return;
        }

        if (initialData?.showResults && initialData.results) {
            setResults(initialData.results);
            setStep("results");
            setMode(initialData.results.mode || "by_property");
            setError("");
            return;
        }

        if (!initialData) {
            setStep("mode");
            setMode(null);
            setResults(null);
        }
    }, [open, initialData, zonePickOnly]);

    useEffect(() => {
        if (mode !== "by_property" || loanPercentCustom) return;
        const pct = loanPercent === "custom" ? 70 : loanPercent;
        const amount = calcLoanFromProperty(propertyValue, pct);
        if (amount > 0) setLoanAmountRaw(formatCurrencyInput(amount));
    }, [propertyValue, loanPercent, loanPercentCustom, mode]);

    useEffect(() => {
        if (propertyType === "VIS" && loanPercent === 70 && !loanPercentCustom) {
            setLoanPercent(80);
        }
    }, [propertyType, loanPercent, loanPercentCustom]);

    useEffect(() => {
        const limits = TERM_LIMITS[modality] || TERM_LIMITS.PESOS;
        const term = Number(termYears);
        if (Number.isFinite(term) && term > limits.max) {
            setTermYears(String(limits.max));
        }
    }, [modality, termYears]);

    if (!open) return null;

    const renderSharedFields = () => (
        <>
            <div className={styles.typeRow}>
                <span className={styles.fieldLabel} style={{ margin: 0 }}>Modalidad del crédito</span>
                <select
                    className={styles.typeSelect}
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                >
                    <option value="PESOS">Crédito en pesos (5 a 20 años)</option>
                    <option value="UVR">Crédito en UVR (5 a 30 años)</option>
                </select>
            </div>

            <div className={styles.section}>
                <label className={styles.fieldLabel} htmlFor="annual-rate">
                    Tasa de interés (% EA)
                </label>
                <input
                    id="annual-rate"
                    type="text"
                    inputMode="decimal"
                    className={styles.underlineInputSmall}
                    value={annualRateRaw}
                    onChange={(e) => setAnnualRateRaw(e.target.value.replace(/[^\d.,]/g, ""))}
                    placeholder="16,15"
                />
                <p className={styles.hint}>
                    Ingresa manualmente la tasa efectiva anual ofrecida por el banco. Referencial: {formatPercent(DEFAULT_ANNUAL_RATE_EA * 100)} EA.
                </p>
            </div>
        </>
    );

    const renderTermField = (id) => (
        <div className={styles.section}>
            <label className={styles.fieldLabel} htmlFor={id}>
                ¿A cuántos años?
            </label>
            <input
                id={id}
                type="number"
                min={termLimits.min}
                max={termLimits.max}
                className={styles.underlineInputSmall}
                value={termYears}
                onChange={(e) => setTermYears(e.target.value)}
            />
            <p className={styles.hint}>
                Entre {termLimits.min} y {termLimits.max} años ({modality === "UVR" ? "UVR" : "pesos"}).
            </p>
        </div>
    );

    const renderBirthDateField = (id) => (
        <div className={styles.section}>
            <label className={styles.fieldLabel} htmlFor={id}>
                Fecha de nacimiento
            </label>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                className={styles.underlineInputSmall}
                value={birthDateRaw}
                onChange={(e) => setBirthDateRaw(formatBirthDateInput(e.target.value))}
            />
            <p className={styles.hint}>
                Formato dd/mm/aaaa. Ejemplo: {BIRTH_DATE_HINT_EXAMPLE}. Edad entre 18 y 75 años.
            </p>
        </div>
    );

    const handleSelectMode = (nextMode) => {
        setMode(nextMode);
        setStep("form");
        setError("");
        track("modal_open", {
            action: "open_credit_simulator",
            modal: "housing_credit_simulator",
            mode: nextMode,
        });
    };

    const handleBack = () => {
        if (zonePickOnly) {
            onClose?.();
            return;
        }
        if (step === "search_pick") {
            if (searchPickOrigin === "results") {
                setStep("results");
            } else if (searchPickOrigin === "link") {
                onClose?.();
            } else {
                onClose?.();
            }
            setSearchPickError("");
            return;
        }
        if (step === "results") {
            setStep("form");
            setResults(null);
            return;
        }
        if (step === "form") {
            setStep("mode");
            setMode(null);
            return;
        }
        onClose?.();
    };

    const canSimulate = mode === "by_property"
        ? propertyValue > 0 && computedLoan > 0 && termYears && birthDateRaw.length >= 8 && annualRateEa != null
        : monthlyPayment > 0 && termYears && birthDateRaw.length >= 8 && annualRateEa != null;

    const handleSimulate = () => {
        setError("");
        const term = Number(termYears);
        const rate = parseAnnualRateInput(annualRateRaw, null);

        const outcome = mode === "by_property"
            ? simulateByPropertyValue({
                propertyValue,
                loanAmount: loanPercentCustom ? loanAmountParsed : computedLoan,
                loanPercent: loanPercentCustom && propertyValue > 0
                    ? Math.round((loanAmountParsed / propertyValue) * 100)
                    : (loanPercent === "custom" ? 70 : loanPercent),
                propertyType,
                modality,
                termYears: term,
                birthDate,
                birthDateRaw,
                annualRateEa: rate,
            })
            : simulateByMonthlyPayment({
                monthlyPayment,
                propertyType,
                modality,
                termYears: term,
                birthDate,
                birthDateRaw,
                annualRateEa: rate,
            });

        if (outcome.error) {
            setError(outcome.error);
            return;
        }

        setResults(outcome);
        setStep("results");
        track("simulator_calculate", {
            action: "calculate_housing_credit",
            mode,
            ...outcome,
        });
    };

    const handleShare = async () => {
        if (!results) return;
        try {
            const url = buildCreditSimulatorShareUrl(results);
            const outcome = await shareCreditSimulatorLink(url);
            track("simulator_share", {
                action: "share_credit_link",
                outcome,
                url,
                maxPropertyPrice: results.propertyValue,
            });
            setShareFeedback(
                outcome === "shared"
                    ? "Enlace compartido correctamente."
                    : "Enlace copiado al portapapeles."
            );
        } catch {
            setShareFeedback("No se pudo compartir el enlace. Intenta de nuevo.");
        }
    };

    const handleApplyBudget = () => {
        if (!results) return;
        setSearchPickError("");
        setSearchPickOrigin("results");
        setStep("search_pick");
        track("simulator_apply_budget", {
            action: "open_credit_search_picker",
            ...buildCreditBudgetFilter(results),
        });
    };

    const handleConfirmSearch = ({ allZones, groupKeys }) => {
        if (!results) return;
        if (!allZones && (!groupKeys || groupKeys.length === 0)) {
            setSearchPickError("Selecciona al menos una zona o elige «Todas las zonas».");
            return;
        }
        const filter = buildCreditBudgetFilter(results);
        const searchSelection = { allZones, groupKeys };
        saveCreditSession({ results, filter, searchSelection });
        track("simulator_apply_budget", {
            action: "apply_credit_budget_filter",
            allZones,
            groupKeys,
            ...filter,
        });
        onBudgetApply({ results, filter, searchSelection });
        onClose?.();
    };

    const content = (
        <div className={styles.overlay} role="presentation">
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                ×
            </button>

            <div className={styles.container}>
                {step !== "mode" && (
                    <SimulatorStepBar step={step} onBack={handleBack} />
                )}

                {step === "mode" && !zonePickOnly && (
                    <>
                        <h1 className={styles.heading}>
                            Simulador de crédito hipotecario
                        </h1>
                        <p className={styles.subheading}>Escoge una de estas dos opciones</p>

                        <div className={styles.modeGrid}>
                            <button
                                type="button"
                                className={styles.modeCard}
                                onClick={() => handleSelectMode("by_property")}
                            >
                                <h2 className={styles.modeTitle}>Según el valor de la vivienda</h2>
                                <p className={styles.modeDesc}>Calcular las cuotas</p>
                            </button>
                            <button
                                type="button"
                                className={styles.modeCard}
                                onClick={() => handleSelectMode("by_payment")}
                            >
                                <h2 className={styles.modeTitle}>Según la cuota que puedo pagar</h2>
                                <p className={styles.modeDesc}>Cuánto me pueden prestar</p>
                            </button>
                        </div>
                    </>
                )}

                {step === "form" && mode === "by_property" && (
                    <>
                        <h1 className={styles.heading}>Simulador de crédito hipotecario</h1>

                        <div className={styles.typeRow}>
                            <span className={styles.fieldLabel} style={{ margin: 0 }}>Tipo de vivienda</span>
                            <select
                                className={styles.typeSelect}
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                            >
                                <option value="NO_VIS">No VIS (hasta 70%)</option>
                                <option value="VIS">VIS (hasta 80%)</option>
                            </select>
                        </div>

                        <div className={styles.section}>
                            <label className={styles.fieldLabel} htmlFor="property-value">
                                ¿Cuál es el valor comercial de la vivienda?
                            </label>
                            <UnderlineCurrencyInput
                                value={propertyValueRaw}
                                onChange={(raw) => {
                                    const parsed = parseCurrencyInput(raw);
                                    setPropertyValueRaw(parsed ? formatCurrencyInput(parsed) : "");
                                }}
                            />
                            <p className={styles.hint}>
                                Crédito de Vivienda: financiamiento hasta el {maxPercent}% del valor comercial.
                            </p>
                        </div>

                        <div className={styles.section}>
                            <span className={styles.fieldLabel}>¿Cuánto dinero necesitas?</span>
                            <div className={styles.loanRow}>
                                <select
                                    className={styles.percentSelect}
                                    value={loanPercentCustom ? "custom" : String(loanPercent)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "custom") {
                                            setLoanPercentCustom(true);
                                            setLoanPercent("custom");
                                        } else {
                                            setLoanPercentCustom(false);
                                            setLoanPercent(Number(val));
                                        }
                                    }}
                                >
                                    {LOAN_PERCENT_OPTIONS.filter((opt) =>
                                        opt.maxFor === propertyType || opt.value === "custom" || opt.value <= maxPercent
                                    ).map((opt) => (
                                        <option key={String(opt.value)} value={String(opt.value)}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <span className={styles.equals}>=</span>
                                <div className={styles.loanAmountWrap}>
                                    <UnderlineCurrencyInput
                                        value={loanAmountRaw}
                                        onChange={(raw) => {
                                            setLoanPercentCustom(true);
                                            setLoanPercent("custom");
                                            const parsed = parseCurrencyInput(raw);
                                            setLoanAmountRaw(parsed ? formatCurrencyInput(parsed) : "");
                                        }}
                                    />
                                </div>
                            </div>
                            <p className={styles.hint}>
                                Te prestamos hasta el {maxPercent}% del valor comercial de la vivienda {propertyType === "VIS" ? "VIS" : "No VIS"}.
                            </p>
                        </div>

                        {renderSharedFields()}

                        <div className={styles.twoCol}>
                            {renderTermField("term-years")}
                            {renderBirthDateField("birth-date")}
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <button
                            type="button"
                            className={styles.simulateBtn}
                            disabled={!canSimulate}
                            onClick={handleSimulate}
                        >
                            SIMULAR
                        </button>
                    </>
                )}

                {step === "form" && mode === "by_payment" && (
                    <>
                        <h1 className={styles.heading}>¿Cuánto me pueden prestar?</h1>

                        <div className={styles.typeRow}>
                            <span className={styles.fieldLabel} style={{ margin: 0 }}>Tipo de vivienda</span>
                            <select
                                className={styles.typeSelect}
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                            >
                                <option value="NO_VIS">No VIS (hasta 70%)</option>
                                <option value="VIS">VIS (hasta 80%)</option>
                            </select>
                        </div>

                        <div className={styles.section}>
                            <label className={styles.fieldLabel}>
                                ¿Cuánto puedes pagar cada mes?
                            </label>
                            <UnderlineCurrencyInput
                                value={monthlyPaymentRaw}
                                onChange={(raw) => {
                                    const parsed = parseCurrencyInput(raw);
                                    setMonthlyPaymentRaw(parsed ? formatCurrencyInput(parsed) : "");
                                }}
                            />
                            <p className={styles.hint}>
                                Ingresa la cuota mensual total que podrías destinar al crédito (incluyendo seguros).
                            </p>
                        </div>

                        {renderSharedFields()}

                        <div className={styles.twoCol}>
                            {renderTermField("term-years-payment")}
                            {renderBirthDateField("birth-date-payment")}
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <button
                            type="button"
                            className={styles.simulateBtn}
                            disabled={!canSimulate}
                            onClick={handleSimulate}
                        >
                            SIMULAR
                        </button>
                    </>
                )}

                {step === "results" && results && activeFilter && (
                    <CreditSimulationSummary
                        results={results}
                        filter={activeFilter}
                        showFilterBanner={false}
                        showActions
                        onBack={() => {
                            setStep("form");
                            setResults(null);
                            setShareFeedback("");
                        }}
                        onClose={onClose}
                        onShare={handleShare}
                        onApplyBudget={handleApplyBudget}
                        shareFeedback={shareFeedback}
                    />
                )}

                {step === "search_pick" && results && activeFilter && (
                    <>
                        {!zonePickOnly && (
                            <CreditSimulationSummary
                                results={results}
                                filter={activeFilter}
                                showFilterBanner={false}
                                showActions={false}
                                showDisclaimer={false}
                            />
                        )}
                        <CreditZonePicker
                            results={results}
                            filter={activeFilter}
                            showSummary={zonePickOnly}
                            initialAllZones={initialData?.searchSelection?.allZones || false}
                            initialSelectedKeys={initialData?.searchSelection?.groupKeys || []}
                            error={searchPickError}
                            onBack={handleBack}
                            onClose={onClose}
                            onConfirm={handleConfirmSearch}
                        />
                    </>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
