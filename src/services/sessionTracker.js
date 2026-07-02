import {
    addDoc,
    collection,
    doc,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

const VISITOR_KEY = "mf_visitor_id";
const SESSION_KEY = "mf_session_id";
const SESSIONS = "sessions";
const EVENTS = "events";

let sequence = 0;
let sessionId = null;
let visitorId = null;
let sessionUbicacion = null;
let initialized = false;
let initPromise = null;
let lastEventSignature = "";
let lastEventTime = 0;

const SESSION_START_KEY = "mf_session_start_sent";

function generateId() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateVisitorId() {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = generateId();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return generateId();
    }
}

function getOrCreateSessionId() {
    try {
        let id = sessionStorage.getItem(SESSION_KEY);
        if (!id) {
            id = generateId();
            sessionStorage.setItem(SESSION_KEY, id);
        }
        return id;
    } catch {
        return generateId();
    }
}

function parseUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const utm = {};
    for (const key of keys) {
        const value = params.get(key);
        if (value) utm[key.replace("utm_", "")] = value;
    }
    return Object.keys(utm).length ? utm : null;
}

function collectDeviceInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages ? [...navigator.languages] : [],
        platform: navigator.platform,
        vendor: navigator.vendor,
        screen: {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        touchPoints: navigator.maxTouchPoints,
        deviceMemory: navigator.deviceMemory ?? null,
        hardwareConcurrency: navigator.hardwareConcurrency ?? null,
        connection: conn
            ? {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
            }
            : null,
    };
}

function collectPageContext() {
    return {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer || null,
        host: window.location.host,
        title: document.title,
    };
}

async function fetchIpLocation() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fallback = {
        zonaHoraria: timezone,
        idioma: navigator.language,
        fuente: "zona_horaria",
        precision: "muy_baja",
    };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
            "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=es",
            { signal: controller.signal },
        );
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            const locality = data.locality || data.city || null;
            if (locality || data.city) {
                return {
                    ciudad: data.city || locality,
                    municipio: locality,
                    region: data.principalSubdivision || null,
                    pais: data.countryName || null,
                    codigoPais: data.countryCode || null,
                    latitud: data.latitude ?? null,
                    longitud: data.longitude ?? null,
                    codigoPostal: data.postcode || null,
                    zonaHoraria: timezone,
                    idioma: navigator.language,
                    fuente: "ip",
                    precision: "aproximada",
                };
            }
        }
    } catch {
        // try legacy provider below
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return fallback;

        const data = await res.json();
        return {
            ciudad: data.city || null,
            municipio: data.city || null,
            region: data.region || null,
            pais: data.country_name || null,
            codigoPais: data.country_code || null,
            latitud: data.latitude ?? null,
            longitud: data.longitude ?? null,
            zonaHoraria: data.timezone || timezone,
            idioma: navigator.language,
            fuente: "ip",
            precision: "aproximada",
        };
    } catch {
        return fallback;
    }
}

async function fetchApproxLocation() {
    return fetchIpLocation();
}

function sanitizePayload(value, depth = 0) {
    if (value == null || depth > 4) return value;
    if (typeof value === "string") return value.slice(0, 2000);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitizePayload(v, depth + 1));
    if (typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value).slice(0, 40)) {
            out[k] = sanitizePayload(v, depth + 1);
        }
        return out;
    }
    return String(value).slice(0, 500);
}

function describeElement(el) {
    if (!el || el.nodeType !== 1) return null;
    const tag = el.tagName?.toLowerCase();
    const text = (el.getAttribute("aria-label") || el.innerText || el.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);
    return {
        tag,
        id: el.id || null,
        className: typeof el.className === "string" ? el.className.slice(0, 200) : null,
        name: el.getAttribute("name") || null,
        role: el.getAttribute("role") || null,
        type: el.getAttribute("type") || null,
        href: el.getAttribute("href") || null,
        text: text || null,
        dataTrack: el.getAttribute("data-track") || null,
    };
}

export function getSessionId() {
    return sessionId;
}

