export const SELL_LISTING_STORAGE_KEY = "mf_sell_listing_track";
export const SELL_LISTING_VERIFIED_KEY = "mf_verified_sell_listings";

export const REVISION_CHECKLIST_ITEMS = [
    { id: "photos", label: "Fotografías (calidad o cantidad)", fields: ["photos"] },
    { id: "price", label: "Precio de venta", fields: ["price", "adminFee"] },
    { id: "description", label: "Descripción del inmueble", fields: ["description"] },
    { id: "address", label: "Dirección, barrio o ciudad", fields: ["address", "neighborhood", "city"] },
    { id: "contact", label: "Datos de contacto", fields: ["ownerName", "ownerEmail", "ownerPhone"] },
    { id: "title", label: "Título del aviso", fields: ["title"] },
    { id: "property_details", label: "Detalles del inmueble", fields: ["propertyType", "bedrooms", "bathrooms", "garages", "area", "stratum", "floor", "year", "amenities"] },
];

export function getHighlightedFields(revisionChecklist = []) {
    const ids = new Set(Array.isArray(revisionChecklist) ? revisionChecklist : []);
    const fields = new Set();
    REVISION_CHECKLIST_ITEMS.forEach((item) => {
        if (ids.has(item.id)) {
            item.fields.forEach((field) => fields.add(field));
        }
    });
    return fields;
}

export function getRevisionLabels(revisionChecklist = []) {
    const ids = new Set(Array.isArray(revisionChecklist) ? revisionChecklist : []);
    return REVISION_CHECKLIST_ITEMS.filter((item) => ids.has(item.id)).map((item) => item.label);
}

export function fieldNeedsHighlight(fieldName, highlightedFields) {
    return highlightedFields?.has?.(fieldName);
}

export function fieldsetNeedsHighlight(fieldNames, highlightedFields) {
    return fieldNames.some((name) => highlightedFields?.has?.(name));
}
