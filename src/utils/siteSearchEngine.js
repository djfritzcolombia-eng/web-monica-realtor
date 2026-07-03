import { CREDIT_SEARCH_ZONES } from "../constants/searchZones";

const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const PROPERTY_TYPE_PATTERNS = [
    { key: "apartamento", patterns: ["apartamento", "apto", "apartaestudio", "aparta estudio"] },
    { key: "casa", patterns: ["casa", "vivienda", "casa campestre"] },
    { key: "local", patterns: ["local comercial", "local", "comercial", "bodega", "oficina", "lote"] },
];

const ZONE_EXTRA_TERMS = {
    "el poblado": ["poblado"],
    "la estrella": ["estrella"],
    itagui: ["itagui"],
    sabaneta: ["sabaneta"],
    envigado: ["envigado"],
    bello: ["bello"],
    occidente: ["occidente"],
    oriente: ["oriente"],
};

const NAV_INTENTS = [
    {
        action: "open_credit_application",
        patterns: [
            /formulario.*credito/,
            /credito.*formulario/,
            /solicitud.*credito/,
            /aplicar.*credito/,
            /solicitar.*credito/,
        ],
    },
    {
        action: "open_credit_simulator",
        patterns: [
            /simulador.*credito/,
            /credito.*hipotecario/,
            /simular.*credito/,
            /calcular.*credito/,
            /cuota.*credito/,
            /^credito$/,
        ],
    },
    {
        action: "open_notary",
        patterns: [
            /gastos.*notarial/,
            /simulador.*notarial/,
            /notaria/,
            /escritura/,
        ],
    },
    {
        action: "navigate_sell",
        patterns: [
            /vender.*propiedad/,
            /publicar.*propiedad/,
            /vender.*inmueble/,
            /^vender$/,
            /quiero vender/,
        ],
    },
    {
        action: "navigate_home",
        patterns: [/^inicio$/, /^home$/, /^buscar propiedades$/],
    },
];

const STOP_WORDS = new Set([
    "de", "del", "la", "el", "los", "las", "en", "un", "una", "unos", "unas",
    "para", "con", "por", "y", "o", "a", "al", "mi", "tu", "su",
]);

