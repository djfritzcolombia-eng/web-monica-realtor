import {
    CITY_ID_BY_GROUP,
    CREDIT_SEARCH_ZONES,
    MEDELLIN_CITY_ID,
} from "../constants/searchZones";
import { formatSellCurrencyDisplay } from "./sellListingCurrency";

const norm = (s = "") =>
    String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const ORIENTE_HINTS = ["oriente", "rionegro", "marinilla", "guarne", "retiro", "la ceja", "el retiro"];
const OCCIDENTE_HINTS = ["occidente", "belen", "laureles", "estadio", "america", "américa", "floresta"];

export function inferSearchGroupKeys(listing = {}) {
    const haystack = norm([
        listing.neighborhood,
        listing.city,
        listing.title,
        listing.address,
    ].join(" "));
    const city = norm(listing.city);
    const keys = new Set();

    if (haystack.includes("poblado")) keys.add("el poblado");
    if (haystack.includes("envigado")) keys.add("envigado");
    if (haystack.includes("itagui") || haystack.includes("itagüi")) keys.add("itagui");
    if (haystack.includes("sabaneta")) keys.add("sabaneta");
    if (haystack.includes("bello")) keys.add("bello");
    if (haystack.includes("la estrella") || (haystack.includes("estrella") && !haystack.includes("sabaneta"))) {
        keys.add("la estrella");
    }
    if (ORIENTE_HINTS.some((hint) => haystack.includes(hint))) keys.add("oriente");
    if (OCCIDENTE_HINTS.some((hint) => haystack.includes(hint))) keys.add("occidente");

    CREDIT_SEARCH_ZONES.forEach(({ key, label }) => {
        const labelNorm = norm(label);
        if (city && (city.includes(labelNorm) || labelNorm.includes(city))) {
            keys.add(key);
        }
    });

    if (keys.size === 0 && city.includes("medellin")) {
        keys.add("occidente");
        keys.add("oriente");
    }

    return [...keys];
}

export function mapSellListingToProperty(listing) {
    const photos = Array.isArray(listing.photos) ? listing.photos : [];
    const image = photos[0]?.url || null;
    const allImages = photos.map((photo) => photo?.url).filter(Boolean);
    const searchGroupKeys = listing.searchGroupKeys?.length
        ? listing.searchGroupKeys
        : inferSearchGroupKeys(listing);

    return {
        id: listing.inventoryId || `store-${listing.id}`,
        sellListingId: listing.id,
        source: "monica_store",
        title: listing.title || "",
        propertyType: listing.propertyType || "",
        operationType: "venta",
        salePrice: Number(listing.price) || null,
        rentPrice: null,
        priceLabel: formatSellCurrencyDisplay(listing.price, listing.priceCurrency) || "",
        areaValue: listing.area || "",
        areaUnit: listing.area ? "m²" : "",
        bedrooms: listing.bedrooms || "",
        bathrooms: listing.bathrooms || "",
        garages: listing.garages || "",
        address: listing.address || "",
        zone: listing.neighborhood || "",
        city: listing.city || "",
        stratum: listing.stratum || "",
        floor: listing.floor || "",
        condition: "",
        year: listing.year || "",
        adminFeeLabel: listing.adminFee
            ? formatSellCurrencyDisplay(listing.adminFee, listing.adminFeeCurrency)
            : "",
        agent: "",
        image,
        href: "",
        featuresInt: Array.isArray(listing.amenities) ? listing.amenities : [],
        featuresExt: [],
        galleries: [],
        allImages,
        searchGroupKeys,
        description: listing.description || "",
    };
}

function propertyCityIds(property) {
    const keys = property.searchGroupKeys || [];
    return [...new Set(keys.map((key) => CITY_ID_BY_GROUP[key]).filter(Boolean).map(String))];
}

export function listingMatchesSearchScope(property, { cityIds = [], zones = [] } = {}) {
    const keys = property.searchGroupKeys || [];
    const propertyCities = propertyCityIds(property);

    if (zones.length > 0 && cityIds.length > 0) {
        const matchesPoblado = keys.includes("el poblado");
        const matchesCity = cityIds.some((id) => propertyCities.includes(String(id)));
        return matchesPoblado || matchesCity;
    }

    if (zones.length > 0) {
        return keys.includes("el poblado");
    }

    if (cityIds.length > 0) {
        return cityIds.some((id) => propertyCities.includes(String(id)));
    }

    return propertyCities.includes(MEDELLIN_CITY_ID) || keys.length > 0;
}

export function mapPublishedListingsForScope(listings = [], scope = {}) {
    return listings
        .map(mapSellListingToProperty)
        .filter((property) => listingMatchesSearchScope(property, scope));
}
