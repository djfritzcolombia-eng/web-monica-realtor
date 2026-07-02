// Paleta: #e6dace (beige), #d8a48f (terracota), #6e6259 (topo), #faf9f6 (marfil)

export function currencyCOP(v) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(v);
}
export const styles = {
    socialIcons: {
        display: 'flex',
        gap: 16,
        marginTop: 12,
    },
    socialBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#6e6259', // topo oscuro
        color: '#faf9f6', // marfil
        fontSize: 20,
        transition: 'background 0.18s',
        boxShadow: '0 2px 8px rgba(110,98,89,0.12)',
        textDecoration: 'none',
    },
    page: {
        fontFamily: "var(--font-main), Inter, system-ui, sans-serif",
        color: "var(--color-topo)",
        lineHeight: 1.4,
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "var(--gradient-page-continuous, var(--page-bg))",
        padding: 0,
        border: 'none',
        boxShadow: 'none',
    },
    main: {
        flex: 1,
        width: "100vw",
        maxWidth: "100vw",
        margin: 0,
        background: "transparent",
        borderRadius: 0,
        border: "none",
        boxShadow: "none",
        padding: 0,
        marginTop: 0,
    },
    container: {
        width: '100vw',
        maxWidth: '100vw',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        textAlign: 'center',
    },
    header: {
        width: "100%",
        background: "#faf9f6",
        borderBottom: "1.5px solid #e6dace",
        padding: "32px 0 18px 0",
        marginBottom: 0,
        boxShadow: "0 2px 12px 0 rgba(214,164,143,0.04)",
    },

    // — Hero con video de fondo —
    hero: {
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#faf9f6",
        boxSizing: "border-box",
        padding: 0,
        margin: 0,
    },
    heroBg: { position: "absolute", inset: 0, zIndex: 0 },
    heroVideo: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) scale(1.1)",
        minWidth: "100vw",
        minHeight: "100vh",
        width: "100vw",
        height: "100vh",
        objectFit: "cover",
        filter: "blur(2px) brightness(0.9)",
        pointerEvents: "none",
    },
    heroOverlay: {
        position: "absolute",
        inset: 0,
        background:
            "linear-gradient(120deg, rgba(216,164,143,0.45) 0%, rgba(230,218,206,0.35) 45%, rgba(110,98,89,0.55) 100%)",
        zIndex: 1,
    },
    heroContent: {
        position: "relative",
        zIndex: 2,
        maxWidth: 1200,
        width: "100%",
        padding: "0 0px",
        display: "flex",
        alignItems: "center",
    },
    heroLeft: { maxWidth: 640, textAlign: "left" },

    h1: { fontSize: 42, fontWeight: 800, margin: 0, letterSpacing: -0.5 },
    lead: { fontSize: 18, marginTop: 14 },
    ctaRow: { display: "flex", gap: 12, justifyContent: "flex-start", flexWrap: "wrap", marginTop: 24 },

    btn: { display: "inline-block", padding: "12px 16px", borderRadius: 12, textDecoration: "none", fontWeight: 600 },
    btnPrimary: { background: "#6e6259", color: "#faf9f6" },
    btnLight: { background: "#d8a48f", color: "#faf9f6" },
    btnGhost: { background: "transparent", color: "#faf9f6", border: "2px solid #faf9f6" },

    section: { padding: "32px 0", width: "100%", background: "transparent" },
    h2: { fontSize: 28, fontWeight: 800, margin: 0, color: "#6e6259", textAlign: "center" },
    em: { fontStyle: "italic", color: "#c8937e", fontFamily: "var(--font-main), serif" },
    sub: { marginTop: 8, color: "#6e6259" },

    chipsWrap: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 },
    chip: { padding: "10px 14px", borderRadius: 999, background: "#e6dace", textDecoration: "none", color: "#6e6259", fontWeight: 600 },
    chipOutline: { background: "transparent", border: "1px solid #6e6259", color: "#6e6259" },
    // ---- GRID CON TARJETAS DE TAMAÑO FIJO
    grid: {
        marginTop: 24,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, 320px)", // ancho fijo por card
        justifyContent: "center",                        // centra el grid si sobra espacio
        gap: 18,
        width: "100%",
        // scroll vertical si quieres tope
        // maxHeight: "70vh",
        // overflowY: "auto",
    },

    // ---- CARD (ancho/alto fijos + layout consistente)
    card: {
        display: "flex",
        flexDirection: "column",
        width: 320,                  // ancho fijo
        height: 420,                 // alto fijo
        textDecoration: "none",
        color: "#6e6259",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e6dace",
        background: "#faf9f6",
        boxShadow: "0 2px 8px rgba(110, 98, 89, 0.15)",
        transition: "transform .18s ease, box-shadow .18s ease",
        marginLeft: 'auto',
        marginRight: 'auto',
    },

    // Media query para pantallas pequeñas: margen lateral
    '@media (max-width: 600px)': {
        card: {
            marginLeft: 12,
            marginRight: 12,
        },
    },
    // efecto hover sutil (opcional: solo si pasarás style inline dinámico en el componente)
    cardHover: { transform: "translateY(-2px)", boxShadow: "0 6px 18px rgba(110,98,89,0.18)" },

    // ---- IMAGEN CON TAMAÑO FIJO
    thumbWrap: {
        position: "relative",
        width: "100%",
        height: 200,                 // alto fijo de la imagen
        overflow: "hidden",
    },
    thumb: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    // ---- CONTENIDO DE LA CARD
    cardBody: {
        display: "flex",
        flexDirection: "column",
        padding: 16,
        flex: 1,                     // ocupa el resto del alto de la card
        minHeight: 0,
    },
    cardTitle: { fontSize: 18, margin: 0, fontWeight: 700, lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
    metaRow: {
        marginTop: 8,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#6e6259",
        fontWeight: 600,          // empuja meta a la parte inferior
    },

};