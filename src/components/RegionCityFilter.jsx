import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import CustomDropdown from "./CustomDropdown";
import { CREDIT_SEARCH_ZONES, buildWasiSearchQuery } from "../constants/searchZones";
import { useSessionTracking } from "../context/SessionTrackingContext";
import { buildSearchMetadata } from "../utils/eventMetadata";
import styles from "./RegionCityFilter.module.css";

const NotaryFeesCalculatorModal = lazy(() => import("./NotaryFeesCalculatorModal"));
const HousingCreditSimulator = lazy(() => import("./HousingCreditSimulator"));

const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const DISPLAY_ORDER = CREDIT_SEARCH_ZONES.map((z) => z.label);

const CONTROL_HEIGHT = 44;
const CONTROL_HEIGHT_HOME = 44;
const CALC_LABEL = "Simulador de gastos notariales";
const CREDIT_LABEL = "Simulador crédito hipotecario";

export default function RegionCityFilter({
    onApply = () => { },
    persistKey = "zone_selection_v1",
    compact = false,
    simulatorInitialData = null,
    onSimulatorConsumed = () => { },
    creditSimulatorInitialData = null,
    onCreditSimulatorConsumed = () => { },
    onCreditBudgetApply = () => { },
    creditExpandOpen = false,
    onCreditExpandClose = () => { },
    creditExpandData = null,
    headingIntro = false,
}) {
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [error, setError] = useState(null);
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [creditSimulatorOpen, setCreditSimulatorOpen] = useState(false);
    const [activeSimulatorData, setActiveSimulatorData] = useState(null);
    const [activeCreditSimulatorData, setActiveCreditSimulatorData] = useState(null);
    const { track } = useSessionTracking();

    useEffect(() => {
        if (!simulatorInitialData) return;
        setActiveSimulatorData(simulatorInitialData);
        setCalculatorOpen(true);
        track("modal_open", {
            action: "simulator_deep_link",
            modal: "notary_fees_calculator",
            payload: simulatorInitialData,
        });
    }, [simulatorInitialData, track]);

    useEffect(() => {
        if (!creditSimulatorInitialData) return;
        setActiveCreditSimulatorData(creditSimulatorInitialData);
        setCreditSimulatorOpen(true);
        track("modal_open", {
            action: "credit_simulator_deep_link",
            modal: "housing_credit_simulator",
            payload: creditSimulatorInitialData,
        });
    }, [creditSimulatorInitialData, track]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(persistKey);
            if (raw) {
                const { groups } = JSON.parse(raw);
                if (Array.isArray(groups)) setSelectedKeys(groups);
            }
        } catch {
            // ignore
        }
    }, [persistKey]);

    useEffect(() => {
        try {
            localStorage.setItem(persistKey, JSON.stringify({ groups: selectedKeys }));
        } catch {
            // ignore
        }
    }, [persistKey, selectedKeys]);

    const handleSelect = (value) => {
        if (value) {
            setSelectedKeys([value]);
            track("zone_select", {
                action: "select_zone",
                zone: value,
                metadata: buildSearchMetadata({ groups: [value] }),
            });
        } else {
            setSelectedKeys([]);
            track("zone_select", { action: "clear_zone" });
        }
    };

    const canApply = useMemo(() => selectedKeys.length > 0, [selectedKeys]);

    const handleApply = () => {
        setError(null);
        const query = buildWasiSearchQuery({
            groupKeys: selectedKeys.map((label) => norm(label)),
        });
        track("filter_applied", {
            action: "search_properties",
            groups: selectedKeys,
            zones: query.zoneIds,
            cityIds: query.cityIds,
            metadata: buildSearchMetadata({
                groups: selectedKeys,
                zones: query.zoneIds,
                page: 1,
                queryType: "filter_applied",
            }),
        });
        onApply({
            zones: query.zoneIds,
            cityIds: query.cityIds,
            groups: selectedKeys,
            useHybrid: query.useHybrid,
        });
    };

    const [isNarrow, setIsNarrow] = useState(false);
    const [isMobileResults, setIsMobileResults] = useState(false);
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setIsNarrow(w <= 700);
            setIsMobileResults(w <= 900);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const modalFallback = null;

    const desktopCompact = compact;
    const stacked = !compact && isNarrow;
    const dropdownHeight = desktopCompact
        ? (isMobileResults ? 32 : 38)
        : stacked ? CONTROL_HEIGHT : CONTROL_HEIGHT_HOME;

    const openNotary = () => {
        setActiveSimulatorData(null);
        setCalculatorOpen(true);
        track("modal_open", { action: "open_simulator", modal: "notary_fees_calculator" });
    };

    const openCredit = () => {
        setCreditSimulatorOpen(true);
        track("modal_open", { action: "open_credit_simulator", modal: "housing_credit_simulator" });
    };

    return (
        <>
            <div className={`${styles.wrap} ${compact ? styles.wrapCompact : ""} ${desktopCompact ? styles.wrapCompactDesktop : ""}`}>
                {!compact && (
                    <>
                        <p className={styles.eyebrow}>Buscar propiedad</p>
                        <h2 className={`${styles.heading} ${headingIntro ? styles.headingIntro : ""}`}>
                            ¿En qué sector <em>deseas vivir?</em>
                        </h2>
                    </>
                )}
                {compact && (
                    <p className={styles.compactLabel}>Zona de búsqueda</p>
                )}
                {error && <div className={styles.error}>{error}</div>}
                {desktopCompact ? (
                    <div className={styles.desktopCompactLayout}>
                        <div className={styles.desktopDropdown}>
                            <CustomDropdown
                                options={DISPLAY_ORDER.map((label) => ({ label, value: label }))}
                                value={selectedKeys[0] || ""}
                                onChange={handleSelect}
                                placeholder="Selecciona una zona..."
                                height={dropdownHeight}
                                compact
                            />
                        </div>
                        <div className={styles.compactActions}>
                            <div className={styles.compactActionsTop}>
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    disabled={!canApply}
                                    className="pillPrimary"
                                    title={canApply ? "Buscar propiedades" : "Selecciona una zona"}
                                >
                                    Buscar
                                </button>
                                <button
                                    type="button"
                                    onClick={openNotary}
                                    className="pillGhost"
                                    title={CALC_LABEL}
                                    aria-label={`Abrir ${CALC_LABEL}`}
                                >
                                    Gastos notariales
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={openCredit}
                                className={`pillGhost ${styles.compactCreditBtn}`}
                                title={CREDIT_LABEL}
                                aria-label={`Abrir ${CREDIT_LABEL}`}
                            >
                                Crédito hipotecario
                            </button>
                        </div>
                    </div>
                ) : (
                <div className={`${styles.stack} ${stacked ? "pillStack" : ""}`}>
                    <div className={`${styles.searchRow} ${stacked ? styles.searchRowNarrow : ""} ${!compact && !stacked ? styles.searchRowHome : ""}`}>
                        <div className={styles.dropdownWrap}>
                            <CustomDropdown
                                options={DISPLAY_ORDER.map((label) => ({ label, value: label }))}
                                value={selectedKeys[0] || ""}
                                onChange={handleSelect}
                                placeholder="Selecciona una zona..."
                                height={dropdownHeight}
                                compact={false}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={!canApply}
                            className={`pillPrimary ${stacked ? "pillFull" : ""}`}
                            title={canApply ? "Buscar propiedades" : "Selecciona una zona"}
                        >
                            Buscar propiedades
                        </button>
                    </div>
                    <div className={`${styles.simulatorsRow} ${stacked ? styles.simulatorsRowStacked : ""}`}>
                        <button
                            type="button"
                            onClick={openNotary}
                            className={`pillGhost ${stacked ? "pillFull" : ""}`}
                            title={CALC_LABEL}
                            aria-label={`Abrir ${CALC_LABEL}`}
                        >
                            {compact ? "Gastos notariales" : "Simulador notarial"}
                        </button>
                        <button
                            type="button"
                            onClick={openCredit}
                            className={`pillGhost ${stacked ? "pillFull" : ""}`}
                            title={CREDIT_LABEL}
                            aria-label={`Abrir ${CREDIT_LABEL}`}
                        >
                            {compact ? "Crédito hipotecario" : "Simulador de crédito"}
                        </button>
                    </div>
                </div>
                )}
            </div>
            <Suspense fallback={modalFallback}>
                <NotaryFeesCalculatorModal
                    open={calculatorOpen}
                    initialData={activeSimulatorData}
                    onClose={() => {
                        track("modal_close", { action: "close_simulator", modal: "notary_fees_calculator" });
                        setCalculatorOpen(false);
                        setActiveSimulatorData(null);
                        onSimulatorConsumed();
                    }}
                />
                <HousingCreditSimulator
                    open={creditSimulatorOpen || creditExpandOpen}
                    zonePickOnly={creditExpandOpen}
                    initialData={creditExpandOpen ? creditExpandData : activeCreditSimulatorData}
                    onBudgetApply={onCreditBudgetApply}
                    onClose={() => {
                        track("modal_close", { action: "close_credit_simulator", modal: "housing_credit_simulator" });
                        setCreditSimulatorOpen(false);
                        setActiveCreditSimulatorData(null);
                        onCreditSimulatorConsumed();
                        onCreditExpandClose();
                    }}
                />
            </Suspense>
        </>
    );
}
