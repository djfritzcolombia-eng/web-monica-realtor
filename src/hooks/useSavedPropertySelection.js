import { useCallback, useMemo, useState } from "react";
import { MAX_CATALOG_PROPERTIES } from "../utils/propertyCatalog";

export default function useSavedPropertySelection() {
    const [selectedMap, setSelectedMap] = useState({});

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
        selectedMap,
        selectedProperties,
        selectedCount,
        toggleProperty,
        clearSelection,
        isSelected,
        maxReached: selectedCount >= MAX_CATALOG_PROPERTIES,
    };
}