export function getVisitorId() {
    return visitorId;
}

export async function initSession(extra = {}) {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (initialized) return sessionId;

        visitorId = getOrCreateVisitorId();
        sessionId = getOrCreateSessionId();
        sessionUbicacion = await fetchApproxLocation();

        const isReturning = (() => {
            try {
                const key = "mf_has_visited";
                const had = localStorage.getItem(key);
                if (!had) localStorage.setItem(key, "1");
                return Boolean(had);
            } catch {
                return false;
            }
        })();

        const sessionDoc = {
            sessionId,
            visitorId,
            isReturning,
            startedAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
            appVersion: extra.appVersion ?? null,
            device: collectDeviceInfo(),
            page: collectPageContext(),
            ubicacion: sessionUbicacion,
            utm: parseUtmParams(),
            deepLink: extra.deepLink ?? null,
            metrics: {
                eventCount: 0,
                clicks: 0,
                searches: 0,
                pageViews: 0,
            },
            lastAction: "session_start",
        };

        try {
            await setDoc(doc(db, SESSIONS, sessionId), sessionDoc);
            initialized = true;

            const startKey = `${SESSION_START_KEY}_${sessionId}`;
            if (!sessionStorage.getItem(startKey)) {
                sessionStorage.setItem(startKey, "1");
                await trackEvent("session_start", {
                    action: "inicio_sesion",
                    isReturning,
                    ...extra,
                });
            }

        } catch (err) {
            console.warn("[sessionTracker] No se pudo iniciar sesión en Firestore:", err?.message);
        }

        return sessionId;
    })();

    return initPromise;
}

export async function trackEvent(type, data = {}) {
    if (!sessionId) {
        sessionId = getOrCreateSessionId();
        visitorId = getOrCreateVisitorId();
    }

    const action = data.action || "";
    const signature = `${type}:${action}`;
    const now = Date.now();
    if (signature === lastEventSignature && now - lastEventTime < 1200) {
        return;
    }
    lastEventSignature = signature;
    lastEventTime = now;

    sequence += 1;
    const clientTimestamp = new Date().toISOString();
    const event = sanitizePayload({
        sessionId,
        visitorId,
        type,
        sequence,
        clientTimestamp,
        url: window.location.href,
        pathname: window.location.pathname,
        ubicacion: sessionUbicacion,
        ...data,
    });

    try {
        await addDoc(collection(db, SESSIONS, sessionId, EVENTS), {
            ...event,
            createdAt: serverTimestamp(),
        });

        const sessionUpdates = {
            lastActivityAt: serverTimestamp(),
            lastAction: type,
            "page.href": window.location.href,
            "page.pathname": window.location.pathname,
            "metrics.eventCount": increment(1),
        };
        if (type === "click") sessionUpdates["metrics.clicks"] = increment(1);
        if (type === "search" || type === "filter_applied") {
            sessionUpdates["metrics.searches"] = increment(1);
        }
        if (type === "page_view") sessionUpdates["metrics.pageViews"] = increment(1);

        const metadata = data.metadata;
        if (metadata?.busqueda) {
            sessionUpdates.lastSearch = sanitizePayload(metadata.busqueda);
        }
        if (metadata?.inmueble) {
            sessionUpdates.lastViewedProperty = sanitizePayload({
                ...metadata.inmueble,
                fotos: metadata.fotos ?? null,
            });
        }
        if (metadata?.simulador) {
            sessionUpdates.lastSimulator = sanitizePayload(metadata.simulador);
        }

        await updateDoc(doc(db, SESSIONS, sessionId), sessionUpdates);
    } catch (err) {
        console.warn("[sessionTracker] Evento no guardado:", type, err?.message);
    }
}

export async function endSession(reason = "page_unload") {
    if (!sessionId || !initialized) return;
    try {
        await trackEvent("session_end", { action: reason });
        await updateDoc(doc(db, SESSIONS, sessionId), {
            endedAt: serverTimestamp(),
            endReason: reason,
        });
    } catch {
        // ignore on unload
    }
}
