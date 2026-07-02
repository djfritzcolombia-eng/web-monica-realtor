/** Agrega y deduplica resultados WASI de múltiples fuentes */
export function dedupeWasiItems(items) {
    const seen = new Set();
    return items.filter((it) => {
        const key = it.id || it.href || it.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function slicePageItems(items, page, perPage) {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
}
