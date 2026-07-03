const norm = (value = "") => String(value).trim();

export function buildPropertyMapQuery({ address, zone, city } = {}) {
    const parts = [norm(address), norm(zone), norm(city), "Antioquia", "Colombia"]
        .filter(Boolean);
    if (!parts.length) return "";
    return parts.join(", ");
}

export function buildGoogleMapsEmbedUrl(query) {
    if (!query) return "";
    const params = new URLSearchParams({
        q: query,
        hl: "es",
        z: "16",
        output: "embed",
    });
    return `https://maps.google.com/maps?${params.toString()}`;
}

export function buildGoogleMapsSearchUrl(query) {
    if (!query) return "";
    const params = new URLSearchParams({
        api: "1",
        query,
    });
    return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function buildGoogleMapsDirectionsUrl(query) {
    if (!query) return "";
    const params = new URLSearchParams({
        api: "1",
        destination: query,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
}
