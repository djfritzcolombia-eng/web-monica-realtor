// FullscreenGalleryModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ImageCarousel from "./ImageCarousel";

const COLORS = {
    beige: "#e6dace",
    terracota: "#d8a48f",
    brown: "#6e6259",
    ivory: "#faf9f6",
    darkBrown: "#4a423a",
};

function Chip({ children }) {
    return (
        <span
            style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 20,
                background: COLORS.terracota,
                color: COLORS.ivory,
                fontWeight: 600,
                fontSize: 11,
                marginRight: 8,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
            }}
        >
            {children}
        </span>
    );
}

/* =======================
   WhatsApp helpers
   ======================= */
// Normaliza a formato internacional (Colombia por defecto)
function normalizePhoneToIntl(phone, defaultCountryCode = "57") {
    if (!phone) return "";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith(defaultCountryCode)) return digits;
    if (digits.startsWith("3")) return defaultCountryCode + digits; // móvil CO
    return digits;
}

function buildWhatsAppHrefFromDetails({
    phone,         // número destino (ej: del agente). Si no hay, se abrirá wa.me para elegir contacto
    title,
    priceLabel,
    address,
    city,
    zone,
    propertyId,
    propertyUrl,
}) {
    const phoneIntl = normalizePhoneToIntl(phone || "");
    const lines = [
        `👋 Hola, quiero más información de esta propiedad.`,
        title ? `📌 *${title}*` : null,
        priceLabel ? `💵 Precio: ${priceLabel}` : null,
        (zone || city || address)
            ? `📍 ${[zone, city].filter(Boolean).join(" — ")}${address ? ` · ${address}` : ""}`
            : null,
        propertyId ? `🆔 ID: ${propertyId}` : null,
        propertyUrl ? `🔗 ${propertyUrl}` : null,
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const base = phoneIntl ? `https://wa.me/${phoneIntl}` : `https://wa.me/`;
    return `${base}?text=${text}`;
}

// Aux styles
const metricBoxStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
};

const groupBoxStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
};

const groupTitleStyle = {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 700,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
};

// 🚀 Área desplazable para móvil/escritorio
const scrollAreaStyle = {
    flex: 1,
    minHeight: 0, // importante para que flex-child pueda overflowear
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
};

