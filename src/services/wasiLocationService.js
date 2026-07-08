import { ORIENTE_ANTIOQUENO_CITIES } from "../constants/orienteAntioqueno";

const BASE_URL = "https://api.wasi.co/v1";
const CACHE_KEY = "wasi_oriente_cities_v2";
const ANTIOQUIA_REGION_ID = "2";

const norm = (s = "") =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function extractNumericEntries(payload) {
    return Object.keys(payload || {})
        .filter((k) => /^\d+$/.test(k))
        .map((k) => payload[k]);
}

function mapCityEntry(city) {
    const label = city.name || city.city || city.label || "";
    const id_city = String(city.id_city || city.city_id || "");
    return {
        key: norm(label).replace(/\s+/g, "-"),
        label,
        id_city,
        quantity: Number(city.quantity || city.total || 0),
    };
}

export { ORIENTE_ANTIOQUENO_CITIES as ORIENTE_FALLBACK_CITIES };

export async function fetchOrienteAntioquenoCities() {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore
    }

    const token = import.meta.env.VITE_WASI_TOKEN;
    const companyId = import.meta.env.VITE_WASI_COMPANY_ID;
    if (!token || !companyId) {
        return ORIENTE_ANTIOQUENO_CITIES;
    }

    try {
        const qs = new URLSearchParams({
            id_company: companyId,
            wasi_token: token,
            quantity: "true",
            for_sale: "true",
        });
        const res = await fetch(`${BASE_URL}/location/cities-from-region/${ANTIOQUIA_REGION_ID}?${qs}`);
        if (!res.ok) return ORIENTE_ANTIOQUENO_CITIES;

        const payload = await res.json();
        const knownIds = new Set(ORIENTE_ANTIOQUENO_CITIES.map((c) => c.id_city));
        const fromApi = extractNumericEntries(payload)
            .map(mapCityEntry)
            .filter((city) => city.id_city && city.label && knownIds.has(city.id_city));

        const merged = ORIENTE_ANTIOQUENO_CITIES.map((base) => {
            const live = fromApi.find((city) => city.id_city === base.id_city);
            return live ? { ...base, quantity: live.quantity } : base;
        });

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        return merged;
    } catch {
        return ORIENTE_ANTIOQUENO_CITIES;
    }
}

export function labelForOrienteCityId(cities, id) {
    const match = cities.find((city) => city.id_city === String(id));
    return match?.label || String(id);
}
