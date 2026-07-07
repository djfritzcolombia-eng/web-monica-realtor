// src/pages/SRHome.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import GlobalReset from "../components/GlobalReset";
import Section from "../components/Section";
import CardGrid from "../components/CardGrid";
import WasiPropertyCard from "../components/cards/WasiPropertyCard";
import FloatingSocial from "../components/FloatingSocial";
import AppVersion from "../components/AppVersion";
import RegionCityFilter from "../components/RegionCityFilter";
import CreditFilterBanner from "../components/CreditFilterBanner";
import { parseSimulatorFromSearch } from "../utils/simulatorDeepLink";
import {
    filterPropertiesByCreditBudget,
    formatCreditFilterMessage,
    loadCreditSession,
    parseCreditSimulatorFromSearch,
    saveCreditSession,
} from "../utils/creditSimulatorDeepLink";
import {
    ALL_CREDIT_SEARCH_KEYS,
    ALL_CREDIT_SEARCH_LABELS,
    buildWasiSearchQuery,
    labelsFromGroupKeys,
    MEDELLIN_CITY_ID,
} from "../constants/searchZones";
import { dedupeWasiItems } from "../utils/wasiAggregateFetch";
import { fetchPublishedSellListings } from "../services/sellListingService";
import { mapPublishedListingsForScope } from "../utils/sellListingInventory";
import ProfileHeader from "../components/ProfileHeader";
import HouseLineLoader from "../components/HouseLineLoader";
import SiteTopBar from "../components/SiteTopBar";
import SiteBackButton from "../components/SiteBackButton";
import { useSessionTracking } from "../context/SessionTrackingContext";
import { useSiteSearch } from "../context/SiteSearchContext";
import { styles } from "../styles/styles";
import { paginationStyles, bandStyles } from "./SRHome.styles";
import { postRequest } from "../services/api";
import { buildSearchMetadata } from "../utils/eventMetadata";
import { filterPropertiesByQuery } from "../utils/filterPropertiesByQuery";
import {
    EMPTY_ADVANCED_FILTER,
    filterPropertiesByAdvanced,
    hasActiveAdvancedFilter,
    removeAdvancedFilterKey,
} from "../utils/propertyAdvancedFilters";
import { describeSiteSearchResult, parseSiteSearch } from "../utils/siteSearchEngine";
import "./SRHome.animations.css";
import landingStyles from "../components/LandingHero.module.css";
import resultsStyles from "./SRHome.module.css";

const PROPERTIES_PER_PAGE = 18;
const API_MAX_PER_PAGE = 100;
const CREDIT_FILTER_FETCH_POOL = API_MAX_PER_PAGE;
const SITE_SEARCH_FETCH_POOL = API_MAX_PER_PAGE;
const SITE_SEARCH_PER_ZONE = 50;
const SITE_SEARCH_PER_CITY = 100;
const SITE_SEARCH_MAX_PAGES = 5;

const clampPerPage = (value) => Math.min(API_MAX_PER_PAGE, Math.max(1, value));

