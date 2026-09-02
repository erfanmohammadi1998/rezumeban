import { useSearchParams } from "react-router-dom";

/**
 * Thin helper around useSearchParams for list-page filters.
 * `get(key)` reads a param, `patch({...})` writes several (empty = delete)
 * and resets `page` unless told otherwise.
 */
export default function useUrlFilters() {
    const [params, setParams] = useSearchParams();

    const get = (key, fallback = "") => params.get(key) ?? fallback;

    const patch = (next, { resetPage = true } = {}) => {
        setParams(
            (prev) => {
                const p = new URLSearchParams(prev);
                Object.entries(next).forEach(([k, v]) => {
                    if (v === "" || v == null) p.delete(k);
                    else p.set(k, String(v));
                });
                if (resetPage) p.delete("page");
                return p;
            },
            { replace: true }
        );
    };

    const clear = (keys) => {
        setParams(
            (prev) => {
                const p = new URLSearchParams(prev);
                keys.forEach((k) => p.delete(k));
                p.delete("page");
                return p;
            },
            { replace: true }
        );
    };

    return { params, get, patch, clear };
}
