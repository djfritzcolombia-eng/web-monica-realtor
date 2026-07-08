import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_CATALOG_PROPERTIES } from "../utils/propertyCatalog";

const STORAGE_KEY = "monica_saved_properties_v1";

function readStoredMap() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function writeStoredMap(map) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // ignore quota errors
    }
}

export default function useSavedPropertySelection() {
    const [selectedMap, setSelectedMap] = useState(() => readStoredMap());
    const [selectionMode, setSelectionMode] = useState(false);

    useEffect(() => {
        writeStoredMap(selectedMap);
    }, [selectedMap]);

    const selectedProperties = useMemo(
        () => Object.values(selectedMap),
        [selectedMap]
    );

    const selectedCount = selectedProperties.length;

    const toggleProperty = useCallback((property) => {
        const key = String(property.id);
        setSelectedMap((prev) => {
            const next = { ...prev };
            if (next[key]) {
                delete next[key];
                return next;
            }
            if (Object.keys(next).length >= MAX_CATALOG_PROPERTIES) {
                return prev;
            }
            next[key] = property;
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedMap({});
    }, []);

    const isSelected = useCallback(
        (propertyId) => Boolean(selectedMap[String(propertyId)]),
        [selectedMap]
    );

    return {
        selectionMode,
        setSelectionMode,
        selectedMap,
        selectedProperties,
        selectedCount,
        toggleProperty,
        clearSelection,
        isSelected,
        maxReached: selectedCount >= MAX_CATALOG_PROPERTIES,
    };
}
