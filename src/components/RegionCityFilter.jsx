// src/components/RegionCityFilter.jsx
import { useEffect, useMemo, useState } from "react";

import CustomDropdown from "./CustomDropdown";
import NotaryFeesCalculatorModal from "./NotaryFeesCalculatorModal";
import { useSessionTracking } from "../context/SessionTrackingContext";
import { buildSearchMetadata } from "../utils/eventMetadata";
// ...existing code...

// ...existing code...

// 🔠 Normalizador
const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** ✅ Zonas que componen "El Poblado" (ya las tienes) */
const POBLADO_ZONE_IDS = [
    731979, // Barrio Los Naranjos, El Poblado
    839888, // La Visitación El Poblado
    901650, // Milla De Oro El Poblado
    402806, // Poblado
    415577, // Poblado El Tesoro
    401929, // Poblado Frontera
    398730, // Poblado Las Palmas
    512003, // Poblado Santa Maria De Los Angeles
    898786, // Poblado Vizcaya
    401929, // Poblado Frontera
    398730, // Poblado Las Palmas
    512003, // Poblado Santa Maria De Los Angeles
    898786, // Poblado Vizcaya
    839876, // Poblado, Milla De Oro
];


/**
 * 🧭 Grupos fijos -> lista de id_zone (Wasi) que debe consultar el backend.
 * Rellena los TODO con tus ids reales (de Wasi) para cada grupo.
 * Si un grupo abarca varias zonas, simplemente incluye todos los ids.
 */
const ZONE_GROUPS = {
    "itagui": [389],
    "la estrella": [416],
    "sabaneta": [698],
    "envigado": [291],
    "bello": [89],
    "el poblado": POBLADO_ZONE_IDS, // ya definido
    "occidente": [
        // TODO: agrupa las zonas de Medellín Occidente que te interesen
        // Ej: Belén, Laureles, Estadio, etc. (id_zone)
    ],
    "oriente": [685, 410],
};

const CONTROL_HEIGHT = 52;
const BTN_FONT = 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';
const CALC_LABEL = "Simulador de gastos notariales";

// Orden visual requerido
const DISPLAY_ORDER = [
    "Itagüí",
    "La Estrella",
    "Sabaneta",
    "Envigado",
    "El Poblado",
    "Bello",
    "Occidente",
    "Oriente",
];

