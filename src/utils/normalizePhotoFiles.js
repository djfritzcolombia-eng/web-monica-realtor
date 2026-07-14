/** Tamaño máximo de un archivo de origen (antes de comprimir). */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
/** Límite de salida tras comprimir (Firebase Storage). */
export const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.82;

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

function looksLikeImage(file) {
    if (!file || !(file.size > 0)) return false;
    if (file.type?.startsWith("image/")) return true;
    if (file.type === "application/octet-stream" || file.type === "") return true;
    if (/\.(jpe?g|png|webp|gif|heic|heif|bmp|jfif)$/i.test(String(file.name || ""))) return true;
    // iOS / Android a veces entregan blob sin nombre ni MIME
    if (!file.type && !file.name) return true;
    return false;
}

export function isImageCandidate(file) {
    if (!looksLikeImage(file)) return false;
    if (file.size > MAX_SOURCE_BYTES) return false;
    return true;
}

function baseName(file, index) {
    const raw = String(file?.name || `foto-${Date.now()}-${index + 1}`)
        .replace(/\.[^.]+$/, "")
        .replace(/[^\w.-]+/g, "-")
        .slice(0, 60);
    return raw || `foto-${index + 1}`;
}

function loadImageFromFile(file) {
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("decode_failed"));
        };
        img.src = objectUrl;
    });
}

async function canvasToJpegBlob(canvas, quality) {
    if (canvas.toBlob) {
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", quality);
        });
        if (blob) return blob;
    }
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const res = await fetch(dataUrl);
    return res.blob();
}

/**
 * Redimensiona y convierte a JPEG. Funciona en Safari iOS (incluye HEIC
 * cuando el navegador puede decodificarlo) y en Android (JPEG/WebP/PNG).
 */
async function compressToJpeg(file, index) {
    let bitmap = null;
    let img = null;
    let width;
    let height;

    try {
        if (typeof createImageBitmap === "function") {
            bitmap = await createImageBitmap(file);
            width = bitmap.width;
            height = bitmap.height;
        }
    } catch {
        bitmap = null;
    }

    if (!bitmap) {
        img = await loadImageFromFile(file);
        width = img.naturalWidth || img.width;
        height = img.naturalHeight || img.height;
    }

    if (!width || !height) {
        throw new Error("decode_failed");
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("canvas_unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    if (bitmap) {
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        bitmap.close?.();
    } else {
        ctx.drawImage(img, 0, 0, targetW, targetH);
    }

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpegBlob(canvas, quality);
    while (blob && blob.size > MAX_OUTPUT_BYTES && quality > 0.45) {
        quality -= 0.12;
        blob = await canvasToJpegBlob(canvas, quality);
    }

    if (!blob || blob.size === 0) {
        throw new Error("encode_failed");
    }
    if (blob.size > MAX_OUTPUT_BYTES) {
        throw new Error("still_too_large");
    }

    return new File([blob], `${baseName(file, index)}.jpg`, {
        type: "image/jpeg",
        lastModified: file.lastModified || Date.now(),
    });
}

async function fallbackKeepAsImage(file, index) {
    const contentType = resolveImageContentType(file);
    if (file.size > MAX_OUTPUT_BYTES) {
        throw new Error("too_large");
    }
    const extension = contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
            ? "webp"
            : contentType === "image/heic"
                ? "heic"
                : contentType === "image/heif"
                    ? "heif"
                    : "jpg";
    const name = `${baseName(file, index)}.${extension}`;
    if (file.type === contentType && String(file.name || "").includes(".")) {
        return file;
    }
    const buffer = await file.arrayBuffer();
    return new File([buffer], name, {
        type: contentType,
        lastModified: file.lastModified || Date.now(),
    });
}

/**
 * @returns {{ files: File[], errors: Array<{ name: string, reason: string }> }}
 */
export async function normalizePhotoFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const files = [];
    const errors = [];

    for (let index = 0; index < incoming.length; index += 1) {
        const file = incoming[index];
        const label = file?.name || `Foto ${index + 1}`;

        if (!file || !(file.size > 0)) {
            errors.push({ name: label, reason: "empty" });
            continue;
        }
        if (file.size > MAX_SOURCE_BYTES) {
            errors.push({ name: label, reason: "too_large" });
            continue;
        }
        if (!looksLikeImage(file)) {
            errors.push({ name: label, reason: "not_image" });
            continue;
        }

        try {
            const prepared = await compressToJpeg(file, index);
            files.push(prepared);
        } catch (err) {
            try {
                // Si el navegador no pudo decodificar (p. ej. HEIC en Android),
                // intentamos conservar el original si cabe en Storage.
                const kept = await fallbackKeepAsImage(file, index);
                files.push(kept);
            } catch {
                errors.push({
                    name: label,
                    reason: err?.message || "process_failed",
                });
            }
        }
    }

    return { files, errors };
}

export function formatPhotoNormalizeError(errors, hadIncoming) {
    if (!hadIncoming) {
        return "No se seleccionó ninguna foto. Elige imágenes desde tu galería o toma una foto.";
    }
    if (!errors?.length) {
        return "No se pudieron procesar las fotos. Intenta de nuevo.";
    }

    const tooLarge = errors.some((e) => e.reason === "too_large" || e.reason === "still_too_large");
    const decode = errors.some((e) => e.reason === "decode_failed" || e.reason === "process_failed");
    const notImage = errors.some((e) => e.reason === "not_image");

    if (tooLarge && errors.length === 1) {
        return "Una foto es demasiado pesada. Prueba tomar otra o elegir una versión más liviana (hasta ~40 MB).";
    }
    if (tooLarge) {
        return "Algunas fotos son demasiado pesadas y no se pudieron optimizar. Intenta con menos fotos o menor resolución.";
    }
    if (decode) {
        return "No se pudieron leer algunas fotos del celular. Elige JPG/PNG desde la galería o vuelve a tomar la foto con la cámara de la app.";
    }
    if (notImage) {
        return "Algunos archivos no son imágenes válidas. Usa fotos JPG, PNG o HEIC.";
    }
    return "No se pudieron procesar las fotos seleccionadas. Intenta de nuevo desde la galería o la cámara.";
}