export function zoneSearchTerms(zone) {
    const keyNorm = norm(zone.key);
    const labelNorm = norm(zone.label);
    const terms = new Set([
        keyNorm,
        labelNorm,
        labelNorm.replace(/\s+/g, ""),
        keyNorm.replace(/^(el|la)\s+/, ""),
    ]);
    (ZONE_EXTRA_TERMS[keyNorm] || []).forEach((t) => terms.add(norm(t)));
    return [...terms].filter(Boolean).sort((a, b) => b.length - a.length);
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function queryIncludesTerm(queryNorm, term) {
    if (!term) return false;
    if (queryNorm.includes(term)) return true;
    if (term.length < 3) return false;
    return new RegExp(`(^|\\s)${escapeRegExp(term)}(\\s|$)`).test(queryNorm);
}

function matchZones(queryNorm) {
    const matched = [];
    const seen = new Set();

    const ranked = [...CREDIT_SEARCH_ZONES].sort(
        (a, b) => zoneSearchTerms(b).join("").length - zoneSearchTerms(a).join("").length,
    );

    for (const zone of ranked) {
        const hit = zoneSearchTerms(zone).some((term) => queryIncludesTerm(queryNorm, term));
        if (hit && !seen.has(zone.key)) {
            seen.add(zone.key);
            matched.push(zone);
        }
    }

    return matched;
}

function matchPropertyTypes(queryNorm) {
    const types = [];
    for (const entry of PROPERTY_TYPE_PATTERNS) {
        if (entry.patterns.some((p) => queryNorm.includes(norm(p)))) {
            types.push(entry.key);
        }
    }
    return types;
}

function parseBedrooms(queryNorm) {
    const numeric = queryNorm.match(/(\d+)\s*(habitacion(?:es)?|hab(?:itacion(?:es)?)?|habs?|cuartos?|dormitorios?)/);
    if (numeric) return Number(numeric[1]);

    const words = {
        una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
    };
    const wordMatch = queryNorm.match(/(una|un|dos|tres|cuatro|cinco|seis)\s*(habitacion(?:es)?|hab(?:itacion(?:es)?)?|cuartos?|dormitorios?)/);
    if (wordMatch && words[wordMatch[1]] != null) return words[wordMatch[1]];

    return null;
}

function parseStratum(queryNorm) {
    const numeric = queryNorm.match(/estrato\s*[#.:]?\s*(\d+)/);
    if (numeric) return Number(numeric[1]);

    const words = {
        uno: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
    };
    const wordMatch = queryNorm.match(/estrato\s+(uno|un|dos|tres|cuatro|cinco|seis)/);
    if (wordMatch && words[wordMatch[1]] != null) return words[wordMatch[1]];

    return null;
}

function stripMatchedTerms(queryNorm, { zones, propertyTypes, bedrooms, stratum }) {
    let rest = ` ${queryNorm} `;

    for (const zone of zones) {
        zoneSearchTerms(zone).forEach((term) => {
            rest = rest.replaceAll(` ${term} `, " ");
            rest = rest.replace(new RegExp(`(^|\\s)${escapeRegExp(term)}(\\s|$)`, "g"), " ");
        });
    }

    for (const type of propertyTypes) {
        const entry = PROPERTY_TYPE_PATTERNS.find((p) => p.key === type);
        entry?.patterns.forEach((p) => {
            rest = rest.replaceAll(` ${norm(p)} `, " ");
        });
    }

    if (bedrooms != null) {
        rest = rest.replace(/\d+\s*(habitacion(?:es)?|hab(?:itacion(?:es)?)?|habs?|cuartos?|dormitorios?)/g, " ");
        rest = rest.replace(/(una|un|dos|tres|cuatro|cinco|seis)\s*(habitacion(?:es)?|hab(?:itacion(?:es)?)?|cuartos?|dormitorios?)/g, " ");
    }

    if (stratum != null) {
        rest = rest.replace(/estrato\s*[#.:]?\s*\d+/g, " ");
        rest = rest.replace(/estrato\s+(uno|un|dos|tres|cuatro|cinco|seis)/g, " ");
    }

    return rest
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function parseSiteSearch(rawQuery = "") {
    const query = String(rawQuery || "").trim();
    const queryNorm = norm(query);

    if (!queryNorm) {
        return { action: "empty", query, queryNorm, zones: [], propertyTypes: [], bedrooms: null, stratum: null, keywords: [] };
    }

    for (const intent of NAV_INTENTS) {
        if (intent.patterns.some((pattern) => pattern.test(queryNorm))) {
            return {
                action: intent.action,
                query,
                queryNorm,
                zones: [],
                propertyTypes: [],
                bedrooms: null,
                stratum: null,
                keywords: [],
            };
        }
    }

    const zones = matchZones(queryNorm);
    const propertyTypes = matchPropertyTypes(queryNorm);
    const bedrooms = parseBedrooms(queryNorm);
    const stratum = parseStratum(queryNorm);
    const keywords = stripMatchedTerms(queryNorm, { zones, propertyTypes, bedrooms, stratum });

    return {
        action: "search_properties",
        query,
        queryNorm,
        zones,
        propertyTypes,
        bedrooms,
        stratum,
        keywords,
    };
}

export function describeSiteSearchResult(parsed) {
    if (!parsed || parsed.action === "empty") return "";
    switch (parsed.action) {
        case "open_credit_application":
            return "Abriendo formulario de crédito hipotecario";
        case "open_credit_simulator":
            return "Abriendo simulador de crédito hipotecario";
        case "open_notary":
            return "Abriendo simulador de gastos notariales";
        case "navigate_sell":
            return "Ir a publicar tu propiedad";
        case "navigate_home":
            return "Volviendo al inicio";
        case "search_properties": {
            const parts = [];
            if (parsed.zones.length) parts.push(parsed.zones.map((z) => z.label).join(", "));
            if (parsed.bedrooms != null) parts.push(`${parsed.bedrooms} habitaciones`);
            if (parsed.stratum != null) parts.push(`estrato ${parsed.stratum}`);
            if (parsed.propertyTypes.length) parts.push(parsed.propertyTypes.join(", "));
            if (parsed.keywords.length) parts.push(parsed.keywords.join(" "));
            return parts.length ? `Buscando: ${parts.join(" · ")}` : `Buscando: ${parsed.query}`;
        }
        default:
            return parsed.query;
    }
}