export default function RegionCityFilter({
    onApply = () => { },
    persistKey = "zone_selection_v1",
    compact = false,
    simulatorInitialData = null,
    onSimulatorConsumed = () => { },
}) {
    // selección por nombre normalizado (keys de ZONE_GROUPS)
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [error, setError] = useState(null);
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [activeSimulatorData, setActiveSimulatorData] = useState(null);
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

    // --- Cargar selección persistida ---
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

    // --- Guardar selección persistida ---
    useEffect(() => {
        try {
            localStorage.setItem(
                persistKey,
                JSON.stringify({ groups: selectedKeys })
            );
        } catch {
            // ignore
        }
    }, [persistKey, selectedKeys]);

    // El valor del dropdown es el label (ej: "La Estrella"), pero el estado guarda el normalizado (ej: "la estrella")
    // Guardar el label real seleccionado
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
        // Normaliza los labels seleccionados para buscar en ZONE_GROUPS
        const combined = [];
        for (const k of selectedKeys) {
            const normKey = norm(k);
            const ids = ZONE_GROUPS[normKey] || [];
            if (!Array.isArray(ids) || ids.length === 0) {
                // setError(`El grupo "${k}" no tiene id_zone configurados aún.`);
                // return;
            }
            combined.push(...ids);
        }
        const zones = Array.from(new Set(combined));
        track("filter_applied", {
            action: "search_properties",
            groups: selectedKeys,
            zones,
            metadata: buildSearchMetadata({
                groups: selectedKeys,
                zones,
                page: 1,
                queryType: "filter_applied",
            }),
        });
        onApply({
            zones,
            groups: selectedKeys,
        });
    };

    // Solo apilar en pantallas muy estrechas
    const [isNarrow, setIsNarrow] = useState(false);
    useEffect(() => {
        const check = () => setIsNarrow(window.innerWidth <= 480);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const searchBtnStyle = {
        padding: '0 18px',
        borderRadius: 10,
        border: 'none',
        background: canApply ? '#d8a48f' : '#e6dace',
        color: canApply ? '#fff' : '#6e6259',
        fontWeight: 700,
        fontSize: 16,
        fontFamily: BTN_FONT,
        boxShadow: canApply ? '0 2px 8px 0 rgba(214,164,143,0.10)' : 'none',
        cursor: canApply ? 'pointer' : 'not-allowed',
        transition: 'background .2s',
        height: CONTROL_HEIGHT,
        minHeight: CONTROL_HEIGHT,
        minWidth: 96,
        letterSpacing: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        flex: '0 0 auto',
    };

    const calcBtnStyle = {
        padding: compact ? '0 10px' : '0 14px',
        height: CONTROL_HEIGHT,
        minHeight: CONTROL_HEIGHT,
        borderRadius: 10,
        border: '1.5px solid #d8a48f',
        background: '#fff',
        color: '#d8a48f',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
        boxShadow: '0 2px 8px 0 rgba(214,164,143,0.10)',
        transition: 'background .2s, color .2s',
        fontFamily: BTN_FONT,
        fontWeight: 700,
        fontSize: compact ? 12 : 13,
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        lineHeight: 1.2,
    };

    const onCalcEnter = (e) => {
        e.currentTarget.style.background = '#d8a48f';
        e.currentTarget.style.color = '#fff';
    };
    const onCalcLeave = (e) => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.color = '#d8a48f';
    };

    return (
        <>
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "stretch",
                width: "100%",
                margin: 0,
                minHeight: 60,
                maxHeight: 320,
                padding: 0,
                gap: 0,
                overflow: "visible",
            }}
        >
            <label
                htmlFor="region-city-select"
                style={{
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 8,
                    fontFamily:
                        'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
                    color: '#3a332c', // más oscuro
                    letterSpacing: 0.1,
                    textAlign: 'center',
                    lineHeight: 1.1,
                }}
            >
                ¿En qué sector <em style={{ color: '#a06a4a', fontStyle: 'normal' }}>deseas vivir?</em>
            </label>
            {error && (
                <div style={{ color: "#b00020", marginBottom: 4, fontSize: 14 }}>{error}</div>
            )}
            <div
                style={{
                    display: "flex",
                    flexDirection: isNarrow ? "column" : "row",
                    alignItems: "stretch",
                    gap: 8,
                    width: "100%",
                    maxWidth: "100%",
                    flexWrap: "nowrap",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <CustomDropdown
                        options={DISPLAY_ORDER.map(label => ({ label, value: label }))}
                        value={selectedKeys[0] || ""}
                        onChange={handleSelect}
                        placeholder="Selecciona una zona..."
                        height={CONTROL_HEIGHT}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "nowrap",
                        gap: 8,
                        alignItems: "stretch",
                        flex: isNarrow ? "1 1 auto" : "0 0 auto",
                        width: isNarrow ? "100%" : "auto",
                        boxSizing: "border-box",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={!canApply}
                        style={searchBtnStyle}
                        title={canApply ? "Buscar" : "Selecciona al menos una zona"}
                    >
                        Buscar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveSimulatorData(null);
                            setCalculatorOpen(true);
                            track("modal_open", {
                                action: "open_simulator",
                                modal: "notary_fees_calculator",
                            });
                        }}
                        style={calcBtnStyle}
                        title={CALC_LABEL}
                        aria-label={`Abrir ${CALC_LABEL}`}
                        onMouseEnter={onCalcEnter}
                        onMouseLeave={onCalcLeave}
                    >
                        {CALC_LABEL}
                    </button>
                </div>
            </div>
        </div>
        <NotaryFeesCalculatorModal
            open={calculatorOpen}
            initialData={activeSimulatorData}
            onClose={() => {
                track("modal_close", {
                    action: "close_simulator",
                    modal: "notary_fees_calculator",
                });
                setCalculatorOpen(false);
                setActiveSimulatorData(null);
                onSimulatorConsumed();
            }}
        />
        </>
    );
}
