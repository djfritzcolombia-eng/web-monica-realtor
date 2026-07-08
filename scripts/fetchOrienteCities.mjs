/**
 * One-off helper: lists Oriente Antioqueño municipalities from Wasi (Antioquia region id=2).
 * Run: node --env-file=.env scripts/fetchOrienteCities.mjs
 */
const TOKEN = process.env.VITE_WASI_TOKEN;
const COMPANY = process.env.VITE_WASI_COMPANY_ID;
const BASE = "https://api.wasi.co/v1";

const ORIENTE_HINTS = [
    "rionegro", "la ceja", "el retiro", "retiro", "carmen de viboral", "marinilla",
    "guarne", "santuario", "la union", "guatape", "penol", "peñol", "san vicente",
    "san pedro", "san antonio", "alejandria", "sonson", "cocorna", "san carlos",
    "san rafael", "san luis", "granada", "argelia", "abejorral", "la pintada",
    "san francisco", "caldas", "montebello", "el santuario", "san pedro de los milagros",
];

const norm = (s = "") =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function wasiGet(path, extra = {}) {
    const qs = new URLSearchParams({
        id_company: COMPANY,
        wasi_token: TOKEN,
        quantity: "true",
        for_sale: "true",
        ...extra,
    });
    const res = await fetch(`${BASE}${path}?${qs}`);
    return res.json();
}

function extractNumericEntries(payload) {
    return Object.keys(payload || {})
        .filter((k) => /^\d+$/.test(k))
        .map((k) => payload[k]);
}

async function main() {
    if (!TOKEN || !COMPANY) {
        console.error("Missing VITE_WASI_TOKEN or VITE_WASI_COMPANY_ID in .env");
        process.exit(1);
    }

    const region = await wasiGet("/location/cities-from-region/2");
    const cities = extractNumericEntries(region);
    const oriente = cities.filter((c) => {
        const name = norm(c.name || c.city);
        return ORIENTE_HINTS.some((h) => name.includes(h) || h.includes(name));
    });

    oriente.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    console.log(JSON.stringify(
        oriente.map((c) => ({
            key: norm(c.name).replace(/\s+/g, "-"),
            label: c.name,
            id_city: String(c.id_city || c.city_id),
            quantity: Number(c.quantity || c.total || 0),
        })),
        null,
        2,
    ));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
