/** Extrae valor numérico COP desde etiquetas como "$ 450.000.000" */
export function parsePriceFromLabel(label) {
    if (!label) return null;
    const digits = String(label).replace(/[^\d]/g, "");
    const value = Number(digits);
    return Number.isFinite(value) && value > 0 ? value : null;
}

export function buildSearchMetadata({
    groups = [],
    zones = [],
    cityIds = [],
    page = 1,
    queryType = null,
} = {}) {
    return {
        busqueda: {
            zonas: groups,
            grupos: groups,
            zoneIds: zones,
            cityIds,
            pagina: page,
            tipoConsulta: queryType,
            textoResumen: groups.length
                ? `Búsqueda en: ${groups.join(", ")}`
                : "Sin zona seleccionada",
        },
    };
}

export function buildPropertyMetadata({
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
    imageCount = 0,
} = {}) {
    const valorNumerico = salePrice || rentPrice || parsePriceFromLabel(priceLabel);

    return {
        inmueble: {
            id: id ?? null,
            titulo: title ?? null,
            tipoInmueble: propertyType || null,
            operacion: operationType || null,
            valorLabel: priceLabel || null,
            valorNumerico,
            valorVenta: salePrice ?? null,
            valorArriendo: rentPrice ?? null,
            ciudad: city || null,
            zona: zone || null,
            direccion: address || null,
            habitaciones: bedrooms ?? null,
            banos: bathrooms ?? null,
            garajes: garages ?? null,
            area: areaValue ? `${areaValue}${areaUnit ? ` ${areaUnit}` : ""}` : null,
            estado: condition || null,
            estrato: stratum ?? null,
            piso: floor ?? null,
            ano: year ?? null,
            administracion: adminFeeLabel || null,
            url: href || null,
            totalFotos: imageCount,
        },
    };
}

export function buildPhotosMetadata({
    vioFotos = false,
    abrioModalAmpliar = false,
    fotosVistasEnCarrusel = 0,
    fotosVistasEnModal = 0,
    totalFotos = 0,
    indicesCarrusel = [],
    indicesModal = [],
} = {}) {
    return {
        fotos: {
            vioFotos,
            abrioModalAmpliar,
            fotosVistasEnCarrusel,
            fotosVistasEnModal,
            totalFotos,
            vioGaleriaCompleta:
                totalFotos > 0 &&
                (fotosVistasEnCarrusel + fotosVistasEnModal) >= totalFotos,
            indicesCarrusel,
            indicesModal,
            resumen: vioFotos
                ? `Vio ${fotosVistasEnCarrusel + fotosVistasEnModal} de ${totalFotos} fotos`
                : "No vio fotos",
        },
    };
}

export function buildSimulatorMetadata({
    propertyValue,
    mortgageBalance,
    propertyType,
    buyerTotal,
    sellerTotal,
} = {}) {
    return {
        simulador: {
            valorInmueble: propertyValue ?? null,
            saldoHipoteca: mortgageBalance ?? null,
            tipoInmueble: propertyType || null,
            totalComprador: buyerTotal ?? null,
            totalVendedor: sellerTotal ?? null,
        },
    };
}

export function mergeMetadata(...parts) {
    return parts.reduce((acc, part) => {
        if (!part || typeof part !== "object") return acc;
        return { ...acc, ...part };
    }, {});
}
