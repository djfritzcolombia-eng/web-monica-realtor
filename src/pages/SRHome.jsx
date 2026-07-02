// src/pages/SRHome.jsx
import React, { useEffect, useState } from "react";
import GlobalReset from "../components/GlobalReset";
import Hero from "../components/Hero";
import Section from "../components/Section";
import CardGrid from "../components/CardGrid";
import WasiPropertyCard from "../components/cards/WasiPropertyCard";
import SkeletonCard from "../components/SkeletonCard";
import FloatingSocial from "../components/FloatingSocial";
import AppVersion from "../components/AppVersion";
import RegionCityFilter from "../components/RegionCityFilter";
import { parseSimulatorFromSearch } from "../utils/simulatorDeepLink";
import ProfileHeader from "../components/ProfileHeader";
import { useSessionTracking } from "../context/SessionTrackingContext";
import { styles } from "../styles/styles";
import { paginationStyles, bandStyles } from "./SRHome.styles";

import { postRequest } from "../services/api";
import { buildSearchMetadata } from "../utils/eventMetadata";
import "./SRHome.animations.css";

// 🔠 Normalizador
const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Medellín conocido en Wasi
const MEDELLIN_ID = "496";

// Mapea grupos del filtro ⇒ id_city
// ⚠️ COMPLETA LOS TODO CON TUS id_city reales de Wasi
const CITY_ID_BY_GROUP = {
    "itagui": 389,
    "la estrella": 416,
    "sabaneta": 698,
    "envigado": 291,
    "bello": 89,
    // “Occidente” y “Oriente” son subregiones de Medellín ⇒ consulta por ciudad Medellín
    "occidente": MEDELLIN_ID,
    "oriente": MEDELLIN_ID,
    // “El Poblado” NO usa city aquí (va por zones), pero por claridad:
    "el poblado": MEDELLIN_ID,
};

// Mapper de WASI
// ...existing code...

// Extraer arreglo de la respuesta de Wasi (puede venir como array u objeto indexado "0","1"...)
// ...existing code...

// Paginación
const Pagination = ({ currentPage, totalPages, totalItems, perPage, onPageChange }) => {
    const [hoveredButton, setHoveredButton] = useState(null);
    if (totalPages <= 1) return null;

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) onPageChange(page);
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                // Elimina el boxShadow para que el borde encapsule completamente el video y no se vea el fondo exterior
                <button
                    key={i}
                    style={{
                        ...paginationStyles.button,
                        ...(i === currentPage ? paginationStyles.activeButton : {}),
                        ...(hoveredButton === i ? paginationStyles.buttonHover : {}),
                    }}
                    onClick={() => handlePageChange(i)}
                    onMouseEnter={() => setHoveredButton(i)}
                    onMouseLeave={() => setHoveredButton(null)}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div style={paginationStyles.container}>
            <button
                style={{
                    ...paginationStyles.button,
                    ...(currentPage === 1 ? paginationStyles.disabledButton : {}),
                    ...(hoveredButton === "prev" ? paginationStyles.buttonHover : {}),
                }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                onMouseEnter={() => setHoveredButton("prev")}
                onMouseLeave={() => setHoveredButton(null)}
            >
                Anterior
            </button>

            {renderPageNumbers()}

            <button
                style={{
                    ...paginationStyles.button,
                    ...(currentPage === totalPages ? paginationStyles.disabledButton : {}),
                    ...(hoveredButton === "next" ? paginationStyles.buttonHover : {}),
                }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                onMouseEnter={() => setHoveredButton("next")}
                onMouseLeave={() => setHoveredButton(null)}
            >
                Siguiente
            </button>

            <div style={paginationStyles.info}>
                Página {currentPage} de {totalPages} • Mostrando{" "}
                {(currentPage - 1) * perPage + 1} -{" "}
                {Math.min(currentPage * perPage, totalItems)} de {totalItems} propiedades
            </div>
        </div>
    );
};


