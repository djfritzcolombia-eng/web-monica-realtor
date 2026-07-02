import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { APP_VERSION } from "../config/version";
import { parseSimulatorFromSearch } from "../utils/simulatorDeepLink";
import { endSession, initSession, trackEvent } from "../services/sessionTracker";

const SessionTrackingContext = createContext({
    track: () => {},
});

const LISTENERS_KEY = "mf_tracking_listeners";

export function useSessionTracking() {
    return useContext(SessionTrackingContext);
}

export function SessionTrackingProvider({ children }) {
    const track = useCallback((type, data) => {
        trackEvent(type, data);
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem(LISTENERS_KEY)) return undefined;

        const deepLink = parseSimulatorFromSearch();
        initSession({
            appVersion: APP_VERSION,
            deepLink: deepLink
                ? {
                    source: "simulator_share",
                    propertyValue: deepLink.propertyValue,
                    propertyType: deepLink.propertyType,
                    showResults: deepLink.showResults,
                }
                : null,
        });

        sessionStorage.setItem(LISTENERS_KEY, "1");

        const onPageHide = () => endSession("page_hide");
        const onBeforeUnload = () => endSession("before_unload");

        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, []);

    const value = useMemo(() => ({ track }), [track]);

    return (
        <SessionTrackingContext.Provider value={value}>
            {children}
        </SessionTrackingContext.Provider>
    );
}
