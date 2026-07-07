import { MEDELLIN_CITY_ID } from "../constants/searchZones";
import { postRequest } from "./api";
import { fetchPublishedSellListings } from "./sellListingService";
import { mapPublishedListingsForScope } from "../utils/sellListingInventory";
import { dedupeWasiItems } from "../utils/wasiAggregateFetch";
import { extractWasiArray, mapWasiItem } from "../utils/wasiPropertyMapper";

const DEFAULT_PER_PAGE = 60;

async function fetchSearchPage(basePayload, page = 1, perPage = DEFAULT_PER_PAGE) {
    const result = await postRequest("searchWasiProperties", {
        ...basePayload,
        page,
        per_page: perPage,
    });
    if (!result?.success) {
        throw new Error(result?.error || "No se pudieron cargar las propiedades.");
    }
    return extractWasiArray(result.data).map(mapWasiItem).filter(Boolean);
}

export async function searchSiteInventory({ cityIds = [], zones = [] } = {}) {
    let aggregated = [];

    if (zones.length > 0 && cityIds.length > 0) {
        const zoneCalls = zones.map((id_zone) =>
            fetchSearchPage({ id_city: MEDELLIN_CITY_ID, id_zone })
        );
        const cityCalls = cityIds.map((id_city) =>
            fetchSearchPage({ id_city })
        );
        const results = await Promise.all([...zoneCalls, ...cityCalls]);
        aggregated = results.flat();
    } else if (zones.length > 0) {
        const results = await Promise.all(
            zones.map((id_zone) => fetchSearchPage({ id_city: MEDELLIN_CITY_ID, id_zone }))
        );
        aggregated = results.flat();
    } else if (cityIds.length > 0) {
        const results = await Promise.all(
            cityIds.map((id_city) => fetchSearchPage({ id_city }))
        );
        aggregated = results.flat();
    } else {
        aggregated = await fetchSearchPage({ id_city: MEDELLIN_CITY_ID });
    }

    const scope = { cityIds, zones };
    let merged = dedupeWasiItems(aggregated);
    try {
        const published = await fetchPublishedSellListings();
        const storeItems = mapPublishedListingsForScope(published, scope);
        merged = dedupeWasiItems([...storeItems, ...merged]);
    } catch {
        // El inventario Wasi sigue disponible aunque falle la tienda propia.
    }

    return merged;
}
