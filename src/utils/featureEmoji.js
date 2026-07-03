const norm = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

/** Reglas ordenadas: la primera coincidencia gana. */
const FEATURE_EMOJI_RULES = [
    { test: /vista\s*panoram|panoramica/, emoji: "🌄" },
    { test: /bosque\s*nativ|bosques?\s*nativ/, emoji: "🌲" },
    { test: /cerca.*zona\s*urbana|zona\s*urbana\s*cerc/, emoji: "🏙️" },
    { test: /parque|cerca.*parque/, emoji: "🏞️" },
    { test: /balcon/, emoji: "🪟" },
    { test: /bano\s*auxiliar|bano\s*social|medio\s*bano/, emoji: "🚿" },
    { test: /bano.*habitaci|bano\s*en\s*habitaci|bano\s*principal/, emoji: "🛁" },
    { test: /bano|ducha/, emoji: "🚿" },
    { test: /arbol.*frutal|frutales/, emoji: "🍊" },
    { test: /garaje|parqueadero|estacionamiento|aparcamiento/, emoji: "🚗" },
    { test: /jardin/, emoji: "🪴" },
    { test: /mascota|admite\s*mascota|pet\s*friendly/, emoji: "🐾" },
    { test: /closet|cl[oó]set|vestier/, emoji: "👔" },
    { test: /piscina/, emoji: "🏊" },
    { test: /gimnasio/, emoji: "💪" },
    { test: /ascensor|elevador/, emoji: "🛗" },
    { test: /seguridad|porteria|vigilancia|citofono/, emoji: "🔒" },
    { test: /transporte|metro|bus|trans\.?\s*publico/, emoji: "🚌" },
    { test: /cocina|integral/, emoji: "🍳" },
    { test: /terraza/, emoji: "☀️" },
    { test: /chimenea/, emoji: "🔥" },
    { test: /aire\s*acondicionado|a\.?\s*a\.?|calefacci/, emoji: "❄️" },
    { test: /bodega|deposito/, emoji: "📦" },
    { test: /estudio|oficina|ofi[\s-]?loft/, emoji: "💼" },
    { test: /sala|comedor|living|sala\s*comedor/, emoji: "🛋️" },
    { test: /habitaci|alcoba|dormitorio/, emoji: "🛏️" },
    { test: /lavander|zona\s*de\s*ropas/, emoji: "🧺" },
    { test: /gas(\s|$)|gas\s*natural/, emoji: "🔥" },
    { test: /agua(\s|$)/, emoji: "💧" },
    { test: /luz|energia|acueducto/, emoji: "⚡" },
    { test: /internet|wifi|fibra/, emoji: "📶" },
    { test: /cancha|futbol|deporte/, emoji: "⚽" },
    { test: /bbq|asador|zonas?\s*bbq/, emoji: "🍖" },
    { test: /sauna|turco|jacuzzi|hidromasaje/, emoji: "🧖" },
    { test: /rural|campestre|vereda/, emoji: "🌾" },
    { test: /rio|quebrada|agua\s*cerc/, emoji: "🌊" },
    { test: /montaña|cerro|cerros/, emoji: "⛰️" },
    { test: /amoblado|amueblado/, emoji: "🪑" },
    { test: /nuevo/, emoji: "✨" },
    { test: /remodelad|reformad/, emoji: "🔨" },
    { test: /duplex|triplex/, emoji: "🏘️" },
    { test: /penthouse|atico/, emoji: "🏙️" },
    { test: /casa\s*campestre|finca/, emoji: "🏡" },
    { test: /lote|terreno/, emoji: "📐" },
    { test: /zona\s*comercial|comercio/, emoji: "🛍️" },
    { test: /colegio|escuela|universidad|edu/, emoji: "🎓" },
    { test: /hospital|clinica|salud/, emoji: "🏥" },
    { test: /supermercado|mercado/, emoji: "🛒" },
    { test: /calle|via|acceso|carretera/, emoji: "🛣️" },
];

export function getFeatureEmoji(feature, fallback = "✨") {
    const text = norm(feature);
    if (!text) return fallback;

    for (const rule of FEATURE_EMOJI_RULES) {
        if (rule.test.test(text)) return rule.emoji;
    }

    return fallback;
}

export function getInteriorFeatureEmoji(feature) {
    return getFeatureEmoji(feature, "🏠");
}

export function getExteriorFeatureEmoji(feature) {
    return getFeatureEmoji(feature, "🌳");
}
