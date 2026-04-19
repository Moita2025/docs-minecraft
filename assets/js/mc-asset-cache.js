const MCAssetCache = (function() {
    const cache = new Map();
    const ongoingFetches = new Map();  // 防止重复请求（请求进行中）

    /**
     * 带去重和缓存的 fetch
     * @param {string} url 
     * @returns {Promise<any>}
     */
    async function fetchWithCache(url) {
        // 如果已经在缓存中，直接返回
        if (cache.has(url)) {
            return cache.get(url);
        }

        // 如果正在请求中，复用同一个 Promise（防重复请求）
        if (ongoingFetches.has(url)) {
            return ongoingFetches.get(url);
        }

        const fetchPromise = fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                cache.set(url, data);
                return data;
            })
            .catch(err => {
                console.error(`Fetch failed for ${url}:`, err);
                ongoingFetches.delete(url);
                throw err;
            });

        ongoingFetches.set(url, fetchPromise);

        try {
            const result = await fetchPromise;
            return result;
        } finally {
            ongoingFetches.delete(url);
        }
    }

    // 清空缓存（可选，用于调试或版本更新）
    function clearCache() {
        cache.clear();
        ongoingFetches.clear();
    }

    return {
        fetchWithCache,
        clearCache,
        // 可选：暴露缓存大小查看
        getCacheSize: () => cache.size
    };
})();

// 导出（如果用模块化）或直接挂到 window
window.MCAssetCache = MCAssetCache;