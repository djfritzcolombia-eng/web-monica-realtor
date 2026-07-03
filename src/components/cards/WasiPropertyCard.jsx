import { useState, useCallback } from "react";
import ImageCarousel from "../ImageCarousel";
import FullscreenGalleryModal from "../FullscreenGalleryModal";
import PropertyLocationMap from "../PropertyLocationMap";
import { useSessionTracking } from "../../context/SessionTrackingContext";
import { buildPropertyMetadata } from "../../utils/eventMetadata";
import { getExteriorFeatureEmoji, getInteriorFeatureEmoji } from "../../utils/featureEmoji";
import styles from "./WasiPropertyCard.module.css";

// Utilidad para capitalizar la primera letra
function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Paleta de colores
const COLORS = {
    beige: "#e6dace",
    terracota: "#d8a48f",
    brown: "#6e6259",
    ivory: "#faf9f6",
    darkBrown: "#4a423a",
};

// Etiqueta de característica — solo texto y emoji, sin burbuja
function FeatureItem({ children }) {
    return <span className={styles.featureItem}>{children}</span>;
}

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
    inBudget = false,
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
            {/* Formato Pantone: imagen arriba, datos abajo */}
            <div className={styles.mediaFrame}>
                <div className={styles.carouselContainer}>
                    <ImageCarousel
                        images={allImages}
                        title={capitalize(title)}
                        height={210}
                        accentColor={COLORS.terracota}
                        labelColor={COLORS.ivory}
                    />
                    <div className={styles.mediaOverlay}>
                        {condition && (
                            <span className={styles.statusTag}>
                                {condition.toLowerCase() === 'nuevo' || condition.toLowerCase() === 'new' ? 'Nuevo' : 'Usado'}
                            </span>
                        )}
                        <div className={`${styles.priceCluster} ${inBudget ? styles.priceClusterBudget : ""}`}>
                            <div className={styles.priceTag}>{priceLabel}</div>
                            {inBudget && (
                                <div className={styles.budgetTag}>En tu presupuesto</div>
                            )}
                        </div>
                    </div>
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
            </div>

            <div className={styles.infoPanel}>
                <h3 className={styles.title}>{capitalize(title) || "Propiedad"}</h3>

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
                        <div className={styles.locationRow}>
                            <div className={styles.location}>
                                {address && <div className={styles.locationAddress}>{capitalize(address)}</div>}
                                {(zone || city) && (
                                    <div className={styles.locationZoneCity}>
                                        {[capitalize(zone), capitalize(city)].filter(Boolean).join(" — ")}
                                    </div>
                                )}
                            </div>
                            <PropertyLocationMap address={address} zone={zone} city={city} />
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
                                <FeatureItem key={`i-${i}`}>{getInteriorFeatureEmoji(f)} {capitalize(f)}</FeatureItem>
                            ))}
                            {featuresExt.slice(0, 3).map((f, i) => (
                                <FeatureItem key={`e-${i}`}>{getExteriorFeatureEmoji(f)} {capitalize(f)}</FeatureItem>
                            ))}
                            {(featuresInt.length > 3 || featuresExt.length > 3) && (
                                <FeatureItem>⋯ +{featuresInt.length + featuresExt.length - 3} más</FeatureItem>
                            )}
                        </div>
                    </div>
                )}
                </div>
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