export default function SRHome() {
    // Estado de WASI
    const [wasiProps, setWasiProps] = useState([]);
    const [wasiLoading, setWasiLoading] = useState(false);
    const [wasiError, setWasiError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 12,
        totalPages: 1,
        totalItems: 0,
    });

    // Filtros seleccionados (para UI)
    const [selectedGroups, setSelectedGroups] = useState([]); // ["itagui","el poblado",...]
    const [selectedZones, setSelectedZones] = useState([]);   // ids de zona si “El Poblado”

    // UI móvil: drawer filtros
    const [isMobile, setIsMobile] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Para conservar el último query (paginación)
    // lastQuery = { page, cityIds:[], zones:[] }
    const [lastQuery, setLastQuery] = useState(null);

    // Nuevo: mostrar filtro primero, luego resultados
    const [filterApplied, setFilterApplied] = useState(false);

    const [simulatorBoot, setSimulatorBoot] = useState(() => parseSimulatorFromSearch());
    const { track } = useSessionTracking();

    useEffect(() => {
        if (!simulatorBoot) return;
        window.history.replaceState({}, "", window.location.pathname);
    }, [simulatorBoot]);

    // Utilidades para mapear y extraer datos de WASI
    function mapWasiItem(raw) {
        if (!raw || typeof raw !== "object") return null;
        const mainImg = raw?.main_image || {};
        const image = mainImg.url_big || mainImg.url || mainImg.url_original || null;
        const galleriesImages = [];
        if (raw?.galleries && Array.isArray(raw.galleries)) {
            raw.galleries.forEach((gallery) => {
                if (gallery && typeof gallery === "object") {
                    Object.values(gallery).forEach((img) => {
                        if (img && (img.url_big || img.url || img.url_original)) {
                            galleriesImages.push({
                                url: img.url_big || img.url || img.url_original,
                                id: img.id,
                                description: img.description || "",
                                position: img.position || 0,
                            });
                        }
                    });
                }
            });
        }
        const featuresInt = Array.isArray(raw?.features?.internal)
            ? raw.features.internal.map((f) => f?.nombre || f?.name).filter(Boolean)
            : [];
        const featuresExt = Array.isArray(raw?.features?.external)
            ? raw.features.external.map((f) => f?.nombre || f?.name).filter(Boolean)
            : [];
        const agent = [raw?.user_data?.first_name, raw?.user_data?.last_name]
            .filter(Boolean)
            .join(" ");
        const salePrice = Number(raw.sale_price) || null;
        const rentPrice = Number(raw.rent_price) || null;
        const operationType = raw.for_sale && raw.for_rent
            ? "venta_arriendo"
            : raw.for_sale || salePrice
                ? "venta"
                : raw.for_rent || rentPrice
                    ? "arriendo"
                    : raw.sale_price_label
                        ? "venta"
                        : raw.rent_price_label
                            ? "arriendo"
                            : null;
        return {
            id: raw.id_property || raw.id,
            title: raw.title || "",
            propertyType:
                raw.property_type_label ||
                raw.id_property_type_label ||
                raw.type_label ||
                raw.property_label ||
                "",
            operationType,
            salePrice,
            rentPrice,
            priceLabel: raw.sale_price_label || raw.rent_price_label || "",
            areaValue: raw.area || raw.built_area || raw.private_area || "",
            areaUnit:
                raw.unit_area_label ||
                raw.unit_built_area_label ||
                raw.unit_private_area_label ||
                "",
            bedrooms: raw.bedrooms || "",
            bathrooms: raw.bathrooms || "",
            garages: raw.garages || "",
            address: raw.address || "",
            zone: raw.zone_label || "",
            city: raw.city_label || "",
            stratum: raw.stratum || "",
            floor: raw.floor || "",
            condition: raw.property_condition_label || "",
            year: raw.building_date || "",
            adminFeeLabel: raw.maintenance_fee_label || "",
            agent,
            image,
            href: raw.link || "",
            featuresInt,
            featuresExt,
            galleries: raw.galleries || [],
            allImages: [image, ...galleriesImages.map((img) => img.url)].filter(Boolean),
        };
    }
    const extractWasiArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data)) return data;
        if (data?.data && typeof data.data === "object") {
            return Object.values(data.data).filter((v) => v && typeof v === "object");
        }
        if (data && typeof data === "object") {
            return Object.values(data).filter((v) => v && typeof v === "object");
        }
        return [];
    };

    // --- Core fetch con soporte para:
    // (A) zones[] -> múltiples llamadas por id_zone
    // (B) cityIds[] -> múltiples llamadas por id_city
    // (C) uno u otro (nunca ambos a la vez en la misma ejecución)
    const fetchWasiProperties = async ({ page = 1, cityIds = [], zones = [] }) => {
        try {
            setWasiLoading(true);
            setWasiError(null);
            // A) Consulta por ZONAS (El Poblado)
            if (Array.isArray(zones) && zones.length > 0) {
                const perZone = Math.max(1, Math.ceil(pagination.perPage / zones.length));
                const calls = zones.map((id_zone) =>
                    postRequest("searchWasiProperties", {
                        id_city: MEDELLIN_ID, // Poblado es Medellín
                        id_zone,
                        page,
                        per_page: perZone,
                    }).catch((e) => ({ __error: e }))
                );
                const results = await Promise.all(calls);
                let aggregated = [];
                let totalItemsSum = 0;
                results.forEach((r) => {
                    if (!r || r.__error || !r.success) return;
                    const arr = extractWasiArray(r.data);
                    const mapped = arr.map(mapWasiItem).filter(Boolean);
                    aggregated = aggregated.concat(mapped);
                    const subtotal =
                        r.pagination?.total_items ??
                        r.data?.total ??
                        r.data?.count ??
                        mapped.length;
                    totalItemsSum += Number(subtotal) || 0;
                });
                // dedupe
                const seen = new Set();
                aggregated = aggregated.filter((it) => {
                    const key = it.id || it.href || it.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                const pageItems = aggregated.slice(0, pagination.perPage);
                setWasiProps(pageItems);
                setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    totalItems: totalItemsSum,
                    totalPages: Math.max(1, Math.ceil(totalItemsSum / prev.perPage)),
                }));
                setLastQuery({ page, zones, cityIds: [] });
                return;
            }
            // B) Consulta por CIUDADES
            if (Array.isArray(cityIds) && cityIds.length > 0) {
                if (cityIds.length === 1) {
                    // una sola ciudad (consulta directa con paginación nativa)
                    const payload = { id_city: cityIds[0], page, per_page: pagination.perPage };
                    const result = await postRequest("searchWasiProperties", payload);
                    if (result?.success) {
                        const arr = extractWasiArray(result.data);
                        const mapped = arr.map(mapWasiItem).filter(Boolean);
                        setWasiProps(mapped);
                        setPagination((prev) => ({
                            ...prev,
                            currentPage: page,
                            totalPages: result.pagination?.total_pages || 1,
                            totalItems: result.pagination?.total_items || mapped.length,
                        }));
                        setLastQuery({ page, cityIds, zones: [] });
                    } else {
                        setWasiError(new Error(result?.error || "Error desconocido"));
                    }
                    return;
                }
                // varias ciudades (agregación manual)
                const perCity = Math.max(1, Math.ceil(pagination.perPage / cityIds.length));
                const calls = cityIds.map((id_city) =>
                    postRequest("searchWasiProperties", {
                        id_city,
                        page,
                        per_page: perCity,
                    }).catch((e) => ({ __error: e }))
                );
                const results = await Promise.all(calls);
                let aggregated = [];
                let totalItemsSum = 0;
                results.forEach((r) => {
                    if (!r || r.__error || !r.success) return;
                    const arr = extractWasiArray(r.data);
                    const mapped = arr.map(mapWasiItem).filter(Boolean);
                    aggregated = aggregated.concat(mapped);
                    const subtotal =
                        r.pagination?.total_items ??
                        r.data?.total ??
                        r.data?.count ??
                        mapped.length;
                    totalItemsSum += Number(subtotal) || 0;
                });
                // dedupe
                const seen = new Set();
                aggregated = aggregated.filter((it) => {
                    const key = it.id || it.href || it.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                const pageItems = aggregated.slice(0, pagination.perPage);
                setWasiProps(pageItems);
                setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    totalItems: totalItemsSum,
                    totalPages: Math.max(1, Math.ceil(totalItemsSum / prev.perPage)),
                }));
                setLastQuery({ page, cityIds, zones: [] });
                return;
            }
            // C) fallback: Medellín sin zonas
            const payload = { id_city: MEDELLIN_ID, page, per_page: pagination.perPage };
            const result = await postRequest("searchWasiProperties", payload);
            if (result?.success) {
                const arr = extractWasiArray(result.data);
                const mapped = arr.map(mapWasiItem).filter(Boolean);
                setWasiProps(mapped);
                setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    totalPages: result.pagination?.total_pages || 1,
                    totalItems: result.pagination?.total_items || mapped.length,
                }));
                setLastQuery({ page, cityIds: [MEDELLIN_ID], zones: [] });
            } else {
                setWasiError(new Error(result?.error || "Error desconocido"));
            }
        } catch (e) {
            setWasiError(e);
        } finally {
            setWasiLoading(false);
        }
    };

    // Ya no cargar propiedades al inicio
    // useEffect(() => {
    //     fetchWasiProperties({ page: 1, cityIds: [MEDELLIN_ID], zones: [] });
    // }, []);

    const handlePageChange = (newPage) => {
        if (!lastQuery) return;
        const { cityIds = [], zones = [] } = lastQuery;
        track("pagination", {
            action: "change_page",
            from: pagination.currentPage,
            to: newPage,
            cityIds,
            zones,
            metadata: buildSearchMetadata({
                groups: selectedGroups,
                zones,
                cityIds,
                page: newPage,
                queryType: "pagination",
            }),
        });
        fetchWasiProperties({ page: newPage, cityIds, zones });
        document
            .getElementById("wasi-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Callback desde RegionCityFilter NUEVO:
    // onApply({ zones, groups })
    const handleApplyRegionCity = async ({ zones = [], groups = [] }) => {
        const groupsNorm = Array.isArray(groups) ? groups.map(norm) : [];
        setSelectedGroups(groupsNorm);
        setSelectedZones(zones || []);

        setFilterApplied(true); // <-- Mover antes de la búsqueda
        track("page_view", {
            action: "vista_resultados",
            groups: groupsNorm,
            zones,
            metadata: buildSearchMetadata({
                groups: groupsNorm,
                zones,
                page: 1,
                queryType: "results_view",
            }),
        });

        // ¿Incluye “El Poblado”? ⇒ usar ZONAS
        const hasPoblado = groupsNorm.includes("el poblado");

        if (hasPoblado && Array.isArray(zones) && zones.length > 0) {
            await fetchWasiProperties({ page: 1, cityIds: [], zones });
        } else {
            // Construir cityIds a partir de los grupos seleccionados (excluyendo “el poblado”)
            const cityIds = [];
            for (const g of groupsNorm) {
                if (g === "el poblado") continue; // aquí no suma city
                const idCity = CITY_ID_BY_GROUP[g];
                if (idCity) {
                    cityIds.push(String(idCity));
                } else {
                    console.warn(`[SRHome] Falta id_city para el grupo "${g}" en CITY_ID_BY_GROUP`);
                }
            }

            // Si el usuario eligió solo “Occidente”/“Oriente”, cityIds contendrá Medellín (496)
            // Si no hay nada válido (falta mapa), hacemos fallback a Medellín
            const finalCityIds = cityIds.length > 0 ? cityIds : [MEDELLIN_ID];

            await fetchWasiProperties({ page: 1, cityIds: finalCityIds, zones: [] });
        }

        // cerrar drawer si está abierto en móvil
        if (isMobile) setMobileFiltersOpen(false);

        setTimeout(() => {
            document.getElementById("wasi-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };



    // --- Responsive: detectar móvil y manejar drawer ---
    useEffect(() => {
        const mql = window.matchMedia("(max-width: 960px)");
        const onChange = () => setIsMobile(mql.matches);
        onChange();
        mql.addEventListener?.("change", onChange);
        return () => mql.removeEventListener?.("change", onChange);
    }, []);

    // Bloquear scroll del body cuando drawer abierto
    useEffect(() => {
        if (isMobile && mobileFiltersOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev || "";
            };
        }
    }, [isMobile, mobileFiltersOpen]);

    // Cerrar con ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && mobileFiltersOpen) setMobileFiltersOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [mobileFiltersOpen]);

    // Contador para badge del botón de filtros (móvil)
    // const filtersCount = selectedGroups.length + (selectedZones.length ? 1 : 0);

    return (
        <>
            <GlobalReset />
            <div
                style={{
                    ...styles.page,
                    background: !filterApplied ? '#f9f7f3' : styles.page.background,
                }}
            >
                <main style={{
                    ...styles.main,
                    background: '#f9f7f3',
                    paddingBottom: filterApplied ? (isMobile ? 88 : 48) : 0,
                    paddingRight: filterApplied && !isMobile ? 72 : 0,
                }}>
                    {/* Mostrar filtro centrado si no se ha aplicado */}
                    {!filterApplied ? (
                        <div style={{
                            position: 'relative',
                            minHeight: '100vh',
                            width: '100vw',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: 0,
                            paddingTop: 0,
                            background: 'transparent',
                        }}>
                            {/* Video de fondo Hero solo en la vista inicial */}
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                zIndex: 0,
                                pointerEvents: 'none',
                                overflow: 'hidden',
                            }}>
                                <Hero />
                            </div>
                            <div style={{
                                position: 'absolute',
                                zIndex: 3,
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'auto',
                                boxSizing: 'border-box',
                                padding: '3vw', // margen interior respecto al fondo del video
                            }}>
                                <div
                                    className={!filterApplied ? "profile-filter-responsive profile-filter-vertical" : "profile-filter-responsive-no-margin"}
                                    style={{
                                        minWidth: 0,

                                    }}
                                >
                                    <ProfileHeader />
                                    <RegionCityFilter
                                        onApply={handleApplyRegionCity}
                                        persistKey="rcf_selection_v1"
                                        simulatorInitialData={simulatorBoot}
                                        onSimulatorConsumed={() => setSimulatorBoot(null)}
                                        style={{ pointerEvents: wasiLoading ? 'none' : 'auto', opacity: wasiLoading ? 0.45 : 1, filter: wasiLoading ? 'blur(2px)' : 'none', transition: 'opacity .4s, filter .4s', width: '100%' }}
                                    />
                                    <style>{`
                                        .profile-filter-responsive {
                                            box-sizing: border-box;
                                            padding-left: 20px !important;
                                            padding-right: 20px !important;
                                            margin-left: auto !important;
                                            margin-right: auto !important;
                                        }
                                        .profile-filter-vertical {
                                            flex-direction: column !important;
                                            align-items: stretch !important;
                                        }
                                        .profile-filter-vertical > *:not(:first-child) {
                                            margin-top: 18px !important;
                                        }
                                        @media (max-width: 700px) {
                                            .profile-filter-responsive {
                                                padding-left: 40px !important;
                                                padding-right: 40px !important;
                                                max-width: 100vw !important;
                                            }
                                        }
                                        @media (max-width: 900px) {
                                            .profile-filter-responsive {
                                                padding-left: 18px !important;
                                                padding-right: 18px !important;
                                            }
                                        }
                                        .profile-filter-responsive-no-margin {
                                            box-sizing: border-box;
                                            margin-left: 0 !important;
                                            margin-right: 0 !important;
                                        }
                                    `}</style>
                                </div>
                                {/* Sección de aliados */}
                                <div style={{
                                    marginTop: 44,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%',
                                    maxWidth: 1240,
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                    gap: 18,
                                }}>
                                    {/* Sección de aliados temporalmente oculta */}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Controles móviles y drawer pueden ir aquí si lo deseas, o solo resultados */}
                            <div className="filtered-profile-filter-wrap">
                                <div className="filtered-profile-filter-inner">
                                    <div className="filtered-profile-col">
                                        <ProfileHeader style={{ margin: 0, padding: 0 }} />
                                    </div>
                                    <div className="filtered-filter-col">
                                        <RegionCityFilter
                                            onApply={handleApplyRegionCity}
                                            persistKey="rcf_selection_v1"
                                            compact
                                            simulatorInitialData={simulatorBoot}
                                            onSimulatorConsumed={() => setSimulatorBoot(null)}
                                            style={{ margin: 0, padding: 0, width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <style>{`
                                    .filtered-profile-filter-wrap {
                                        width: 100%;
                        
                                        margin-left: auto;
                                        margin-right: auto;
                                    }
                                    .filtered-profile-filter-inner {
                                        display: flex;
                                        flex-direction: row;
                                        align-items: flex-start;
                                        justify-content: space-between;
                                        background: #f3ede6;
                                        /* border: 1.5px solid #e6dace; */
                                        border: none !important;
                                        padding: 10px;
                                        margin: 0 0;
                                        width: 100%;
                                        min-width: 0;
                                        max-width: 100vw;
                                        box-sizing: border-box;
                                      
                                        /* box-shadow: 0 2px 16px 0 #e6dace33; */
                                        box-shadow: none !important;
                                        gap: 0;
                                    }
                                    .filtered-profile-col {
                                        display: flex;
                                        align-items: center;
                                        justify-content: flex-start;
                                        flex: 1;
                                    }
                                    .filtered-filter-col {
                                        min-width: 320px;
                                        max-width: 720px;
                                        flex: 1.4;
                                        margin: 0;
                                        padding: 0;
                                        width: 100%;
                                        display: flex;
                                        justify-content: flex-end;
                                    }
                                    @media (max-width: 700px) {
                                        .filtered-profile-filter-inner {
                                            flex-direction: column !important;
                                            align-items: stretch !important;
                                            gap: 18px !important;
                                        }
                                        .filtered-filter-col {
                                            margin-top: 12px !important;
                                            justify-content: flex-start !important;
                                            max-width: 100% !important;
                                            flex: 1 1 auto !important;
                                        }
                                    }
                                `}</style>
                            </div>
                            {/* Resultados WASI sin .srGrid wrapper */}
                            <div style={{
                                ...bandStyles.wrap,
                                width: '100%',
                                maxWidth: '100vw',
                                marginLeft: 0,
                                marginRight: 0,
                            }}>
                                <Section
                                    id="wasi-section"
                                    title={
                                        <>
                                            <span>Propiedades </span>
                                            <em style={styles.em}>Disponibles</em>
                                        </>
                                    }
                                    subtitle={`Resultados${selectedGroups.length ? ` en ${selectedGroups.join(", ")}` : ""}${selectedZones.length ? "" : ""}.`}
                                >
                                    {wasiLoading && (
                                        <div className="growIn skeleton-grid">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <SkeletonCard key={i} />
                                            ))}
                                            <style>{`
                                                .skeleton-grid {
                                                    display: grid;
                                                    grid-template-columns: repeat(3, minmax(520px, 1fr));
                                                    gap: 32px;
                                                    margin: 32px 0;
                                                    min-height: 48vh;
                                                }
                                                @media (min-width: 2200px) {
                                                    .skeleton-grid {
                                                        grid-template-columns: repeat(4, minmax(520px, 1fr));
                                                    }
                                                }
                                                @media (max-width: 1700px) {
                                                    .skeleton-grid {
                                                        grid-template-columns: repeat(2, minmax(420px, 1fr));
                                                    }
                                                }
                                                @media (max-width: 1100px) {
                                                    .skeleton-grid {
                                                        grid-template-columns: 1fr;
                                                        width: 100vw;
                                                        max-width: 100vw;
                                                        margin: 0;
                                                        padding: 0;
                                                        box-sizing: border-box;
                                                    }
                                                }
                                                @media (max-width: 700px) {
                                                    .skeleton-grid {
                                                        grid-template-columns: 1fr;
                                                        width: 100vw;
                                                        max-width: 100vw;
                                                        gap: 12px;
                                                        margin: 0;
                                                        padding: 0;
                                                    }
                                                }
                                            `}</style>
                                        </div>
                                    )}
                                    {!wasiLoading && wasiError && (
                                        <p style={{ color: "#b00020" }}>
                                            Error: {wasiError.message || "No se pudo cargar la información"}
                                        </p>
                                    )}
                                    {!wasiLoading && !wasiError && wasiProps.length === 0 && (
                                        <p style={{ color: "#6e6259", padding: "24px 0" }}>
                                            No se encontraron propiedades para esta zona. Intenta con otra.
                                        </p>
                                    )}
                                    {!wasiLoading && !wasiError && wasiProps.length > 0 && (
                                        <div className="fadeInResults">
                                            <CardGrid
                                                items={wasiProps}
                                                render={(it) => <WasiPropertyCard key={it.id || it.title} {...it} />}
                                            />
                                            <Pagination
                                                currentPage={pagination.currentPage}
                                                totalPages={pagination.totalPages}
                                                totalItems={pagination.totalItems}
                                                perPage={pagination.perPage}
                                                onPageChange={handlePageChange}
                                            />
                                        </div>
                                    )}
                                </Section>
                            </div>
                        </>
                    )}
                </main>

                <AppVersion />
                <FloatingSocial phone="573212080985" placement={filterApplied ? "side" : "bottom"} />
            </div>
        </>
    );
}
