export function extractWasiArray(data) {
    if (!data) return [];
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    if (data?.data && typeof data.data === "object") {
        return Object.values(data.data).filter((v) => v && typeof v === "object");
    }
    if (data && typeof data === "object") {
        return Object.values(data).filter((v) => v && typeof v === "object");
    }
    return [];
}

export function mapWasiItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    const mainImg = raw?.main_image || {};
    const image = mainImg.url_big || mainImg.url || mainImg.url_original || null;
    const galleriesImages = [];
    if (raw?.galleries && Array.isArray(raw.galleries)) {
        raw.galleries.forEach((gallery) => {
            if (gallery && typeof gallery === "object") {
                Object.values(gallery).forEach((img) => {
                    if (img && (img.url_big || img.url || img.url_original)) {
                        galleriesImages.push({
                            url: img.url_big || img.url || img.url_original,
                            id: img.id,
                            description: img.description || "",
                            position: img.position || 0,
                        });
                    }
                });
            }
        });
    }
    const featuresInt = Array.isArray(raw?.features?.internal)
        ? raw.features.internal.map((f) => f?.nombre || f?.name).filter(Boolean)
        : [];
    const featuresExt = Array.isArray(raw?.features?.external)
        ? raw.features.external.map((f) => f?.nombre || f?.name).filter(Boolean)
        : [];
    const agent = [raw?.user_data?.first_name, raw?.user_data?.last_name]
        .filter(Boolean)
        .join(" ");
    const salePrice = Number(raw.sale_price) || null;
    const rentPrice = Number(raw.rent_price) || null;
    const operationType = raw.for_sale && raw.for_rent
        ? "venta_arriendo"
        : raw.for_sale || salePrice
            ? "venta"
            : raw.for_rent || rentPrice
                ? "arriendo"
                : raw.sale_price_label
                    ? "venta"
                    : raw.rent_price_label
                        ? "arriendo"
                        : null;
    return {
        id: raw.id_property || raw.id,
        source: "wasi",
        title: raw.title || "",
        propertyType:
            raw.property_type_label ||
            raw.id_property_type_label ||
            raw.type_label ||
            raw.property_label ||
            "",
        operationType,
        salePrice,
        rentPrice,
        priceLabel: raw.sale_price_label || raw.rent_price_label || "",
        areaValue: raw.area || raw.built_area || raw.private_area || "",
        areaUnit:
            raw.unit_area_label ||
            raw.unit_built_area_label ||
            raw.unit_private_area_label ||
            "",
        bedrooms: raw.bedrooms || "",
        bathrooms: raw.bathrooms || "",
        garages: raw.garages || "",
        address: raw.address || "",
        zone: raw.zone_label || "",
        city: raw.city_label || "",
        stratum: raw.stratum || "",
        floor: raw.floor || "",
        condition: raw.property_condition_label || "",
        year: raw.building_date || "",
        adminFeeLabel: raw.maintenance_fee_label || "",
        agent,
        image,
        href: raw.link || "",
        featuresInt,
        featuresExt,
        galleries: raw.galleries || [],
        allImages: [image, ...galleriesImages.map((img) => img.url)].filter(Boolean),
    };
}
