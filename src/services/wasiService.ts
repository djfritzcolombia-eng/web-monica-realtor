import { HttpClient, QueryParams } from "./httpClient";

const BASE_URL = "https://api.wasi.co/v1";
const WASI_TOKEN = import.meta.env.VITE_WASI_TOKEN ?? "";
const COMPANY_ID = import.meta.env.VITE_WASI_COMPANY_ID ?? "";

if (!WASI_TOKEN || !COMPANY_ID) {
    // Log suave para desarrollo
    // eslint-disable-next-line no-console
    console.warn("WASI env vars missing. Check VITE_WASI_TOKEN and VITE_WASI_COMPANY_ID");
}

const client = new HttpClient({
    baseUrl: BASE_URL,
    defaultHeaders: {
        // Si Wasi requiere headers, agrégalos aquí. Por ahora, va por query string.
    },
    timeoutMs: 15000,
});

export interface WasiSearchParams extends QueryParams {
    id_company?: string | number;
    wasi_token?: string;
    location_city?: string;
    // agrega más filtros soportados por Wasi aquí (price, bedrooms, etc.)
}

export class WasiService {
    /**
     * Realiza la búsqueda de propiedades en Wasi (GET).
     * @example
     * searchProperties({ location_city: "Medellin" })
     */
    static async searchProperties(params: WasiSearchParams) {
        const finalParams: WasiSearchParams = {
            id_company: params.id_company ?? COMPANY_ID,
            wasi_token: params.wasi_token ?? WASI_TOKEN,
            ...params,
        };

        return client.get<any>("/property/search", {
            params: finalParams,
        });
    }
}
