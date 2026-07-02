export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface HttpClientOptions {
    baseUrl: string;
    defaultHeaders?: Record<string, string>;
    timeoutMs?: number; // opcional: timeout
}

export class HttpClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private timeoutMs: number;

    constructor({ baseUrl, defaultHeaders = {}, timeoutMs = 15000 }: HttpClientOptions) {
        this.baseUrl = baseUrl.replace(/\/+$/, ""); // sin trailing slash
        this.defaultHeaders = defaultHeaders;
        this.timeoutMs = timeoutMs;
    }

    private buildUrl(path: string, params?: QueryParams): string {
        const url = new URL(`${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`);
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== "") {
                    url.searchParams.set(k, String(v));
                }
            });
        }
        return url.toString();
    }

    private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        let timer: any;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
        });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    }

    async get<T = unknown>(
        path: string,
        opts?: {
            params?: QueryParams;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }
    ): Promise<T> {
        const url = this.buildUrl(path, opts?.params);

        const req = fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...this.defaultHeaders,
                ...(opts?.headers || {}),
            },
            signal: opts?.signal,
        });

        const res = await this.withTimeout(req, this.timeoutMs);

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${text || "No body"}`);
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return (await res.json()) as T;
        }
        // fallback: texto u otros tipos
        return (await res.text()) as unknown as T;
    }
}
