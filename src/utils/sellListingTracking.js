import { SELL_LISTING_STORAGE_KEY, SELL_LISTING_VERIFIED_KEY } from "../constants/sellListingRevision";

export function saveSellListingTracking(payload) {
    localStorage.setItem(SELL_LISTING_STORAGE_KEY, JSON.stringify({
        ...payload,
        savedAt: Date.now(),
    }));
}

export function readSellListingTracking() {
    try {
        const raw = localStorage.getItem(SELL_LISTING_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function markListingVerified(listingId) {
    const current = new Set(readVerifiedListingIds());
    current.add(listingId);
    sessionStorage.setItem(SELL_LISTING_VERIFIED_KEY, JSON.stringify([...current]));
}

export function readVerifiedListingIds() {
    try {
        const raw = sessionStorage.getItem(SELL_LISTING_VERIFIED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function isListingVerified(listingId) {
    return readVerifiedListingIds().includes(listingId);
}
