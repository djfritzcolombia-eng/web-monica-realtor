import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
    createPropertySnapshot,
    generateCatalogSlug,
    MAX_CATALOG_PROPERTIES,
} from "../utils/propertyCatalog";

export async function createPropertyCatalog({
    clientName = "",
    properties = [],
    createdBy = "",
    note = "",
}) {
    if (!properties.length) {
        throw new Error("Selecciona al menos una propiedad.");
    }
    if (properties.length > MAX_CATALOG_PROPERTIES) {
        throw new Error(`Puedes incluir hasta ${MAX_CATALOG_PROPERTIES} propiedades por catálogo.`);
    }

    const snapshots = properties.map(createPropertySnapshot);
    let slug = generateCatalogSlug();
    let saved = false;

    for (let attempt = 0; attempt < 6; attempt += 1) {
        const ref = doc(db, "property_catalogs", slug);
        const existing = await getDoc(ref);
        if (existing.exists()) {
            slug = generateCatalogSlug();
            continue;
        }

        await setDoc(ref, {
            slug,
            clientName: String(clientName || "").trim(),
            note: String(note || "").trim(),
            properties: snapshots,
            propertyIds: snapshots.map((item) => item.id),
            propertyCount: snapshots.length,
            createdBy: String(createdBy || "admin"),
            status: "active",
            createdAt: serverTimestamp(),
        });
        saved = true;
        break;
    }

    if (!saved) {
        throw new Error("No se pudo generar un enlace único. Intenta de nuevo.");
    }

    return { slug };
}

export async function fetchCatalogBySlug(slug) {
    const normalized = String(slug || "").trim();
    if (!normalized) return null;

    const direct = await getDoc(doc(db, "property_catalogs", normalized));
    if (direct.exists()) {
        return { id: direct.id, ...direct.data() };
    }

    const snapshot = await getDocs(
        query(
            collection(db, "property_catalogs"),
            where("slug", "==", normalized),
            limit(1)
        )
    );
    if (snapshot.empty) return null;
    const item = snapshot.docs[0];
    return { id: item.id, ...item.data() };
}

export async function fetchPropertyCatalogs(max = 50) {
    const snapshot = await getDocs(
        query(collection(db, "property_catalogs"), orderBy("createdAt", "desc"), limit(max))
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
