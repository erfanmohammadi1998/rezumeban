/* eslint-disable react-hooks/use-memo, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Runs an async function and tracks {data, loading, error, reload}.
 * `deps` controls when it re-runs. `fn` is read through a ref so callers can
 * pass an inline closure without churning the effect.
 */
export default function useAsync(fn, deps = [], { immediate = true } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const fnRef = useRef(fn);
    useEffect(() => {
        fnRef.current = fn;
    });

    const run = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fnRef.current();
            setData(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, deps);

    useEffect(() => {
        if (immediate) run().catch(() => {});
    }, deps);

    return { data, loading, error, reload: run, setData };
}
