import { useEffect, useState } from "react";
import { WasiService } from "../services/wasiService";

export function useWasiSearch(city: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        const ac = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await WasiService.searchProperties({ location_city: city, /* más filtros */ });
                if (mounted) setData(res);
            } catch (e: any) {
                if (mounted) setError(e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
            ac.abort();
        };
    }, [city]);

    return { data, loading, error };
}