function FullscreenGalleryModal({
    open,
    onClose,
    images,
    title,
    details,
    propertyId,
    propertyUrl,
    propertyType,
    operationType,
    onPhotoChange,
    onWhatsAppClick,
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const modalRef = useRef(null);

    const goToPhoto = (index) => {
        setCurrentIndex(index);
        onPhotoChange?.(index);
    };

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
            if (e.key === "ArrowRight") {
                setCurrentIndex((i) => {
                    const next = (i + 1) % (images?.length || 1);
                    onPhotoChange?.(next);
                    return next;
                });
            }
            if (e.key === "ArrowLeft") {
                setCurrentIndex((i) => {
                    const next = (i - 1 + (images?.length || 1)) % (images?.length || 1);
                    onPhotoChange?.(next);
                    return next;
                });
            }
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.classList.add("modal-open");
        window.addEventListener("keydown", onKey);

        const t = setTimeout(() => modalRef.current?.focus(), 0);

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            document.body.classList.remove("modal-open");
            clearTimeout(t);
        };
    }, [open, images, onClose, onPhotoChange]);

    if (!open) return null;

    const {
        priceLabel,
        areaValue,
        areaUnit,
        bedrooms,
        bathrooms,
        garages,
        address,
        zone,
        city,
        stratum,
        floor,
        condition,
        year,
        adminFeeLabel,
        agent,        // si lo tienes en details, se usará primero
        featuresInt = [],
        featuresExt = [],
    } = details || {};

    const waHref = buildWhatsAppHrefFromDetails({
        phone: "573212080985",
        title,
        priceLabel,
        address,
        city,
        zone,
        propertyId,
        propertyUrl,
    });

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Galería de ${title || "propiedad"}`}
            tabIndex={-1}
            ref={modalRef}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                display: "flex",
                flexDirection: "column",
                height: "100vh", // altura completa
                zIndex: 99999,
            }}
        >
            {/* Barra superior */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    color: "#fff",
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                    flex: "0 0 auto",
                }}
            >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span
                        style={{
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            fontSize: 14,
                            color: "#faf9f6",
                            opacity: 0.9,
                            textTransform: "uppercase",
                        }}
                    >
                        Galería
                    </span>
                    <span style={{ opacity: 0.75, fontSize: 13 }}>{title || "Propiedad"}</span>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Cerrar galería"
                    style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    ✕ Cerrar
                </button>
            </div>

            {/* 🔽 Área que sí scrollea */}
            <div style={scrollAreaStyle}>
                {/* Contenido: Grid con carrusel (izq) + panel detalles (der) */}
                <div
                    data-wasi-grid
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 380px",
                        gap: 0,
                    }}
                >
                    {/* Columna izquierda: carrusel + miniaturas */}
                    <div style={{ padding: 16, overflow: "hidden" }}>
                        <ImageCarousel
                            images={images}
                            title={title}
                            height={"72vh"}
                            initialIndex={currentIndex}
                            onIndexChange={goToPhoto}
                            accentColor={COLORS.terracota}
                            labelColor={COLORS.ivory}
                        />

                        {images?.length > 1 && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    overflowX: "auto",
                                    paddingTop: 8,
                                    WebkitOverflowScrolling: "touch",
                                }}
                                onWheel={(e) => (e.currentTarget.scrollLeft += e.deltaY)}
                            >
                                {images.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToPhoto(i)}
                                        style={{
                                            border: i === currentIndex ? `2px solid #d8a48f` : "2px solid transparent",
                                            padding: 0,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            background: "transparent",
                                            flex: "0 0 auto",
                                        }}
                                    >
                                        <img
                                            src={src}
                                            alt={`Miniatura ${i + 1}`}
                                            loading="lazy"
                                            style={{
                                                width: 110,
                                                height: 76,
                                                objectFit: "cover",
                                                display: "block",
                                                filter: i === currentIndex ? "none" : "grayscale(20%)",
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha: panel de detalles */}
                    <aside
                        data-wasi-aside
                        style={{
                            borderLeft: "1px solid rgba(255,255,255,0.08)",
                            background: "#101010",
                            color: "#faf9f6",
                            padding: 16,
                        }}
                    >
                        {priceLabel && (
                            <div style={{ fontSize: 24, fontWeight: 800, color: "#d8a48f", marginBottom: 12 }}>
                                {priceLabel}
                            </div>
                        )}
                        {(propertyType || operationType) && (
                            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
                                {[propertyType, operationType].filter(Boolean).join(" · ")}
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                                {title || "Propiedad"}
                            </div>
                            {(zone || city || address) && (
                                <div style={{ fontSize: 13, opacity: 0.85 }}>
                                    {[zone, city].filter(Boolean).join(" — ")}
                                    {address ? ` · ${address}` : ""}
                                </div>
                            )}
                        </div>

                        {/* Botón WhatsApp principal */}
                        <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Contactar por WhatsApp"
                            onClick={onWhatsAppClick}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                background: "var(--color-emerald, #00796b)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 10,
                                padding: "10px 14px",
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: "pointer",
                                textDecoration: "none",
                                boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
                                margin: "8px 0 14px",
                            }}
                        >
                            📲 Quiero más información
                        </a>

                        {(bedrooms || bathrooms || garages || areaValue) && (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: 8,
                                    marginBottom: 14,
                                }}
                            >
                                {bedrooms && (
                                    <div style={metricBoxStyle}>
                                        🛏️ <strong style={{ marginLeft: 6 }}>{bedrooms}</strong> hab
                                    </div>
                                )}
                                {bathrooms && (
                                    <div style={metricBoxStyle}>
                                        🛁 <strong style={{ marginLeft: 6 }}>{bathrooms}</strong> baños
                                    </div>
                                )}
                                {garages && (
                                    <div style={metricBoxStyle}>
                                        🚗 <strong style={{ marginLeft: 6 }}>{garages}</strong> garajes
                                    </div>
                                )}
                                {(areaValue || areaUnit) && (
                                    <div style={metricBoxStyle}>
                                        📐 <strong style={{ marginLeft: 6 }}>{areaValue}{areaUnit ? ` ${areaUnit}` : ""}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {(stratum || floor || condition || year) && (
                            <div style={groupBoxStyle}>
                                <div style={groupTitleStyle}>Detalles</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                                    {stratum && (
                                        <div>
                                            <strong>Estrato:</strong> {stratum}
                                        </div>
                                    )}
                                    {floor && (
                                        <div>
                                            <strong>Piso:</strong> {floor}
                                        </div>
                                    )}
                                    {condition && (
                                        <div>
                                            <strong>Estado:</strong> {condition}
                                        </div>
                                    )}
                                    {year && (
                                        <div>
                                            <strong>Año:</strong> {year}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(adminFeeLabel || agent) && (
                            <div style={groupBoxStyle}>
                                <div style={groupTitleStyle}>Administración & Agente</div>
                                {adminFeeLabel && (
                                    <div style={{ fontSize: 13 }}>
                                        <strong>Administración:</strong> {adminFeeLabel}
                                    </div>
                                )}
                                {agent && (
                                    <div style={{ fontSize: 13 }}>
                                        <strong>Agente:</strong> {agent}
                                    </div>
                                )}
                            </div>
                        )}

                        {(featuresInt?.length || featuresExt?.length) ? (
                            <div style={groupBoxStyle}>
                                <div style={groupTitleStyle}>Características</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {featuresInt?.map((f, i) => (
                                        <Chip key={`mi-${i}`}>🏠 {f}</Chip>
                                    ))}
                                    {featuresExt?.map((f, i) => (
                                        <Chip key={`me-${i}`}>🌳 {f}</Chip>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
                            Usa ← → para navegar. Clic fuera para cerrar.
                        </div>

                        {/* CTA fijo solo en móvil */}
                        <div className="wasi-sticky-cta">
                            <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Contactar por WhatsApp"
                                onClick={onWhatsAppClick}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                    background: "var(--color-emerald, #00796b)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 12,
                                    padding: "12px 16px",
                                    fontWeight: 900,
                                    fontSize: 16,
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    boxShadow: "0 4px 18px rgba(37,211,102,0.35)",
                                    width: "100%",
                                }}
                            >
                                📲 Quiero más información por WhatsApp
                            </a>
                        </div>
                    </aside>
                </div>
            </div>

            {/* CSS responsive embebido */}
            <style>{`
        @media (max-width: 920px) {
          [data-wasi-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-wasi-aside] {
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
          }
          .wasi-sticky-cta {
            position: sticky;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(16,16,16,0.9);
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 10px 12px;
            display: flex;
            justifyContent: center;
            z-index: 2;
            backdrop-filter: blur(6px);
            margin-top: 12px;
          }
          .wasi-sticky-cta a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
        </div>,
        document.body
    );
}

export default FullscreenGalleryModal;
