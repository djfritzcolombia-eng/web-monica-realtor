import { formatCOP } from "./housingCreditCalculator";
import { parseSellCurrencyInput } from "./sellListingCurrency";

const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const PROPERTY_TYPE_OPTIONS = [
    { value: "", label: "Cualquiera" },
    { value: "apartamento", label: "Apartamento" },
    { value: "casa", label: "Casa" },
    { value: "local", label: "Local comercial" },
    { value: "lote", label: "Lote / terreno" },
];

export const COUNT_OPTIONS = [
    { value: "", label: "Cualquiera" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5+" },
];

export const EMPTY_ADVANCED_FILTER = {
    priceMin: null,
    priceMax: null,
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    areaMin: null,
    areaMax: null,
    builtFrom: "",
    wasiCode: "",
    text: "",
};

export function parseAdvancedFilterDraft(draft = {}) {
    return {
        priceMin: draft.priceMin > 0 ? Number(draft.priceMin) : null,
        priceMax: draft.priceMax > 0 ? Number(draft.priceMax) : null,
        propertyType: String(draft.propertyType || "").trim(),
        bedrooms: String(draft.bedrooms || "").trim(),
        bathrooms: String(draft.bathrooms || "").trim(),
        garages: String(draft.garages || "").trim(),
        areaMin: draft.areaMin > 0 ? Number(draft.areaMin) : null,
        areaMax: draft.areaMax > 0 ? Number(draft.areaMax) : null,
        builtFrom: String(draft.builtFrom || "").trim(),
        wasiCode: String(draft.wasiCode || "").trim(),
        text: String(draft.text || "").trim(),
    };
}

export function hasActiveAdvancedFilter(filter = EMPTY_ADVANCED_FILTER) {
    const f = filter || EMPTY_ADVANCED_FILTER;
    return Boolean(
        f.priceMin
        || f.priceMax
        || f.propertyType
        || f.bedrooms
        || f.bathrooms
        || f.garages
        || f.areaMin
        || f.areaMax
        || f.builtFrom
        || f.wasiCode
        || f.text
    );
}

function getSalePrice(property) {
    const direct = Number(property?.salePrice);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const label = String(property?.priceLabel || "");
    const digits = label.replace(/[^\d]/g, "");
    const parsed = Number(digits);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function matchesPropertyType(haystack, typeKey) {
    if (!typeKey) return true;
    if (typeKey === "apartamento") {
        return /apartamento|apto|apartaestudio|aparta studio/.test(haystack);
    }
    if (typeKey === "casa") {
        return /casa|vivienda/.test(haystack);
    }
    if (typeKey === "local") {
        return /local|comercial|bodega|oficina/.test(haystack);
    }
    if (typeKey === "lote") {
        return /lote|terreno/.test(haystack);
    }
    return haystack.includes(typeKey);
}

function matchesCount(value, target) {
    if (!target) return true;
    const n = Number(value);
    if (!Number.isFinite(n)) return false;
    if (target === "5") return n >= 5;
    return n === Number(target);
}

function propertyHaystack(property) {
    return [
        property.title,
        property.propertyType,
        property.address,
        property.zone,
        property.city,
    ]
        .map((v) => norm(v))
        .filter(Boolean)
        .join(" ");
}

function parseArea(value) {
    const n = Number(String(value || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
}

function parseYear(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    const n = Number(digits);
    return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null;
}

export function filterPropertiesByAdvanced(properties = [], filter = EMPTY_ADVANCED_FILTER) {
    if (!hasActiveAdvancedFilter(filter)) return properties;

    const textNorm = norm(filter.text);
    const wasiCodeNorm = norm(filter.wasiCode);
    const builtFrom = parseYear(filter.builtFrom);

    return properties.filter((property) => {
        const salePrice = getSalePrice(property);
        if (filter.priceMin != null && (salePrice <= 0 || salePrice < filter.priceMin)) return false;
        if (filter.priceMax != null && (salePrice <= 0 || salePrice > filter.priceMax)) return false;

        const haystack = propertyHaystack(property);
        if (!matchesPropertyType(haystack, filter.propertyType)) return false;

        if (!matchesCount(property.bedrooms, filter.bedrooms)) return false;
        if (!matchesCount(property.bathrooms, filter.bathrooms)) return false;
        if (!matchesCount(property.garages, filter.garages)) return false;

        const area = parseArea(property.areaValue);
        if (filter.areaMin != null && (area == null || area < filter.areaMin)) return false;
        if (filter.areaMax != null && (area == null || area > filter.areaMax)) return false;

        if (builtFrom != null) {
            const year = parseYear(property.year);
            if (year == null || year < builtFrom) return false;
        }

        if (wasiCodeNorm) {
            const idNorm = norm(String(property.id || ""));
            if (!idNorm.includes(wasiCodeNorm)) return false;
        }

        if (textNorm) {
            const blob = [
                property.title,
                property.address,
                property.zone,
                property.city,
                ...(property.featuresInt || []),
                ...(property.featuresExt || []),
            ]
                .map((v) => norm(v))
                .join(" ");
            if (!blob.includes(textNorm)) return false;
        }

        return true;
    });
}

export function formatPriceChip(min, max) {
    if (min && max) return `${formatCOP(min)} – ${formatCOP(max)}`;
    if (min) return `Desde ${formatCOP(min)}`;
    if (max) return `Hasta ${formatCOP(max)}`;
    return "";
}

export function buildAdvancedFilterChips(filter = EMPTY_ADVANCED_FILTER) {
    if (!hasActiveAdvancedFilter(filter)) return [];

    const chips = [];

    if (filter.priceMin || filter.priceMax) {
        chips.push({
            key: "price",
            label: formatPriceChip(filter.priceMin, filter.priceMax),
        });
    }

    if (filter.propertyType) {
        const typeLabel = PROPERTY_TYPE_OPTIONS.find((o) => o.value === filter.propertyType)?.label
            || filter.propertyType;
        chips.push({ key: "propertyType", label: typeLabel });
    }

    if (filter.bedrooms) {
        chips.push({
            key: "bedrooms",
            label: `${filter.bedrooms === "5" ? "5+" : filter.bedrooms} alcoba${filter.bedrooms === "1" ? "" : "s"}`,
        });
    }

    if (filter.bathrooms) {
        chips.push({
            key: "bathrooms",
            label: `${filter.bathrooms === "5" ? "5+" : filter.bathrooms} baño${filter.bathrooms === "1" ? "" : "s"}`,
        });
    }

    if (filter.garages) {
        chips.push({
            key: "garages",
            label: `${filter.garages === "5" ? "5+" : filter.garages} garaje${filter.garages === "1" ? "" : "s"}`,
        });
    }

    if (filter.areaMin || filter.areaMax) {
        const parts = [];
        if (filter.areaMin) parts.push(`${filter.areaMin} m²`);
        if (filter.areaMax) parts.push(`${filter.areaMax} m²`);
        chips.push({ key: "area", label: `Área ${parts.join(" – ")}` });
    }

    if (filter.builtFrom) {
        chips.push({ key: "builtFrom", label: `Desde ${filter.builtFrom}` });
    }

    if (filter.wasiCode) {
        chips.push({ key: "wasiCode", label: `Cód. ${filter.wasiCode}` });
    }

    if (filter.text) {
        const short = filter.text.length > 28 ? `${filter.text.slice(0, 28)}…` : filter.text;
        chips.push({ key: "text", label: `"${short}"` });
    }

    return chips;
}

export function removeAdvancedFilterKey(filter, key) {
    const next = { ...filter };
    switch (key) {
        case "price":
            next.priceMin = null;
            next.priceMax = null;
            break;
        case "area":
            next.areaMin = null;
            next.areaMax = null;
            break;
        default:
            if (key in next) next[key] = key === "builtFrom" || key === "wasiCode" || key === "text" ? "" : "";
            break;
    }
    return next;
}

export function parsePriceInput(raw) {
    return parseSellCurrencyInput(raw);
}
