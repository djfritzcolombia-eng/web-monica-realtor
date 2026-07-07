function resolveImageContentType(file) {
    if (file?.type?.startsWith("image/")) return file.type;
    const name = String(file?.name || "").toLowerCase();
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    if (name.endsWith(".gif")) return "image/gif";
    if (name.endsWith(".heic")) return "image/heic";
    if (name.endsWith(".heif")) return "image/heif";
    if (name.endsWith(".bmp")) return "image/bmp";
    return "image/jpeg";
}

export function isImageCandidate(file) {
    if (!file || !file.size) return false;
    if (file.size > 10 * 1024 * 1024) return false;
    if (file.type?.startsWith("image/")) return true;
    if (file.type === "application/octet-stream") return true;
    if (/\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(String(file.name || ""))) return true;
    // iOS galería: a veces sin tipo ni extensión
    if (!file.type && file.size > 0) return true;
    return false;
}

export async function normalizePhotoFiles(fileList) {
    const files = Array.from(fileList || []);
    const normalized = [];

    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!isImageCandidate(file)) continue;

        const contentType = resolveImageContentType(file);
        const extension = contentType === "image/png"
            ? "png"
            : contentType === "image/webp"
                ? "webp"
                : contentType === "image/heic"
                    ? "heic"
                    : "jpg";
        const safeName = String(file.name || `foto-${Date.now()}-${index + 1}.${extension}`)
            .replace(/[^\w.-]+/g, "-")
            .slice(0, 80);

        if (!file.type || file.type === "application/octet-stream" || !safeName.includes(".")) {
            const buffer = await file.arrayBuffer();
            normalized.push(new File([buffer], safeName.includes(".") ? safeName : `${safeName}.${extension}`, {
                type: contentType,
                lastModified: file.lastModified || Date.now(),
            }));
        } else {
            normalized.push(file);
        }
    }

    return normalized;
}
