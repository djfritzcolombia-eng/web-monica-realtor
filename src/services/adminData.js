import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
    formatUbicacion,
    sortEventsChronologically,
} from "../utils/adminLabels";

export { formatUbicacion };

export function formatFirestoreDate(value) {
    if (!value) return "—";
    if (typeof value?.toDate === "function") {
        return value.toDate().toLocaleString("es-CO");
    }
    if (typeof value === "string") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
    }
    return String(value);
}

export async function fetchSessions(max = 80) {
    const q = query(
        collection(db, "sessions"),
        orderBy("startedAt", "desc"),
        limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchSessionById(sessionId) {
    const ref = doc(db, "sessions", sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function fetchSessionEvents(sessionId, max = 200) {
    const q = query(
        collection(db, "sessions", sessionId, "events"),
        orderBy("sequence", "asc"),
        limit(max)
    );
    const snap = await getDocs(q);
    return sortEventsChronologically(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );
}
