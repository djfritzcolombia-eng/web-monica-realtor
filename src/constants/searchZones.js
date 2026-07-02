/** Zonas Wasi — El Poblado */
export const POBLADO_ZONE_IDS = [
    731979,
    839888,
    901650,
    402806,
    415577,
    401929,
    398730,
    512003,
    898786,
    839876,
];

/** Medellín Occidente — completar con id_zone Wasi cuando estén disponibles */
export const OCCIDENTE_ZONE_IDS = [];

export const MEDELLIN_CITY_ID = "496";

export const CITY_ID_BY_GROUP = {
    itagui: "389",
    "la estrella": "416",
    sabaneta: "698",
    envigado: "291",
    bello: "89",
    occidente: MEDELLIN_CITY_ID,
    oriente: MEDELLIN_CITY_ID,
    "el poblado": MEDELLIN_CITY_ID,
};

export const ZONE_IDS_BY_GROUP = {
    "el poblado": POBLADO_ZONE_IDS,
    occidente: OCCIDENTE_ZONE_IDS,
    oriente: [685, 410],
    itagui: [],
    "la estrella": [],
    sabaneta: [],
    envigado: [],
    bello: [],
};

export const CREDIT_SEARCH_ZONES = [
    { key: "itagui", label: "Itagüí" },
    { key: "la estrella", label: "La Estrella" },
    { key: "sabaneta", label: "Sabaneta" },
    { key: "envigado", label: "Envigado" },
    { key: "el poblado", label: "El Poblado" },
    { key: "bello", label: "Bello" },
    { key: "occidente", label: "Occidente" },
    { key: "oriente", label: "Oriente" },
];

export const ALL_CREDIT_SEARCH_KEYS = CREDIT_SEARCH_ZONES.map((z) => z.key);
export const ALL_CREDIT_SEARCH_LABELS = CREDIT_SEARCH_ZONES.map((z) => z.label);
export const ALL_SEARCH_CITY_IDS = ["389", "416", "698", "291", "89", MEDELLIN_CITY_ID];

const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function labelsFromGroupKeys(groupKeys = []) {
    return groupKeys.map((key) => {
        const found = CREDIT_SEARCH_ZONES.find((z) => z.key === norm(key));
        return found?.label || key;
    });
}

export function buildWasiSearchQuery({ allZones = false, groupKeys = [] } = {}) {
    const keys = groupKeys.map(norm);

    // Varias zonas o "todas": agregar por ciudad (máx. 6 llamadas, sin explosión de id_zone)
    if (allZones || keys.length === 0 || keys.length >= 2) {
        const cityIds = allZones
            ? [...ALL_SEARCH_CITY_IDS]
            : [...new Set(keys.map((k) => CITY_ID_BY_GROUP[k]).filter(Boolean).map(String))];

        return {
            groupKeysNorm: allZones ? ALL_CREDIT_SEARCH_KEYS : keys,
            groupLabels: allZones ? ALL_CREDIT_SEARCH_LABELS : labelsFromGroupKeys(groupKeys),
            cityIds: cityIds.length > 0 ? cityIds : [...ALL_SEARCH_CITY_IDS],
            zoneIds: [],
            useHybrid: false,
        };
    }

    // Una sola zona: precisión por id_zone si aplica (Poblado, Oriente)
    const key = keys[0];
    const zones = ZONE_IDS_BY_GROUP[key];
    if (Array.isArray(zones) && zones.length > 0) {
        return {
            groupKeysNorm: keys,
            groupLabels: labelsFromGroupKeys(groupKeys),
            cityIds: [],
            zoneIds: zones.map(String),
            useHybrid: false,
        };
    }

    const cityId = CITY_ID_BY_GROUP[key];
    return {
        groupKeysNorm: keys,
        groupLabels: labelsFromGroupKeys(groupKeys),
        cityIds: cityId ? [String(cityId)] : [MEDELLIN_CITY_ID],
        zoneIds: [],
        useHybrid: false,
    };
}

/** @deprecated use buildWasiSearchQuery */
export function buildZonesFromGroupKeys(groupKeys = []) {
    return buildWasiSearchQuery({ groupKeys }).zoneIds;
}
