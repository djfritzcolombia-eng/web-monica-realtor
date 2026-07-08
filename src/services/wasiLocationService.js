const BASE_URL = "https://api.wasi.co/v1";
const CACHE_KEY = "wasi_oriente_cities_v1";
const ANTIOQUIA_REGION_ID = "2";

const ORIENTE_HINTS = [
    "rionegro", "la ceja", "el retiro", "retiro", "carmen de viboral", "marinilla",
    "guarne", "santuario", "la union", "guatape", "penol", "peñol", "san vicente",
    "san pedro", "san antonio", "alejandria", "sonson", "cocorna", "san carlos",
    "san rafael", "san luis", "granada", "argelia", "abejorral", "la pintada",
    "san francisco", "caldas", "montebello", "el santuario", "san pedro de los milagros",
    "san antonio de pereira", "san pedro de los milagros", "el penol", "el peñol",
];

const norm = (s = "") =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function extractNumericEntries(payload) {
    return Object.keys(payload || {})
        .filter((k) => /^\d+$/.test(k))
        .map((k) => payload[k]);
}

function isOrienteMunicipality(name = "") {
    const value = norm(name);
    return ORIENTE_HINTS.some((hint) => value.includes(hint) || hint.includes(value));
}

function mapCityEntry(city) {
    const label = city.name || city.city || "";
    const id_city = String(city.id_city || city.city_id || "");
    return {
        key: norm(label).replace(/\s+/g, "-"),
        label,
        id_city,
        quantity: Number(city.quantity || city.total || 0),
    };
}

/** Fallback when Wasi location API is unavailable (Antioquia Oriente municipalities). */
export const ORIENTE_FALLBACK_CITIES = [
    { key: "rionegro", label: "Rionegro", id_city: "707" },
    { key: "la-ceja", label: "La Ceja", id_city: "438" },
    { key: "el-retiro", label: "El Retiro", id_city: "286" },
    { key: "carmen-de-viboral", label: "Carmen de Viboral", id_city: "175" },
    { key: "marinilla", label: "Marinilla", id_city: "479" },
    { key: "guarne", label: "Guarne", id_city: "334" },
    { key: "el-santuario", label: "El Santuario", id_city: "676" },
    { key: "la-union", label: "La Unión", id_city: "441" },
    { key: "guatape", label: "Guatapé", id_city: "335" },
    { key: "el-penol", label: "El Peñol", id_city: "285" },
    { key: "san-vicente", label: "San Vicente", id_city: "719" },
    { key: "san-antonio-de-pereira", label: "San Antonio de Pereira", id_city: "717" },
    { key: "san-carlos", label: "San Carlos", id_city: "720" },
    { key: "san-rafael", label: "San Rafael", id_city: "722" },
    { key: "san-luis", label: "San Luis", id_city: "721" },
    { key: "granada", label: "Granada", id_city: "328" },
    { key: "alejandria", label: "Alejandría", id_city: "14" },
    { key: "sonson", label: "Sonson", id_city: "745" },
    { key: "cocorna", label: "Cocorná", id_city: "198" },
    { key: "argelia", label: "Argelia", id_city: "38" },
    { key: "abejorral", label: "Abejorral", id_city: "1" },
    { key: "la-pintada", label: "La Pintada", id_city: "439" },
    { key: "san-francisco", label: "San Francisco", id_city: "723" },
    { key: "caldas", label: "Caldas", id_city: "163" },
    { key: "montebello", label: "Montebello", id_city: "492" },
];

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
        return ORIENTE_FALLBACK_CITIES;
    }

    try {
        const qs = new URLSearchParams({
            id_company: companyId,
            wasi_token: token,
            quantity: "true",
            for_sale: "true",
        });
        const res = await fetch(`${BASE_URL}/location/cities-from-region/${ANTIOQUIA_REGION_ID}?${qs}`);
        const payload = await res.json();
        const cities = extractNumericEntries(payload)
            .filter((city) => isOrienteMunicipality(city.name || city.city))
            .map(mapCityEntry)
            .filter((city) => city.id_city && city.label);

        cities.sort((a, b) => a.label.localeCompare(b.label, "es"));

        if (cities.length > 0) {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cities));
            return cities;
        }
    } catch {
        // fall through
    }

    return ORIENTE_FALLBACK_CITIES;
}

export function labelForOrienteCityId(cities, id) {
    const match = cities.find((city) => city.id_city === String(id));
    return match?.label || String(id);
}
