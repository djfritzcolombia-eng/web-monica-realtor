import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    limit,
} from "firebase/firestore";
import {
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";
import { db, storage } from "../config/firebase";

export const SELL_LISTING_STATUSES = {
    pending: "pending",
    needs_revision: "needs_revision",
    approved: "approved",
    published: "published",
    rejected: "rejected",
};

export const SELL_STATUS_LABELS = {
    pending: "Pendiente de revisión",
    needs_revision: "Requiere correcciones",
    approved: "Aprobado",
    published: "Publicado",
    rejected: "Rechazado",
};

const COLLECTION = "sell_listings";

function sanitizeListingPayload(data) {
    return {
        ownerName: String(data.ownerName || "").trim(),
        ownerEmail: String(data.ownerEmail || "").trim(),
        ownerPhone: String(data.ownerPhone || "").trim(),
        propertyType: String(data.propertyType || "").trim(),
        title: String(data.title || "").trim(),
        description: String(data.description || "").trim(),
        address: String(data.address || "").trim(),
        city: String(data.city || "").trim(),
        neighborhood: String(data.neighborhood || "").trim(),
        price: Number(data.price) || 0,
        adminFee: Number(data.adminFee) || 0,
        bedrooms: Number(data.bedrooms) || 0,
        bathrooms: Number(data.bathrooms) || 0,
        garages: Number(data.garages) || 0,
        area: Number(data.area) || 0,
        stratum: Number(data.stratum) || 0,
        floor: Number(data.floor) || 0,
        year: Number(data.year) || 0,
        amenities: Array.isArray(data.amenities)
            ? data.amenities.map((item) => String(item).trim()).filter(Boolean)
            : [],
    };
}

export async function uploadSellListingPhotos(listingId, files) {
    const uploads = [];

    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!file?.type?.startsWith("image/")) continue;

        const safeName = String(file.name || `foto-${index + 1}`)
            .replace(/[^\w.-]+/g, "-")
            .slice(0, 80);
        const storagePath = `sell_listings/${listingId}/${Date.now()}-${index}-${safeName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file, {
            contentType: file.type,
        });

        const url = await getDownloadURL(storageRef);
        uploads.push({
            url,
            storagePath,
            order: index,
            name: file.name,
        });
    }

    return uploads;
}

export async function submitSellListing(formData, photoFiles = []) {
    const payload = sanitizeListingPayload(formData);

    if (!payload.ownerName || !payload.ownerEmail || !payload.ownerPhone) {
        throw new Error("Completa nombre, correo y teléfono de contacto.");
    }
    if (!payload.title || !payload.address || !payload.city) {
        throw new Error("Completa título, dirección y ciudad del inmueble.");
    }
    if (!payload.price || payload.price <= 0) {
        throw new Error("Indica un precio de venta válido.");
    }
    if (!photoFiles.length) {
        throw new Error("Agrega al menos una foto del inmueble.");
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
        ...payload,
        status: SELL_LISTING_STATUSES.pending,
        photos: [],
        adminNotes: "",
        revisionNotes: "",
        reviewedAt: null,
        reviewedBy: "",
        publishedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    const photos = await uploadSellListingPhotos(docRef.id, photoFiles);

    await updateDoc(docRef, {
        photos,
        updatedAt: serverTimestamp(),
    });

    return { id: docRef.id, photos };
}

export async function fetchSellListingById(listingId) {
    const snap = await getDoc(doc(db, COLLECTION, listingId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function fetchSellListings(max = 100) {
    const q = query(
        collection(db, COLLECTION),
        orderBy("createdAt", "desc"),
        limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateSellListingReview(listingId, update, adminUser = "") {
    const payload = {
        ...update,
        updatedAt: serverTimestamp(),
    };

    if (update.status === SELL_LISTING_STATUSES.approved
        || update.status === SELL_LISTING_STATUSES.published
        || update.status === SELL_LISTING_STATUSES.needs_revision
        || update.status === SELL_LISTING_STATUSES.rejected) {
        payload.reviewedAt = serverTimestamp();
        payload.reviewedBy = adminUser || "";
    }

    if (update.status === SELL_LISTING_STATUSES.published) {
        payload.publishedAt = serverTimestamp();
    }

    await updateDoc(doc(db, COLLECTION, listingId), payload);
}

export async function resubmitSellListing(listingId, formData, photoFiles = [], existingPhotos = []) {
    const payload = sanitizeListingPayload(formData);
    const listing = await fetchSellListingById(listingId);

    if (!listing) {
        throw new Error("No encontramos tu solicitud.");
    }
    if (listing.status !== SELL_LISTING_STATUSES.needs_revision) {
        throw new Error("Esta solicitud no está disponible para correcciones.");
    }

    let photos = existingPhotos;
    if (photoFiles.length) {
        const uploaded = await uploadSellListingPhotos(listingId, photoFiles);
        photos = [...existingPhotos, ...uploaded];
    }

    if (!photos.length) {
        throw new Error("Agrega al menos una foto del inmueble.");
    }

    await updateDoc(doc(db, COLLECTION, listingId), {
        ...payload,
        photos,
        status: SELL_LISTING_STATUSES.pending,
        revisionNotes: "",
        updatedAt: serverTimestamp(),
    });

    return { id: listingId, photos };
}
