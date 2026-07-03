import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    limit,
} from "firebase/firestore";
import {
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";
import { db, storage } from "../config/firebase";
import { MONICA_REALTOR_STORE } from "../constants/monicaRealtorStore";

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

const { collection: STORE_COLLECTION, legacyCollection: LEGACY_COLLECTION, storageRoot: STORAGE_ROOT } = MONICA_REALTOR_STORE;

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

function withStoreMetadata(payload) {
    return {
        ...payload,
        storeId: MONICA_REALTOR_STORE.id,
        storeName: MONICA_REALTOR_STORE.name,
        source: "vender",
    };
}

function mapListingDoc(snap, collectionName) {
    return {
        id: snap.id,
        ...snap.data(),
        _collection: collectionName,
    };
}

async function ensureMonicaRealtorStore() {
    const [configId, configParent] = MONICA_REALTOR_STORE.configDocPath.split("/");
    await setDoc(
        doc(db, configParent, configId),
        {
            storeId: MONICA_REALTOR_STORE.id,
            name: MONICA_REALTOR_STORE.name,
            description: "Solicitudes de propietarios desde la página Vender",
            active: true,
            version: 1,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

async function resolveListingRef(listingId) {
    const primaryRef = doc(db, STORE_COLLECTION, listingId);
    const primarySnap = await getDoc(primaryRef);
    if (primarySnap.exists()) {
        return { ref: primaryRef, snap: primarySnap, collectionName: STORE_COLLECTION };
    }

    const legacyRef = doc(db, LEGACY_COLLECTION, listingId);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
        return { ref: legacyRef, snap: legacySnap, collectionName: LEGACY_COLLECTION };
    }

    return null;
}

export async function uploadSellListingPhotos(listingId, files, storageRoot = STORAGE_ROOT) {
    const uploads = [];

    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!file?.type?.startsWith("image/")) continue;

        const safeName = String(file.name || `foto-${index + 1}`)
            .replace(/[^\w.-]+/g, "-")
            .slice(0, 80);
        const storagePath = `${storageRoot}/${listingId}/${Date.now()}-${index}-${safeName}`;
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

    await ensureMonicaRealtorStore();

    const docRef = await addDoc(collection(db, STORE_COLLECTION), {
        ...withStoreMetadata(payload),
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

    const photos = await uploadSellListingPhotos(docRef.id, photoFiles, STORAGE_ROOT);

    await updateDoc(docRef, {
        photos,
        updatedAt: serverTimestamp(),
    });

    return { id: docRef.id, photos, storeName: MONICA_REALTOR_STORE.name };
}

export async function fetchSellListingById(listingId) {
    const resolved = await resolveListingRef(listingId);
    if (!resolved) return null;
    return mapListingDoc(resolved.snap, resolved.collectionName);
}

export async function fetchSellListings(max = 100) {
    const [primarySnap, legacySnap] = await Promise.all([
        getDocs(query(
            collection(db, STORE_COLLECTION),
            orderBy("createdAt", "desc"),
            limit(max)
        )),
        getDocs(query(
            collection(db, LEGACY_COLLECTION),
            orderBy("createdAt", "desc"),
            limit(max)
        )),
    ]);

    const merged = new Map();

    legacySnap.docs.forEach((item) => {
        merged.set(item.id, mapListingDoc(item, LEGACY_COLLECTION));
    });
    primarySnap.docs.forEach((item) => {
        merged.set(item.id, mapListingDoc(item, STORE_COLLECTION));
    });

    return [...merged.values()].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
    });
}

export async function updateSellListingReview(listingId, update, adminUser = "") {
    const resolved = await resolveListingRef(listingId);
    if (!resolved) {
        throw new Error("No encontramos la solicitud.");
    }

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

    await updateDoc(resolved.ref, payload);
}

export async function resubmitSellListing(listingId, formData, photoFiles = [], existingPhotos = []) {
    const payload = sanitizeListingPayload(formData);
    const resolved = await resolveListingRef(listingId);

    if (!resolved) {
        throw new Error("No encontramos tu solicitud.");
    }

    const listing = mapListingDoc(resolved.snap, resolved.collectionName);

    if (listing.status !== SELL_LISTING_STATUSES.needs_revision) {
        throw new Error("Esta solicitud no está disponible para correcciones.");
    }

    const storageRoot = resolved.collectionName === LEGACY_COLLECTION
        ? MONICA_REALTOR_STORE.legacyStorageRoot
        : STORAGE_ROOT;

    let photos = existingPhotos;
    if (photoFiles.length) {
        const uploaded = await uploadSellListingPhotos(listingId, photoFiles, storageRoot);
        photos = [...existingPhotos, ...uploaded];
    }

    if (!photos.length) {
        throw new Error("Agrega al menos una foto del inmueble.");
    }

    await updateDoc(resolved.ref, {
        ...withStoreMetadata(payload),
        photos,
        status: SELL_LISTING_STATUSES.pending,
        revisionNotes: "",
        updatedAt: serverTimestamp(),
    });

    return { id: listingId, photos };
}
