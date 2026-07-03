const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function normalizeStratum(value) {
    if (value == null || value === "") return null;
    const digits = String(value).replace(/[^\d]/g, "");
    const n = Number(digits);
    return Number.isFinite(n) && n >= 1 && n <= 6 ? n : null;
}

function propertyHaystack(property) {
    return [
        property.title,
        property.propertyType,
        property.zone,
        property.city,
        property.address,
        property.condition,
        property.stratum != null && property.stratum !== "" ? `estrato ${property.stratum}` : "",
        ...(property.featuresInt || []),
        ...(property.featuresExt || []),
    ]
        .map((v) => norm(v))
        .filter(Boolean)
        .join(" ");
}

function matchesPropertyType(haystack, types = []) {
    if (!types.length) return true;
    return types.some((type) => {
        if (type === "apartamento") {
            return /apartamento|apto|apartaestudio|aparta studio/.test(haystack);
        }
        if (type === "casa") {
            return /casa|vivienda/.test(haystack);
        }
        if (type === "local") {
            return /local|comercial|bodega|oficina|lote/.test(haystack);
        }
        return haystack.includes(type);
    });
}

export function filterPropertiesByQuery(properties = [], parsed) {
    if (!parsed || parsed.action !== "search_properties") return properties;

    const hasFilters =
        parsed.bedrooms != null
        || parsed.stratum != null
        || (parsed.propertyTypes?.length > 0)
        || (parsed.keywords?.length > 0);

    if (!hasFilters) return properties;

    return properties.filter((property) => {
        if (parsed.bedrooms != null) {
            const beds = Number(property.bedrooms);
            if (!Number.isFinite(beds) || beds !== parsed.bedrooms) return false;
        }

        if (parsed.stratum != null) {
            const stratum = normalizeStratum(property.stratum);
            if (stratum == null || stratum !== parsed.stratum) return false;
        }

        const haystack = propertyHaystack(property);

        if (!matchesPropertyType(haystack, parsed.propertyTypes)) return false;

        if (parsed.keywords?.length) {
            const allMatch = parsed.keywords.every((kw) => haystack.includes(norm(kw)));
            if (!allMatch) return false;
        }

        return true;
    });
}
