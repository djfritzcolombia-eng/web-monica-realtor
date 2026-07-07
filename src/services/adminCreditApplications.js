import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export async function fetchCreditApplications() {
    const snapshot = await getDocs(
        query(collection(db, "credit_applications"), orderBy("createdAt", "desc"))
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateCreditApplicationReview(applicationId, { adminStatus, adminNotes }) {
    const payload = { updatedAt: serverTimestamp() };
    if (adminStatus !== undefined) payload.adminStatus = adminStatus;
    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    await updateDoc(doc(db, "credit_applications", applicationId), payload);
}
