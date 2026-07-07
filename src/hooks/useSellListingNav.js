import { useEffect, useState } from "react";
import { fetchSellListingById, SELL_LISTING_STATUSES } from "../services/sellListingService";
import { readSellListingTracking } from "../utils/sellListingTracking";

const DEFAULT_NAV = {
    label: "Vender",
    to: "/vender",
    badge: null,
    activeClass: false,
};

export function useSellListingNav(isSellRoute) {
    const [nav, setNav] = useState(DEFAULT_NAV);

    useEffect(() => {
        const tracking = readSellListingTracking();
        if (!tracking?.id) {
            setNav(DEFAULT_NAV);
            return;
        }

        let active = true;

        (async () => {
            try {
                const listing = await fetchSellListingById(tracking.id);
                if (!active || !listing) return;

                if (listing.status === SELL_LISTING_STATUSES.needs_revision) {
                    setNav({
                        label: "Corregir solicitud",
                        to: `/vender?id=${listing.id}`,
                        badge: "!",
                        activeClass: isSellRoute,
                    });
                    return;
                }

                if ([
                    SELL_LISTING_STATUSES.pending,
                    SELL_LISTING_STATUSES.approved,
                    SELL_LISTING_STATUSES.published,
                    SELL_LISTING_STATUSES.withdrawn,
                    SELL_LISTING_STATUSES.rejected,
                ].includes(listing.status)) {
                    setNav({
                        label: "Mi solicitud",
                        to: `/vender?id=${listing.id}`,
                        badge: null,
                        activeClass: isSellRoute,
                    });
                }
            } catch {
                if (active) setNav(DEFAULT_NAV);
            }
        })();

        return () => {
            active = false;
        };
    }, [isSellRoute]);

    return nav;
}