// 🔠 Normalizador
const norm = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Medellín conocido en Wasi
const MEDELLIN_ID = MEDELLIN_CITY_ID;

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
                aria-label="Página anterior"
            >
                ←
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
                aria-label="Página siguiente"
            >
                →
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
        perPage: PROPERTIES_PER_PAGE,
        totalPages: 1,
        totalItems: 0,
    });
    const [filteredPool, setFilteredPool] = useState([]);
    const [advancedFilter, setAdvancedFilter] = useState(EMPTY_ADVANCED_FILTER);
    const [textSearchFilter, setTextSearchFilter] = useState(null);
    const [siteSearchLabel, setSiteSearchLabel] = useState("");

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
    const [creditSimulatorBoot, setCreditSimulatorBoot] = useState(() => parseCreditSimulatorFromSearch());
    const [creditBudgetFilter, setCreditBudgetFilter] = useState(() => {
        const fromUrl = parseCreditSimulatorFromSearch();
        if (fromUrl?.filter) return fromUrl.filter;
        return loadCreditSession()?.filter ?? null;
    });
    const [creditSearchSelection, setCreditSearchSelection] = useState(
        () => parseCreditSimulatorFromSearch()?.searchSelection ?? loadCreditSession()?.searchSelection ?? null
    );
    const [creditExpandOpen, setCreditExpandOpen] = useState(false);
    const [filteredCount, setFilteredCount] = useState(0);
    const { track } = useSessionTracking();
    const { registerSearchHandler } = useSiteSearch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialUrlSearchDone = useRef(false);
    const inventoryPoolRef = useRef([]);

    useEffect(() => {
        if (!creditSimulatorBoot) return;
        saveCreditSession({
            results: creditSimulatorBoot.results,
            filter: creditSimulatorBoot.filter,
            searchSelection: creditSimulatorBoot.searchSelection,
        });
        if (creditSimulatorBoot.filter) setCreditBudgetFilter(creditSimulatorBoot.filter);
        if (creditSimulatorBoot.searchSelection) setCreditSearchSelection(creditSimulatorBoot.searchSelection);
    }, [creditSimulatorBoot]);

    useEffect(() => {
        const session = loadCreditSession();
        if (!session?.filter && !creditBudgetFilter) return;
        const filter = session?.filter || creditBudgetFilter;
        if (filter && (!filter.basePrice || filter.basePrice > 3_000_000_000)) {
            setCreditBudgetFilter(null);
            setCreditSearchSelection(null);
            try {
                sessionStorage.removeItem("monica_credit_simulation_v1");
            } catch {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        if (!creditSimulatorBoot) return;
        track("page_view", {
            action: "credit_simulator_deep_link",
            maxPropertyPrice: creditSimulatorBoot.filter?.maxPropertyPrice,
            minPropertyPrice: creditSimulatorBoot.filter?.minPropertyPrice,
            autoSearchPick: creditSimulatorBoot.autoSearchPick,
            showResults: creditSimulatorBoot.showResults,
        });
    }, [creditSimulatorBoot, track]);

    const creditExpandData = useMemo(() => {
        if (!creditExpandOpen) return null;
        const session = loadCreditSession();
        return {
            results: session?.results,
            filter: creditBudgetFilter,
            searchSelection: creditSearchSelection,
            autoSearchPick: true,
        };
    }, [creditExpandOpen, creditBudgetFilter, creditSearchSelection]);

    const creditZoneLabels = useMemo(() => {
        if (creditSearchSelection?.allZones) return ALL_CREDIT_SEARCH_LABELS;
        if (creditSearchSelection?.groupKeys?.length) {
            return labelsFromGroupKeys(creditSearchSelection.groupKeys);
        }
        return selectedGroups.map((g) => {
            const found = labelsFromGroupKeys([g]);
            return found[0] || g;
        });
    }, [creditSearchSelection, selectedGroups]);

    const applyCreditBudgetToProperties = (items, filterOverride = null) => {
        const filter = filterOverride ?? creditBudgetFilter;
        if (!filter) return items;
        return filterPropertiesByCreditBudget(items, filter);
    };

    const applyAllClientFilters = useCallback((items, {
        creditFilter = creditBudgetFilter,
        textFilter = textSearchFilter,
        advanced = advancedFilter,
    } = {}) => {
        let filtered = applyCreditBudgetToProperties(items, creditFilter);
        if (textFilter) {
            filtered = filterPropertiesByQuery(filtered, textFilter);
        }
        filtered = filterPropertiesByAdvanced(filtered, advanced);
        return filtered;
    }, [creditBudgetFilter, textSearchFilter, advancedFilter]);

    const publishFilteredResults = useCallback((rawItems, {
        page = 1,
        paginationPatch = {},
        creditFilter = creditBudgetFilter,
        textFilter = textSearchFilter,
        advanced = advancedFilter,
    } = {}) => {
        const useLocalPool = Boolean(
            creditFilter
            || textFilter
            || hasActiveAdvancedFilter(advanced)
        );
        const filtered = applyAllClientFilters(rawItems, { creditFilter, textFilter, advanced });
        inventoryPoolRef.current = rawItems;
        setFilteredCount(filtered.length);
        const perPage = pagination.perPage;
        const targetPage = paginationPatch.currentPage ?? page;

        if (useLocalPool) {
            setFilteredPool(filtered);
            const start = (targetPage - 1) * perPage;
            setWasiProps(filtered.slice(start, start + perPage));
            setPagination((prev) => ({
                ...prev,
                ...paginationPatch,
                currentPage: targetPage,
                totalItems: filtered.length,
                totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
            }));
            return;
        }

        setFilteredPool([]);
        setWasiProps(filtered);
        setPagination((prev) => ({
            ...prev,
            ...paginationPatch,
        }));
    }, [advancedFilter, applyAllClientFilters, creditBudgetFilter, pagination.perPage, textSearchFilter]);

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
    const fetchWasiProperties = async ({
        page = 1,
        cityIds = [],
        zones = [],
        creditFilterOverride = undefined,
        textFilterOverride = undefined,
        advancedFilterOverride = undefined,
    }) => {
        const activeCreditFilter = creditFilterOverride !== undefined ? creditFilterOverride : creditBudgetFilter;
        const activeTextFilter = textFilterOverride !== undefined ? textFilterOverride : textSearchFilter;
        const activeAdvancedFilter = advancedFilterOverride !== undefined ? advancedFilterOverride : advancedFilter;
        const useLocalPool = Boolean(
            activeCreditFilter
            || activeTextFilter
            || hasActiveAdvancedFilter(activeAdvancedFilter)
        );
        const fetchSize = useLocalPool
            ? (activeTextFilter ? SITE_SEARCH_FETCH_POOL : CREDIT_FILTER_FETCH_POOL)
            : clampPerPage(pagination.perPage);
        const apiPage = useLocalPool ? 1 : page;

        const publishResults = (items, paginationPatch) => {
            publishFilteredResults(items, {
                page,
                paginationPatch,
                creditFilter: activeCreditFilter,
                textFilter: activeTextFilter,
                advanced: activeAdvancedFilter,
            });
        };

        const finalizeAndPublish = async (aggregated, scope, paginationPatch) => {
            let merged = aggregated;
            try {
                const published = await fetchPublishedSellListings();
                const storeItems = mapPublishedListingsForScope(published, scope);
                merged = dedupeWasiItems([...storeItems, ...aggregated]);
            } catch {
                merged = aggregated;
            }
            publishResults(itemsForPublish(merged), paginationPatch);
        };

        const itemsForPublish = (aggregated) =>
            activeCreditFilter || activeTextFilter ? aggregated : aggregated.slice(0, fetchSize);
        const readTotalItems = (result, mappedLength) => Number(
            result?.pagination?.total_items
            ?? result?.data?.total
            ?? result?.data?.count
            ?? mappedLength
        ) || mappedLength;
        const readTotalPages = (result) => Math.max(
            1,
            Number(result?.pagination?.total_pages ?? result?.data?.total_pages ?? 1) || 1
        );
        const fetchSearchPages = async (basePayload, perPage) => {
            const first = await postRequest("searchWasiProperties", {
                ...basePayload,
                page: apiPage,
                per_page: perPage,
            }).catch((e) => ({ __error: e }));

            if (!first || first.__error || !first.success) {
                return { items: [], totalItems: 0 };
            }

            let items = extractWasiArray(first.data).map(mapWasiItem).filter(Boolean);
            let totalItems = readTotalItems(first, items.length);
            const maxPages = activeTextFilter ? Math.min(SITE_SEARCH_MAX_PAGES, readTotalPages(first)) : 1;

            if (maxPages > 1) {
                const pageCalls = [];
                for (let nextPage = 2; nextPage <= maxPages; nextPage += 1) {
                    pageCalls.push(
                        postRequest("searchWasiProperties", {
                            ...basePayload,
                            page: nextPage,
                            per_page: perPage,
                        }).catch((e) => ({ __error: e }))
                    );
                }

                const rest = await Promise.all(pageCalls);
                rest.forEach((result) => {
                    if (!result || result.__error || !result.success) return;
                    const mapped = extractWasiArray(result.data).map(mapWasiItem).filter(Boolean);
                    items = items.concat(mapped);
                });
            }

            return { items, totalItems };
        };
        try {
            setWasiLoading(true);
            setWasiError(null);

            // Híbrido: zonas + ciudades (ej. Poblado + Envigado)
            if (Array.isArray(zones) && zones.length > 0 && Array.isArray(cityIds) && cityIds.length > 0) {
                const callCount = zones.length + cityIds.length;
                const perCall = clampPerPage(Math.max(1, Math.ceil(fetchSize / callCount)));
                const zoneCalls = zones.map((id_zone) =>
                    fetchSearchPages({
                        id_city: MEDELLIN_ID,
                        id_zone,
                    }, perCall)
                );
                const cityCalls = cityIds.map((id_city) =>
                    fetchSearchPages({
                        id_city,
                    }, perCall)
                );
                const results = await Promise.all([...zoneCalls, ...cityCalls]);
                let aggregated = [];
                results.forEach((r) => {
                    if (!r) return;
                    aggregated = aggregated.concat(r.items || []);
                });
                aggregated = dedupeWasiItems(aggregated);
                await finalizeAndPublish(aggregated, { cityIds, zones }, {
                    currentPage: page,
                    totalItems: activeCreditFilter ? aggregated.length : aggregated.length,
                    totalPages: activeCreditFilter
                        ? Math.max(1, Math.ceil(aggregated.length / pagination.perPage))
                        : Math.max(1, Math.ceil(aggregated.length / pagination.perPage)),
                });
                setLastQuery({ page, zones, cityIds });
                return;
            }

            // A) Consulta por ZONAS (El Poblado)
            if (Array.isArray(zones) && zones.length > 0) {
                const perZone = clampPerPage(
                    activeTextFilter
                        ? SITE_SEARCH_PER_ZONE
                        : Math.max(1, Math.ceil(fetchSize / zones.length)),
                );
                const calls = zones.map((id_zone) =>
                    fetchSearchPages({
                        id_city: MEDELLIN_ID, // Poblado es Medellín
                        id_zone,
                    }, perZone)
                );
                const results = await Promise.all(calls);
                let aggregated = [];
                let totalItemsSum = 0;
                results.forEach((r) => {
                    if (!r) return;
                    aggregated = aggregated.concat(r.items || []);
                    totalItemsSum += Number(r.totalItems) || 0;
                });
                // dedupe
                const seen = new Set();
                aggregated = aggregated.filter((it) => {
                    const key = it.id || it.href || it.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                await finalizeAndPublish(aggregated, { cityIds: [], zones }, {
                    currentPage: page,
                    totalItems: activeCreditFilter || activeTextFilter ? aggregated.length : totalItemsSum,
                    totalPages: activeCreditFilter || activeTextFilter
                        ? Math.max(1, Math.ceil(aggregated.length / pagination.perPage))
                        : Math.max(1, Math.ceil(totalItemsSum / pagination.perPage)),
                });
                setLastQuery({ page, zones, cityIds: [] });
                return;
            }
            // B) Consulta por CIUDADES
            if (Array.isArray(cityIds) && cityIds.length > 0) {
                if (cityIds.length === 1) {
                    const { items, totalItems } = await fetchSearchPages(
                        { id_city: cityIds[0] },
                        clampPerPage(activeTextFilter ? SITE_SEARCH_PER_CITY : fetchSize)
                    );
                    await finalizeAndPublish(items, { cityIds, zones: [] }, {
                        currentPage: page,
                        totalPages: activeCreditFilter || activeTextFilter
                            ? Math.max(1, Math.ceil(items.length / pagination.perPage))
                            : Math.max(1, Math.ceil(totalItems / pagination.perPage)),
                        totalItems: activeCreditFilter || activeTextFilter
                            ? items.length
                            : totalItems,
                    });
                    setLastQuery({ page, cityIds, zones: [] });
                    return;
                }
                // varias ciudades (agregación manual)
                const perCity = clampPerPage(
                    activeTextFilter
                        ? SITE_SEARCH_PER_CITY
                        : Math.max(1, Math.ceil(fetchSize / cityIds.length)),
                );
                const results = await Promise.all(
                    cityIds.map((id_city) => fetchSearchPages({ id_city }, perCity))
                );
                let aggregated = [];
                let totalItemsSum = 0;
                results.forEach((r) => {
                    if (!r) return;
                    aggregated = aggregated.concat(r.items || []);
                    totalItemsSum += Number(r.totalItems) || 0;
                });
                // dedupe
                const seen = new Set();
                aggregated = aggregated.filter((it) => {
                    const key = it.id || it.href || it.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                await finalizeAndPublish(aggregated, { cityIds, zones: [] }, {
                    currentPage: page,
                    totalItems: activeCreditFilter || activeTextFilter ? aggregated.length : totalItemsSum,
                    totalPages: activeCreditFilter || activeTextFilter
                        ? Math.max(1, Math.ceil(aggregated.length / pagination.perPage))
                        : Math.max(1, Math.ceil(totalItemsSum / pagination.perPage)),
                });
                setLastQuery({ page, cityIds, zones: [] });
                return;
            }
            // C) fallback: Medellín sin zonas
            const payload = { id_city: MEDELLIN_ID, page: apiPage, per_page: fetchSize };
            const result = await postRequest("searchWasiProperties", payload);
            if (result?.success) {
                const arr = extractWasiArray(result.data);
                const mapped = arr.map(mapWasiItem).filter(Boolean);
                await finalizeAndPublish(mapped, { cityIds: [MEDELLIN_ID], zones: [] }, {
                    currentPage: page,
                    totalPages: activeCreditFilter
                        ? Math.max(1, Math.ceil(mapped.length / pagination.perPage))
                        : (result.pagination?.total_pages || 1),
                    totalItems: activeCreditFilter
                        ? mapped.length
                        : (result.pagination?.total_items || mapped.length),
                });
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

    const runCreditSearch = async ({ filter, searchSelection }) => {
        const query = buildWasiSearchQuery({
            allZones: searchSelection?.allZones,
            groupKeys: searchSelection?.groupKeys || [],
        });

        setFilterApplied(true);
        markResultsInHistory();
        setSelectedGroups(query.groupLabels || query.groupKeysNorm);
        setSelectedZones(query.zoneIds);
        setCreditSearchSelection(searchSelection);
        saveCreditSession({
            results: loadCreditSession()?.results,
            filter,
            searchSelection,
        });

        await fetchWasiProperties({
            page: 1,
            cityIds: query.cityIds,
            zones: query.zoneIds,
            creditFilterOverride: filter,
        });
        setLastQuery({ page: 1, cityIds: query.cityIds, zones: query.zoneIds });

        setTimeout(() => {
            document.getElementById("wasi-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    };

    const handleCreditBudgetApply = async ({ filter, searchSelection, results }) => {
        setCreditBudgetFilter(filter);
        setCreditSimulatorBoot(null);
        setCreditExpandOpen(false);

        if (results) {
            saveCreditSession({ results, filter, searchSelection });
        }

        if (!searchSelection) return;

        track("simulator_apply_budget", {
            action: "apply_credit_budget_filter_home",
            ...searchSelection,
            ...filter,
        });

        await runCreditSearch({ filter, searchSelection });
    };

    const clearCreditBudgetFilter = () => {
        setCreditBudgetFilter(null);
        setCreditSearchSelection(null);
        setFilteredPool([]);
        try {
            const session = loadCreditSession();
            if (session) {
                saveCreditSession({ ...session, filter: null, searchSelection: null });
            }
        } catch {
            // ignore
        }
        if (lastQuery) {
            fetchWasiProperties({ ...lastQuery, creditFilterOverride: null });
        }
    };

    const handleBackToSearch = (source = "button") => {
        track("navigation", { action: "back_to_search", source });
        setFilterApplied(false);
        setWasiProps([]);
        setWasiError(null);
        setLastQuery(null);
        setFilteredPool([]);
        inventoryPoolRef.current = [];
        setAdvancedFilter(EMPTY_ADVANCED_FILTER);
        setTextSearchFilter(null);
        setSiteSearchLabel("");
        setPagination({
            currentPage: 1,
            perPage: PROPERTIES_PER_PAGE,
            totalPages: 1,
            totalItems: 0,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        if (!filterApplied) return undefined;
        const onPopState = () => handleBackToSearch("browser");
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [filterApplied]);

    const markResultsInHistory = () => {
        try {
            window.history.pushState({ monicaView: "results" }, "");
        } catch {
            // ignore
        }
    };

    const handleExpandCreditFilter = () => {
        setCreditExpandOpen(true);
    };

    const handleSiteSearchRef = useRef(async () => {});

    const runSitePropertySearch = useCallback(async (parsed) => {
        const zoneKeys = parsed.zones.map((zone) => zone.key);
        const query = zoneKeys.length > 0
            ? buildWasiSearchQuery({ groupKeys: zoneKeys })
            : buildWasiSearchQuery({ allZones: true });

        setTextSearchFilter(parsed);
        setSelectedGroups(zoneKeys.length ? labelsFromGroupKeys(zoneKeys) : []);
        setSelectedZones(query.zoneIds || []);
        setFilterApplied(true);
        markResultsInHistory();

        track("site_search_results", {
            action: "search_properties",
            query: parsed.query,
            zones: zoneKeys,
            bedrooms: parsed.bedrooms,
            stratum: parsed.stratum,
            propertyTypes: parsed.propertyTypes,
            keywords: parsed.keywords,
            metadata: buildSearchMetadata({
                groups: zoneKeys,
                zones: query.zoneIds,
                page: 1,
                queryType: "site_search",
            }),
        });

        await fetchWasiProperties({
            page: 1,
            cityIds: query.cityIds || [],
            zones: query.zoneIds || [],
            textFilterOverride: parsed,
            creditFilterOverride: null,
        });
        setLastQuery({ page: 1, cityIds: query.cityIds || [], zones: query.zoneIds || [] });

        setTimeout(() => {
            document.getElementById("wasi-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
    }, [track]);

    const handleSiteSearch = useCallback(async (rawQuery) => {
        const parsed = parseSiteSearch(rawQuery);
        setSiteSearchLabel(describeSiteSearchResult(parsed));

        if (searchParams.get("q")) {
            const next = new URLSearchParams(searchParams);
            next.delete("q");
            setSearchParams(next, { replace: true });
        }

        track("site_search", {
            action: parsed.action,
            query: parsed.query,
            zones: parsed.zones?.map((z) => z.key) || [],
            bedrooms: parsed.bedrooms,
            stratum: parsed.stratum,
            propertyTypes: parsed.propertyTypes,
            keywords: parsed.keywords,
        });

        switch (parsed.action) {
            case "empty":
                return;
            case "navigate_sell":
                navigate("/vender");
                return;
            case "navigate_home":
                handleBackToSearch("site_search");
                return;
            case "open_notary":
                setSimulatorBoot({ launch: true });
                return;
            case "open_credit_simulator":
                setCreditSimulatorBoot({ openSimulator: true });
                return;
            case "open_credit_application":
                setCreditSimulatorBoot({ openApplication: true });
                return;
            case "search_properties":
            default:
                await runSitePropertySearch(parsed);
        }
    }, [
        navigate,
        runSitePropertySearch,
        searchParams,
        setSearchParams,
        track,
        handleBackToSearch,
    ]);

    handleSiteSearchRef.current = handleSiteSearch;

    useEffect(() => {
        registerSearchHandler((query) => handleSiteSearchRef.current(query));
        return () => registerSearchHandler(null);
    }, [registerSearchHandler]);

    useEffect(() => {
        if (initialUrlSearchDone.current) return;
        const q = searchParams.get("q");
        if (!q) return;
        initialUrlSearchDone.current = true;
        handleSiteSearch(q);
    }, [handleSiteSearch, searchParams]);

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

        if ((creditBudgetFilter || textSearchFilter || hasActiveAdvancedFilter(advancedFilter)) && filteredPool.length > 0) {
            const perPage = pagination.perPage;
            const start = (newPage - 1) * perPage;
            setWasiProps(filteredPool.slice(start, start + perPage));
            setPagination((prev) => ({ ...prev, currentPage: newPage }));
            document
                .getElementById("wasi-section")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        fetchWasiProperties({ page: newPage, cityIds, zones });
        document
            .getElementById("wasi-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Callback desde RegionCityFilter NUEVO:
    // onApply({ zones, groups })
    const handleApplyRegionCity = async ({ zones = [], cityIds = [], groups = [] }) => {
        const groupsNorm = Array.isArray(groups) ? groups.map(norm) : [];
        const query = (cityIds?.length || zones?.length)
            ? { groupKeysNorm: groupsNorm, cityIds, zoneIds: zones.map(String) }
            : buildWasiSearchQuery({ groupKeys: groupsNorm });

        setSelectedGroups(query.groupKeysNorm?.length ? query.groupKeysNorm : groupsNorm);
        setSelectedZones(query.zoneIds || []);
        setFilterApplied(true);
        markResultsInHistory();

        track("page_view", {
            action: "vista_resultados",
            groups: groupsNorm,
            zones: query.zoneIds,
            cityIds: query.cityIds,
            metadata: buildSearchMetadata({
                groups: groupsNorm,
                zones: query.zoneIds,
                page: 1,
                queryType: "results_view",
            }),
        });

        await fetchWasiProperties({
            page: 1,
            cityIds: query.cityIds || [],
            zones: query.zoneIds || [],
        });
        setLastQuery({ page: 1, cityIds: query.cityIds || [], zones: query.zoneIds || [] });

        if (isMobile) setMobileFiltersOpen(false);

        setTimeout(() => {
            document.getElementById("wasi-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    const handleAdvancedFilterApply = (nextFilter) => {
        setAdvancedFilter(nextFilter);
        track("filter_applied", {
            action: "advanced_property_filters",
            filters: nextFilter,
        });

        if (!filterApplied) return;

        const pool = inventoryPoolRef.current;
        if (pool.length > 0) {
            publishFilteredResults(pool, {
                page: 1,
                paginationPatch: { currentPage: 1 },
                advanced: nextFilter,
            });
            setLastQuery((prev) => (prev ? { ...prev, page: 1 } : prev));
            return;
        }

        if (lastQuery) {
            fetchWasiProperties({
                page: 1,
                cityIds: lastQuery.cityIds || [],
                zones: lastQuery.zones || [],
                advancedFilterOverride: nextFilter,
            });
            setLastQuery({ ...lastQuery, page: 1 });
        }
    };

    const handleAdvancedFilterChipRemove = (chipKey) => {
        const nextFilter = removeAdvancedFilterKey(advancedFilter, chipKey);
        setAdvancedFilter(nextFilter);
        track("filter_applied", {
            action: "remove_advanced_filter_chip",
            chip: chipKey,
        });

        if (!filterApplied) return;

        const pool = inventoryPoolRef.current;
        if (pool.length > 0) {
            publishFilteredResults(pool, {
                page: 1,
                paginationPatch: { currentPage: 1 },
                advanced: nextFilter,
            });
            setLastQuery((prev) => (prev ? { ...prev, page: 1 } : prev));
            return;
        }

        if (lastQuery) {
            fetchWasiProperties({
                page: 1,
                cityIds: lastQuery.cityIds || [],
                zones: lastQuery.zones || [],
                advancedFilterOverride: nextFilter,
            });
            setLastQuery({ ...lastQuery, page: 1 });
        }
    };

    // --- Responsive: detectar móvil y manejar drawer ---
    useEffect(() => {
        const mql = window.matchMedia("(max-width: 700px)");
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

    const handleBrandHome = useCallback((event) => {
        if (filterApplied) {
            event.preventDefault();
            handleBackToSearch("brand");
        }
    }, [filterApplied]);

    const handleBackNavigation = () => {
        if (window.history.state?.monicaView === "results") {
            window.history.back();
            return;
        }
        handleBackToSearch("button");
    };

    // Contador para badge del botón de filtros (móvil)
    // const filtersCount = selectedGroups.length + (selectedZones.length ? 1 : 0);

    return (
        <>
            <GlobalReset />
            <div style={styles.page}>
                <main style={{
                    ...styles.main,
                    paddingBottom: filterApplied ? (isMobile ? 88 : 48) : 0,
                }}>
                    {!filterApplied ? (
                        <div className={landingStyles.hero}>
                            <SiteTopBar showNav editorial onBrandClick={handleBrandHome} />
                            <div className={landingStyles.heroInner}>
                                <div className={landingStyles.heroBody}>
                                    <header className={landingStyles.intro} aria-label="Presentación">
                                        <ProfileHeader centered hideTitle introRing showHandle={false} heroAvatar />
                                        <Link
                                            to="/"
                                            className={landingStyles.nameLink}
                                            onClick={handleBrandHome}
                                        >
                                            <h1 className={landingStyles.name}>Mónica Fritz</h1>
                                        </Link>
                                        <p className={landingStyles.profileHandle}>@MónicaFritzRealtor</p>
                                    </header>

                                    <section className={landingStyles.message} aria-label="Mensaje de acompañamiento">
                                        <div className={landingStyles.messagePaper}>
                                            <p className={landingStyles.editorialText}>
                                                <span className={landingStyles.editorialLine}>
                                                    Te acompaño a definir tus objetivos, entender tu capacidad de compra y construir
                                                </span>
                                                <span className={landingStyles.editorialLine}>
                                                    la estrategia adecuada para tomar decisiones inmobiliarias inteligentes.
                                                </span>
                                            </p>
                                        </div>
                                    </section>

                                    <hr className={landingStyles.divider} aria-hidden />

                                    <section className={landingStyles.searchBlock} aria-label="Buscar propiedad">
                                        <RegionCityFilter
                                            headingIntro
                                            onApply={handleApplyRegionCity}
                                            persistKey="rcf_selection_v1"
                                            simulatorInitialData={simulatorBoot}
                                            onSimulatorConsumed={() => setSimulatorBoot(null)}
                                            creditSimulatorInitialData={creditSimulatorBoot}
                                            onCreditSimulatorConsumed={() => setCreditSimulatorBoot(null)}
                                            onCreditBudgetApply={handleCreditBudgetApply}
                                            creditExpandOpen={creditExpandOpen}
                                            onCreditExpandClose={() => setCreditExpandOpen(false)}
                                            creditExpandData={creditExpandData}
                                            advancedFilter={advancedFilter}
                                            onAdvancedFilterApply={handleAdvancedFilterApply}
                                            onAdvancedFilterChipRemove={handleAdvancedFilterChipRemove}
                                            style={{ width: "100%" }}
                                        />
                                    </section>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <SiteTopBar showNav onBrandClick={handleBrandHome} />
                            <div className={resultsStyles.resultsBar}>
                                <div className={resultsStyles.resultsBarInner}>
                                    <div className={resultsStyles.resultsHeroGrid}>
                                        <div className={resultsStyles.resultsHeroLeft}>
                                            <SiteBackButton
                                                onClick={handleBackNavigation}
                                                label="Volver"
                                                compact
                                            />
                                        </div>
                                        <div className={resultsStyles.resultsHeroCenter}>
                                            <ProfileHeader centered hideTitle compact />
                                        </div>
                                        <div className={resultsStyles.resultsHeroRight}>
                                            <RegionCityFilter
                                                onApply={handleApplyRegionCity}
                                                persistKey="rcf_selection_v1"
                                                compact
                                                simulatorInitialData={simulatorBoot}
                                                onSimulatorConsumed={() => setSimulatorBoot(null)}
                                                creditSimulatorInitialData={creditSimulatorBoot}
                                                onCreditSimulatorConsumed={() => setCreditSimulatorBoot(null)}
                                                onCreditBudgetApply={handleCreditBudgetApply}
                                                creditExpandOpen={creditExpandOpen}
                                                onCreditExpandClose={() => setCreditExpandOpen(false)}
                                                creditExpandData={creditExpandData}
                                                advancedFilter={advancedFilter}
                                                onAdvancedFilterApply={handleAdvancedFilterApply}
                                                onAdvancedFilterChipRemove={handleAdvancedFilterChipRemove}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={resultsStyles.resultsSection} style={bandStyles.wrap}>
                                <Section
                                    id="wasi-section"
                                    titleAnimated
                                    eyebrow="Inventario disponible"
                                    title={(
                                        <>
                                            Propiedades <span style={styles.em}>disponibles</span>
                                        </>
                                    )}
                                    subtitle={
                                        siteSearchLabel
                                        || (selectedGroups.length
                                            ? `Explorando ${selectedGroups.join(", ")}`
                                            : "Explora el inventario disponible")
                                    }
                                >
                                    <CreditFilterBanner
                                        filter={creditBudgetFilter}
                                        zoneLabels={creditZoneLabels}
                                        resultCount={!wasiLoading ? filteredCount : null}
                                        onExpand={handleExpandCreditFilter}
                                        onClear={clearCreditBudgetFilter}
                                    />
                                    {wasiLoading && (
                                        <HouseLineLoader label="Buscando propiedades…" />
                                    )}
                                    {!wasiLoading && wasiError && (
                                        <p style={{ color: "#b00020" }}>
                                            Error: {wasiError.message || "No se pudo cargar la información"}
                                        </p>
                                    )}
                                    {!wasiLoading && !wasiError && wasiProps.length === 0 && (
                                        <div style={{ color: "#6e6259", padding: "24px 0", textAlign: "center" }}>
                                            {creditBudgetFilter?.maxPropertyPrice ? (
                                                <>
                                                    <p style={{ margin: "0 0 16px" }}>
                                                        {formatCreditFilterMessage(creditBudgetFilter)} — no hay coincidencias en esta selección.
                                                    </p>
                                                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                                                        <button
                                                            type="button"
                                                            onClick={handleExpandCreditFilter}
                                                            style={{
                                                                border: "1.5px solid #d8a48f",
                                                                background: "#fff",
                                                                color: "#d8a48f",
                                                                borderRadius: 999,
                                                                padding: "12px 20px",
                                                                fontWeight: 700,
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Ampliar zonas de búsqueda
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={clearCreditBudgetFilter}
                                                            style={{
                                                                border: "1px solid #c9b9a8",
                                                                background: "#fff",
                                                                color: "#6e6259",
                                                                borderRadius: 999,
                                                                padding: "12px 20px",
                                                                fontWeight: 700,
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Quitar filtro de precio
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p style={{ margin: 0 }}>No se encontraron propiedades para esta zona. Intenta con otra.</p>
                                            )}
                                        </div>
                                    )}
                                    {!wasiLoading && !wasiError && wasiProps.length > 0 && (
                                        <div className="fadeInResults">
                                            <CardGrid
                                                items={wasiProps}
                                                render={(it) => (
                                                    <WasiPropertyCard
                                                        key={it.id || it.title}
                                                        {...it}
                                                        inBudget={!!creditBudgetFilter}
                                                    />
                                                )}
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
                <FloatingSocial phone="573212080985" placement="bottom" />
            </div>
        </>
    );
}
