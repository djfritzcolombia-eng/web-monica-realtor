import { buildPublicSiteUrl } from "../config/site";

const SLUG_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
export const MAX_CATALOG_PROPERTIES = 24;

export function generateCatalogSlug(length = 6) {
    let slug = "";
    for (let i = 0; i < length; i += 1) {
        slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
    }
    return slug;
}

export function buildCatalogUrl(slug) {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/c/${slug}`;
    }
    return buildPublicSiteUrl(`/c/${slug}`);
}

export function buildRecommendedSearchUrl() {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/?desde=catalogo`;
    }
    return buildPublicSiteUrl("/?desde=catalogo");
}

export function createPropertySnapshot(property = {}) {
    const allImages = Array.isArray(property.allImages)
        ? property.allImages.filter(Boolean)
        : property.image
            ? [property.image]
            : [];

    return {
        id: String(property.id || ""),
        source: property.source || "wasi",
        sellListingId: property.sellListingId || null,
        title: property.title || "",
        propertyType: property.propertyType || "",
        operationType: property.operationType || "venta",
        salePrice: property.salePrice ?? null,
        rentPrice: property.rentPrice ?? null,
        priceLabel: property.priceLabel || "",
        areaValue: property.areaValue || "",
        areaUnit: property.areaUnit || "",
        bedrooms: property.bedrooms || "",
        bathrooms: property.bathrooms || "",
        garages: property.garages || "",
        address: property.address || "",
        zone: property.zone || "",
        city: property.city || "",
        stratum: property.stratum || "",
        floor: property.floor || "",
        condition: property.condition || "",
        year: property.year || "",
        adminFeeLabel: property.adminFeeLabel || "",
        agent: property.agent || "",
        image: allImages[0] || property.image || null,
        href: property.href || "",
        featuresInt: Array.isArray(property.featuresInt) ? property.featuresInt : [],
        featuresExt: Array.isArray(property.featuresExt) ? property.featuresExt : [],
        galleries: [],
        allImages,
    };
}

export function hydrateCatalogPropertyForCard(property = {}) {
    const images = Array.isArray(property.allImages) && property.allImages.length
        ? property.allImages.filter(Boolean)
        : property.image
            ? [property.image]
            : [];

    return {
        ...property,
        image: images[0] || property.image || null,
        galleries: images.length > 1
            ? [Object.fromEntries(images.slice(1).map((url, index) => [String(index), { url }]))]
            : [],
    };
}

export function buildCatalogShareMessage({ clientName, catalogUrl }) {
    const greeting = clientName?.trim()
        ? `Hola ${clientName.trim()},`
        : "Hola,";

    return [
        greeting,
        "",
        "Quería compartirte la búsqueda que armé especialmente para ti.",
        "Desde ahí puedes ver las propiedades que te comparto, así como también organizar una visita, realizar una propuesta.",
        "También puedes acceder a propiedades recomendadas en caso que las ofrecidas no sean de tu agrado.",
        "",
        `Acceso a la búsqueda: ${catalogUrl}`,
    ].join("\n");
}

export function buildCatalogVisitMessage(property, catalogSlug) {
    const title = property.title || "esta propiedad";
    return [
        "Hola Mónica,",
        "",
        `Vi la propiedad *${title}* en la selección que me enviaste.`,
        "Me gustaría organizar una visita.",
        property.priceLabel ? `Precio: ${property.priceLabel}` : null,
        property.zone || property.city
            ? `Ubicación: ${[property.zone, property.city].filter(Boolean).join(" — ")}`
            : null,
        catalogSlug ? `Catálogo: ${buildCatalogUrl(catalogSlug)}` : null,
    ].filter(Boolean).join("\n");
}

export function buildCatalogProposalMessage(property, catalogSlug) {
    const title = property.title || "esta propiedad";
    return [
        "Hola Mónica,",
        "",
        `Vi la propiedad *${title}* en la selección que me enviaste.`,
        "Me gustaría realizar una propuesta.",
        property.priceLabel ? `Precio: ${property.priceLabel}` : null,
        property.zone || property.city
            ? `Ubicación: ${[property.zone, property.city].filter(Boolean).join(" — ")}`
            : null,
        catalogSlug ? `Catálogo: ${buildCatalogUrl(catalogSlug)}` : null,
    ].filter(Boolean).join("\n");
}
