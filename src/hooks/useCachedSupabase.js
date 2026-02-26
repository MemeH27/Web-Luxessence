import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for caching Supabase queries with localStorage
 * @param {string} table - Table name
 * @param {object} options - Query options
 * @param {number} options.cacheTime - Cache duration in milliseconds (default: 5 minutes)
 * @param {boolean} options.enabled - Whether to enable the hook
 */
export const useCachedQuery = (table, options = {}) => {
    const { cacheTime = 5 * 60 * 1000, enabled = true } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);

    const cacheKey = `lux_cache_${table}`;

    const getCachedData = useCallback(() => {
        if (!enabled) return null;

        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > cacheTime;

                if (!isExpired) {
                    return data;
                }
            }
        } catch (err) {
            console.warn('Cache read error:', err);
        }
        return null;
    }, [cacheKey, cacheTime, enabled]);

    const setCachedData = useCallback((newData) => {
        try {
            const cacheData = {
                data: newData,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (err) {
            console.warn('Cache write error:', err);
        }
    }, [cacheKey]);

    const fetchData = useCallback(async (queryFn) => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check cache first
            const cachedData = getCachedData();
            if (cachedData) {
                setData(cachedData);
                setLastFetched(Date.now());
            }

            // Fetch fresh data
            const result = await queryFn();

            if (result.error) throw result.error;

            setData(result.data);
            setLastFetched(Date.now());

            // Update cache
            if (result.data) {
                setCachedData(result.data);
            }
        } catch (err) {
            console.error(`Error fetching ${table}:`, err);
            setError(err.message);

            // If we have cached data, use it as fallback
            const cachedData = getCachedData();
            if (cachedData) {
                setData(cachedData);
            }
        } finally {
            setLoading(false);
        }
    }, [enabled, getCachedData, setCachedData, table]);

    const clearCache = useCallback(() => {
        try {
            localStorage.removeItem(cacheKey);
            setData(null);
            setLastFetched(null);
        } catch (err) {
            console.warn('Cache clear error:', err);
        }
    }, [cacheKey]);

    return {
        data,
        loading,
        error,
        lastFetched,
        fetchData,
        clearCache,
        isStale: lastFetched ? Date.now() - lastFetched > cacheTime : true
    };
};

/**
 * Hook for caching product catalog
 */
export const useProductsCache = () => {
    const fetchProducts = useCallback(async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('is_coming_soon', false)
            .order('name');

        if (error) throw error;
        return { data, error: null };
    }, []);

    return useCachedQuery('products', { cacheTime: 10 * 60 * 1000 });
};

/**
 * Hook for caching customers
 */
export const useCustomersCache = () => {
    const fetchCustomers = useCallback(async () => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('first_name');

        if (error) throw error;
        return { data, error: null };
    }, []);

    return useCachedQuery('customers', { cacheTime: 5 * 60 * 1000 });
};

/**
 * Hook for caching categories
 */
export const useCategoriesCache = () => {
    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) throw error;
        return { data, error: null };
    }, []);

    return useCachedQuery('categories', { cacheTime: 30 * 60 * 1000 });
};

export default useCachedQuery;
