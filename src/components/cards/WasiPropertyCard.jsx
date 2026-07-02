// Utilidad para capitalizar la primera letra
function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
import { useState, useCallback } from "react";
import FullscreenGalleryModal from "../FullscreenGalleryModal";
import { useSessionTracking } from "../../context/SessionTrackingContext";
import { buildPropertyMetadata } from "../../utils/eventMetadata";
import styles from "./WasiPropertyCard.module.css"; // Importa el módulo de estilos

// Paleta de colores
const COLORS = {
    beige: "#e6dace",
    terracota: "#d8a48f",
    brown: "#6e6259",
    ivory: "#faf9f6",
    darkBrown: "#4a423a",
};

// Chip mejorado
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

function ImageCarousel({ images, title, height = 250, initialIndex = 0, onIndexChange }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loadingNext, setLoadingNext] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressTimerRef = useRef(null);

    useEffect(() => setCurrentIndex(initialIndex), [initialIndex]);
    useEffect(() => () => progressTimerRef.current && clearInterval(progressTimerRef.current), []);

    const startIndeterminateProgress = () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress(0);
        progressTimerRef.current = setInterval(() => {
            setProgress((p) => (p < 90 ? Math.min(90, p + 8 + Math.random() * 7) : p));
        }, 180);
    };

    const stopProgress = () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress(100);
        setTimeout(() => setProgress(0), 350);
    };

    const preloadAndSwitch = (nextIndex) => {
        if (!images?.length || nextIndex === currentIndex) return;
        setLoadingNext(true);
        startIndeterminateProgress();
        const img = new window.Image();
        img.onload = () => {
            setCurrentIndex(nextIndex);
            onIndexChange?.(nextIndex);
            setLoadingNext(false);
            stopProgress();
        };
        img.onerror = () => {
            setLoadingNext(false);
            stopProgress();
        };
        img.src = images[nextIndex];
    };

    const goToPrevious = () => {
        const next = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        preloadAndSwitch(next);
    };

    const goToNext = () => {
        const next = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        preloadAndSwitch(next);
    };

    if (!images?.length) {
        return (
            <div style={{ width: "100%", height, overflow: "hidden", position: "relative" }}>
                <img
                    src="https://via.placeholder.com/640x400?text=Sin+imagen"
                    alt={title || "Propiedad"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div style={{ position: "relative", overflow: "hidden" }}>
            <style>{`
        @keyframes spin360 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { left: -40%; } 100% { left: 100%; } }
      `}</style>

            <div style={{ width: "100%", height, overflow: "hidden", position: "relative" }}>
                <img
                    src={images[currentIndex]}
                    alt={`${title || "Propiedad"} - Imagen ${currentIndex + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                />

                {loadingNext && (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
                                backdropFilter: "blur(1px)",
                                transition: "opacity 0.2s ease",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%,-50%)",
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                border: "3px solid rgba(255,255,255,0.35)",
                                borderTopColor: "#fff",
                                animation: "spin360 0.9s linear infinite",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 6,
                                background: "rgba(255,255,255,0.25)",
                            }}
                        >
                            <div
                                style={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    background: COLORS.terracota,
                                    transition: "width 0.2s ease",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        height: "100%",
                                        width: "40%",
                                        background:
                                            "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)",
                                        animation: "shimmer 1.2s linear infinite",
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: "rgba(0,0,0,0.6)",
                            color: COLORS.ivory,
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                        }}
                    >
                        {currentIndex + 1} / {images.length}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                        style={navBtnStyle("left", loadingNext)}
                        aria-label="Imagen anterior"
                    >
                        ‹
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                        style={navBtnStyle("right", loadingNext)}
                        aria-label="Imagen siguiente"
                    >
                        ›
                    </button>
                </>
            )}
        </div>
    );
}

const navBtnStyle = (side, dim) => ({
    position: "absolute",
    [side]: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)",
    color: COLORS.ivory,
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: "bold",
    opacity: dim ? 0.7 : 1,
});



/** Componente principal */
export default function WasiPropertyCard({
    id,
    title,
    propertyType,
    operationType,
    salePrice,
    rentPrice,
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
    href,
    // agent,
    image,
    featuresInt = [],
    featuresExt = [],
    galleries = [],
}) {
    const [openModal, setOpenModal] = useState(false);
    const { track } = useSessionTracking();

    const allImages = [];
    if (image) allImages.push(image);
    if (galleries && galleries.length > 0) {
        galleries.forEach((gallery) => {
            if (gallery && typeof gallery === "object") {
                Object.values(gallery).forEach((img) => {
                    if (img && (img.url_big || img.url || img.url_original)) {
                        allImages.push(img.url_big || img.url || img.url_original);
                    }
                });
            }
        });
    }

    const propertyMeta = useCallback(() => buildPropertyMetadata({
        id,
        title,
        propertyType,
        operationType,
        priceLabel,
        salePrice,
        rentPrice,
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
        href,
        imageCount: allImages.length,
    }), [
        id, title, propertyType, operationType, priceLabel, salePrice, rentPrice,
        areaValue, areaUnit, bedrooms, bathrooms, garages, address, zone, city,
        stratum, floor, condition, year, adminFeeLabel, href, allImages.length,
    ]);

    const handleCloseGallery = () => {
        track("property_view", {
            action: "cerrar_galeria",
            metadata: propertyMeta(),
        });
        setOpenModal(false);
    };

    // Paquete de detalles para el modal
    const details = {
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
        featuresInt,
        featuresExt,
    };


    return (
        <div className={styles.card}>

            {/* Header: Precio, Estado, Título */}
            <div className={styles.headerTop}>
                <div className={styles.headerRow}>
                    {condition && (
                        <span className={styles.statusTag}>
                            {condition.toLowerCase() === 'nuevo' || condition.toLowerCase() === 'new' ? 'Nuevo' : 'Usado'}
                        </span>
                    )}
                    <div className={styles.priceTag}>{priceLabel}</div>
                </div>
                <h3 className={styles.title}>{capitalize(title) || "Propiedad"}</h3>
            </div>

            {/* Carrusel de imágenes */}
            <div className={styles.carouselContainer}>
                <ImageCarousel images={allImages} title={capitalize(title)} />
                {/* Botón Ampliar */}
                {allImages.length > 0 && (
                    <button
                        onClick={() => {
                            track("property_view", {
                                action: "abrir_galeria",
                                metadata: propertyMeta(),
                            });
                            setOpenModal(true);
                        }}
                        className={styles.expandButton}
                        aria-label="Ampliar"
                        title="Ver todas las fotos en grande"
                    >
                        🔍 Ampliar
                    </button>
                )}
            </div>

            {/* Contenido dividido */}
            <div className={styles.content}>
                {/* Info principal */}
                <div className={styles.mainInfoBlock}>
                    <div className={styles.laminaDatosTitulo}>Datos principales</div>
                    {(bedrooms || bathrooms || garages || areaValue || areaUnit) && (
                        <div className={styles.mainInfo}>
                            {bedrooms && (
                                <div className={styles.mainInfoItem}>
                                    <div className={styles.mainInfoValue}>{bedrooms}</div>
                                    <div className={styles.mainInfoLabel}>Habitaciones</div>
                                </div>
                            )}
                            {bathrooms && (
                                <div className={styles.mainInfoItem}>
                                    <div className={styles.mainInfoValue}>{bathrooms}</div>
                                    <div className={styles.mainInfoLabel}>Baños</div>
                                </div>
                            )}
                            {garages && (
                                <div className={styles.mainInfoItem}>
                                    <div className={styles.mainInfoValue}>{garages}</div>
                                    <div className={styles.mainInfoLabel}>Garajes</div>
                                </div>
                            )}
                            {(areaValue || areaUnit) && (
                                <div className={styles.mainInfoItem}>
                                    <div className={styles.mainInfoValue}>{areaValue}</div>
                                    <div className={styles.mainInfoLabel}>{areaUnit ? capitalize(areaUnit) : "Área"}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Ubicación */}
                <div className={styles.locationBlock}>
                    <div className={styles.laminaDatosTitulo}>Dirección</div>
                    {(address || zone || city) && (
                        <div className={styles.location}>
                            {address && <div className={styles.locationAddress}>{capitalize(address)}</div>}
                            {(zone || city) && (
                                <div className={styles.locationZoneCity}>
                                    {[capitalize(zone), capitalize(city)].filter(Boolean).join(" — ")}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Extra */}
                <div className={styles.extraBlock}>
                    <div className={styles.laminaDatosTitulo}>Detalles adicionales</div>
                    {(stratum || floor || year) && (
                        <div className={styles.extra}>
                            {stratum && (
                                <div>
                                    <strong>Estrato:</strong> {capitalize(stratum)}
                                </div>
                            )}
                            {floor && (
                                <div>
                                    <strong>Piso:</strong> {capitalize(floor)}
                                </div>
                            )}
                            {year && (
                                <div>
                                    <strong>Año:</strong> {capitalize(year)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Administración y Agente */}
                {adminFeeLabel && (
                    <div className={styles.adminAgentBlock}>
                        <div className={styles.laminaDatosTitulo}>
                            Administración: {capitalize(adminFeeLabel)}
                        </div>
                    </div>
                )}

                {/* Features */}
                {(featuresInt.length > 0 || featuresExt.length > 0) && (
                    <div className={styles.features}>
                        <div className={styles.featuresList}>
                            {featuresInt.slice(0, 3).map((f, i) => (
                                <Chip key={`i-${i}`}>🏠 {capitalize(f)}</Chip>
                            ))}
                            {featuresExt.slice(0, 3).map((f, i) => (
                                <Chip key={`e-${i}`}>🌳 {capitalize(f)}</Chip>
                            ))}
                            {(featuresInt.length > 3 || featuresExt.length > 3) && (
                                <Chip>+{featuresInt.length + featuresExt.length - 3} más</Chip>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal emergente */}
            <FullscreenGalleryModal
                open={openModal}
                onClose={handleCloseGallery}
                images={allImages}
                title={capitalize(title)}
                details={details}
                propertyId={id}
                propertyUrl={href}
                propertyType={propertyType}
                operationType={operationType}
                onWhatsAppClick={() => {
                    track("property_contact", {
                        action: "whatsapp_propiedad",
                        metadata: propertyMeta(),
                    });
                }}
            />
        </div>
    );
}