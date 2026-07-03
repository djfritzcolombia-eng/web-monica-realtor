import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SiteSearchContext = createContext(null);

export function SiteSearchProvider({ children }) {
    const navigate = useNavigate();
    const handlerRef = useRef(null);

    const registerSearchHandler = useCallback((handler) => {
        handlerRef.current = typeof handler === "function" ? handler : null;
    }, []);

    const executeSearch = useCallback((rawQuery) => {
        const query = String(rawQuery || "").trim();
        if (!query) return false;

        if (handlerRef.current) {
            handlerRef.current(query);
            return true;
        }

        navigate(`/?q=${encodeURIComponent(query)}`);
        return true;
    }, [navigate]);

    const value = useMemo(
        () => ({ registerSearchHandler, executeSearch }),
        [registerSearchHandler, executeSearch],
    );

    return (
        <SiteSearchContext.Provider value={value}>
            {children}
        </SiteSearchContext.Provider>
    );
}

export function useSiteSearch() {
    const ctx = useContext(SiteSearchContext);
    if (!ctx) {
        throw new Error("useSiteSearch must be used within SiteSearchProvider");
    }
    return ctx;
}
