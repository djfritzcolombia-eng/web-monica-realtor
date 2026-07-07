import { formatSellCurrencyDisplay } from "./sellListingCurrency";

export const PROPERTY_TYPES = [
    "Apartamento",
    "Casa",
    "Apartaestudio",
    "Local comercial",
    "Lote",
    "Bodega",
    "Oficina",
];

export const AMENITY_OPTIONS = [
    "Admite mascotas",
    "Baño auxiliar",
    "Clósets",
    "Transporte público cercano",
    "Parqueadero visitantes",
    "Piscina",
    "Gimnasio",
    "Balcon",
];

export function listingToForm(listing = {}) {
    return {
        ownerName: listing.ownerName || "",
        ownerEmail: listing.ownerEmail || "",
        ownerPhone: listing.ownerPhone || "",
        propertyType: listing.propertyType || "Apartamento",
        title: listing.title || "",
        description: listing.description || "",
        address: listing.address || "",
        city: listing.city || "",
        neighborhood: listing.neighborhood || "",
        price: listing.price ? String(listing.price) : "",
        priceCurrency: listing.priceCurrency === "USD" ? "USD" : "COP",
        adminFee: listing.adminFee ? String(listing.adminFee) : "",
        adminFeeCurrency: listing.adminFeeCurrency === "USD" ? "USD" : "COP",
        bedrooms: listing.bedrooms ? String(listing.bedrooms) : "",
        bathrooms: listing.bathrooms ? String(listing.bathrooms) : "",
        garages: listing.garages ? String(listing.garages) : "",
        area: listing.area ? String(listing.area) : "",
        stratum: listing.stratum ? String(listing.stratum) : "",
        floor: listing.floor ? String(listing.floor) : "",
        year: listing.year ? String(listing.year) : "",
        amenities: listing.amenities || [],
    };
}

export function getSellListingGaps(listing = {}) {
    const gaps = [];
    const add = (field, label, warning = false) => gaps.push({ field, label, warning });

    if (!String(listing.ownerName || "").trim()) add("ownerName", "Nombre del propietario");
    if (!String(listing.ownerEmail || "").trim()) add("ownerEmail", "Correo electrónico");
    if (!String(listing.ownerPhone || "").trim()) add("ownerPhone", "Teléfono / WhatsApp");
    if (!String(listing.title || "").trim()) add("title", "Título del aviso");
    if (!String(listing.description || "").trim()) add("description", "Descripción");
    else if (String(listing.description).trim().length < 40) add("description", "Descripción muy corta", true);
    if (!String(listing.address || "").trim()) add("address", "Dirección");
    if (!String(listing.neighborhood || "").trim()) add("neighborhood", "Barrio");
    if (!String(listing.city || "").trim()) add("city", "Ciudad");
    if (!Number(listing.price) || Number(listing.price) <= 0) add("price", "Precio de venta");
    if (!listing.photos?.length) add("photos", "Fotografías (mínimo 1)");
    else if (listing.photos.length < 3) add("photos", "Pocas fotografías (recomendado 3 o más)", true);

    return gaps;
}

export function formatListingCurrency(amount, currency = "COP") {
    return formatSellCurrencyDisplay(amount, currency === "USD" ? "USD" : "COP") || "—";
}

export function isFieldMissing(fieldName, gaps = []) {
    return gaps.some((gap) => gap.field === fieldName && !gap.warning);
}
