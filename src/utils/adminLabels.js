export const EVENT_TYPE_ES = {
    session_start: "Inicio de sesión",
    session_end: "Fin de sesión",
    page_view: "Vista de pantalla",
    click: "Clic en elemento",
    zone_select: "Selección de zona",
    filter_applied: "Búsqueda aplicada",
    search: "Búsqueda de propiedades",
    search_results: "Resultados cargados",
    pagination: "Cambio de página",
    modal_open: "Apertura de ventana",
    modal_close: "Cierre de ventana",
    simulator_calculate: "Cálculo simulador notarial",
    simulator_input: "Dato del simulador",
    simulator_share: "Compartir simulador",
    simulator_step: "Navegación simulador",
    property_impression: "Propiedad en pantalla",
    property_view: "Ver propiedad",
    property_photo: "Ver fotografía",
    property_contact: "Contacto por WhatsApp",
    social_click: "Clic en red social",
    scroll_depth: "Desplazamiento en página",
    visibility_change: "Cambio de pestaña",
    error: "Error en la aplicación",
};

export const ACTION_ES = {
    initial_load: "Carga inicial del sitio",
    results_view: "Vista de resultados",
    search_properties: "Buscar propiedades",
    fetch_properties: "Consultando propiedades",
    properties_loaded: "Propiedades cargadas",
    change_page: "Cambiar página de resultados",
    select_zone: "Seleccionar zona",
    clear_zone: "Limpiar zona",
    open_simulator: "Abrir simulador notarial",
    simulator_deep_link: "Simulador desde enlace compartido",
    close_simulator: "Cerrar simulador",
    open_gallery: "Abrir galería de fotos",
    close_gallery: "Cerrar galería",
    carousel_photo_view: "Ver foto en carrusel",
    modal_photo_view: "Ver foto ampliada",
    whatsapp_from_gallery: "Contactar por WhatsApp",
    calculate_notary_fees: "Calcular gastos notariales",
    change_property_type: "Cambiar tipo de inmueble",
    share_link: "Compartir enlace del simulador",
    share_link_failed: "No se pudo compartir",
    back_to_form: "Volver al formulario",
    open_social: "Abrir red social",
    scroll: "Desplazamiento",
    page_hide: "Usuario salió de la página",
    before_unload: "Cierre del navegador",
    visible: "Pestaña visible",
    hidden: "Pestaña en segundo plano",
    fetch_properties_failed: "Error al buscar propiedades",
    inicio_sesion: "Inicio de sesión",
    session_start: "Inicio de sesión",
    abrir_galeria: "Abrir galería de fotos",
    cerrar_galeria: "Cerrar galería",
    whatsapp_propiedad: "Contactar por WhatsApp",
    vista_resultados: "Ver resultados de búsqueda",
};

export const SCREEN_ES = {
    home: "Inicio — Buscador de zonas",
    results: "Resultados de propiedades",
    simulator: "Simulador de gastos notariales",
    gallery: "Galería de propiedad",
    admin: "Panel de administración",
};

export function getEventTypeEs(type) {
    return EVENT_TYPE_ES[type] || type || "Evento";
}

export function getActionEs(action) {
    if (!action) return null;
    return ACTION_ES[action] || action;
}

export function getScreenNameEs(event = {}) {
    const action = event.action;
    const type = event.type;
    const path = event.pathname || "";

    if (path.includes("/admin")) return SCREEN_ES.admin;
    if (action === "initial_load") return SCREEN_ES.home;
    if (action === "vista_resultados" || action === "results_view") return SCREEN_ES.results;
    if (type === "modal_open" || type === "modal_close" || type?.startsWith("simulator")) {
        return SCREEN_ES.simulator;
    }
    if (type === "property_view" || type === "property_photo") return SCREEN_ES.gallery;
    if (action === "open_gallery" || action === "close_gallery") return SCREEN_ES.gallery;
    if (action === "properties_loaded" || action === "fetch_properties") return SCREEN_ES.results;
    return SCREEN_ES.home;
}

export function buildEventSummaryEs(event) {
    const meta = event.metadata;

    if (meta?.busqueda?.textoResumen) return meta.busqueda.textoResumen;
    if (meta?.busqueda?.zonas?.length) {
        return `Zona: ${meta.busqueda.zonas.join(", ")}`;
    }
    if (meta?.inmueble?.titulo) {
        const valor = meta.inmueble.valorLabel ? ` — ${meta.inmueble.valorLabel}` : "";
        const tipo = meta.inmueble.tipoInmueble ? ` (${meta.inmueble.tipoInmueble})` : "";
        return `${meta.inmueble.titulo}${tipo}${valor}`;
    }
    if (meta?.fotos?.resumen) return meta.fotos.resumen;
    if (meta?.simulador?.valorInmueble) {
        return `Inmueble ${formatMoney(meta.simulador.valorInmueble)} — ${meta.simulador.tipoInmueble || "NO_VIS"}`;
    }
    if (event.target?.text) return `Elemento: ${event.target.text}`;
    if (event.network) return `Red social: ${event.network}`;
    if (event.percent != null) return `Profundidad de scroll: ${event.percent}%`;
    if (event.hidden === true) return "El usuario cambió de pestaña";
    if (event.action === "visible") return "El usuario volvió a la pestaña";
    return null;
}

function formatMoney(value) {
    if (value == null) return "";
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatUbicacion(ubicacion) {
    if (!ubicacion || typeof ubicacion !== "object") return "—";
    const lugar = ubicacion.municipio || ubicacion.ciudad;
    const parts = [lugar, ubicacion.region, ubicacion.pais].filter(Boolean);
    let text = "";
    if (parts.length) {
        text = parts.join(", ");
    } else if (ubicacion.zonaHoraria) {
        text = `Zona horaria: ${ubicacion.zonaHoraria}`;
    } else {
        return "—";
    }
    if (ubicacion.fuente === "ip" || ubicacion.precision === "aproximada") {
        return `${text} (aprox. por IP)`;
    }
    return text;
}

export function sortEventsChronologically(events) {
    return [...events].sort((a, b) => {
        const seqA = Number(a.sequence);
        const seqB = Number(b.sequence);
        if (Number.isFinite(seqA) && Number.isFinite(seqB) && seqA !== seqB) {
            return seqA - seqB;
        }
        const timeA = getEventTimeMs(a);
        const timeB = getEventTimeMs(b);
        return timeA - timeB;
    });
}

function getEventTimeMs(event) {
    if (event?.createdAt?.toDate) return event.createdAt.toDate().getTime();
    if (event?.clientTimestamp) {
        const t = new Date(event.clientTimestamp).getTime();
        if (Number.isFinite(t)) return t;
    }
    return 0;
}
