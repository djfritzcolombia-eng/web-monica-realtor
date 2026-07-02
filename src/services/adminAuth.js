import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

const ADMIN_KEY = "mf_admin_auth";

export function isAdminAuthenticated() {
    try {
        const raw = sessionStorage.getItem(ADMIN_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        return Boolean(data?.usuario);
    } catch {
        return false;
    }
}

export function getAdminUser() {
    try {
        const raw = sessionStorage.getItem(ADMIN_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function logoutAdmin() {
    sessionStorage.removeItem(ADMIN_KEY);
}

export async function loginAdmin(usuario, clave) {
    const trimmedUser = String(usuario || "").trim();
    const trimmedPass = String(clave || "").trim();
    if (!trimmedUser || !trimmedPass) {
        throw new Error("Ingresa usuario y contraseña.");
    }

    const snap = await getDocs(
        query(collection(db, "user"), where("usuario", "==", trimmedUser))
    );

    if (snap.empty) {
        throw new Error("Usuario o contraseña incorrectos.");
    }

    const userDoc = snap.docs[0].data();
    if (userDoc.clave !== trimmedPass) {
        throw new Error("Usuario o contraseña incorrectos.");
    }

    sessionStorage.setItem(
        ADMIN_KEY,
        JSON.stringify({
            usuario: userDoc.usuario,
            loggedAt: new Date().toISOString(),
        })
    );

    return userDoc;
}
