/**
 * API functions for fetching data from Arweave and AO Network
 */
import { dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.82/dist/browser.js";
import { BLOCK_TRACKING_PROCESS } from './config.js';
import { generateQuery } from './processes.js';

// Cache for API responses
const responseCache = new Map();

/**
 * Fetches the current Arweave network information
 * @returns {Promise<Object>} Network info including current block height
 */
export async function fetchNetworkInfo() {
    try {
        const cacheKey = 'network-info';
        // Use cached data if it's less than 5 minutes old
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                return data;
            }
        }

        const response = await fetch("https://arweave.net/info");
        if (!response.ok) {
            throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the result
        responseCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        console.error("Error fetching network info:", error);
        throw error;
    }
}

/**
 * Fetches block history from AO process
 * @returns {Promise<Array>} Array of block data with dates and heights
 */
export async function fetchBlockHistory() {
    try {
        const cacheKey = 'block-history';
        // Use cached data if it's less than 15 minutes old
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 15 * 60 * 1000) {
                return data;
            }
        }
        
        const blockHistoryResponse = await dryrun({
            process: BLOCK_TRACKING_PROCESS,
            data: '',
            tags: [
                { name: "Action", value: "BlocksHistory" },
                { name: "Data-Protocol", value: "ao" },
                { name: "Type", value: "Message" },
                { name: "Variant", value: "ao.TN.1" }
            ],
        });

        if (
            !blockHistoryResponse || 
            !blockHistoryResponse.Messages || 
            !blockHistoryResponse.Messages[0] || 
            !blockHistoryResponse.Messages[0].Tags
        ) {
            throw new Error("Invalid block history response");
        }

        const dailyBlocksTag = blockHistoryResponse.Messages[0].Tags.find(
            tag => tag.name === "DailyBlocks"
        );

        if (!dailyBlocksTag) {
            throw new Error("No DailyBlocks tag found in the response");
        }

        const blockData = JSON.parse(dailyBlocksTag.value);
        
        // Sort blocks by date (descending)
        const sortedData = blockData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Cache the result
        responseCache.set(cacheKey, {
            data: sortedData,
            timestamp: Date.now()
        });
        
        return sortedData;
    } catch (error) {
        console.error("Error fetching block history:", error);
        throw error;
    }
}

/**
 * Fetches supply history for wAR tokens
 * @returns {Promise<Object>} Object with wAR supply data
 */
export async function fetchSupplyHistory() {
    try {
        const cacheKey = 'supply-history';
        // Use cached data if it's less than 30 minutes old
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 30 * 60 * 1000) {
                return data;
            }
        }
        
        // Fetch wAR supply history
        const [wARResponse] = await Promise.all([
            dryrun({
                process: 'Bi6bSPz-IyOCX9ZNedmLzv7Z6yxsrj9nHE1TnZzm_ks',
                data: '',
                tags: [
                    { name: "Action", value: "SupplyHistory" },
                    { name: "Data-Protocol", value: "ao" },
                    { name: "Type", value: "Message" },
                    { name: "Variant", value: "ao.TN.1" }
                ],
            })
        ]);

        // Process wAR data
        const wARSupplyTag = wARResponse.Messages[0].Tags.find(
            tag => tag.name === "DailySupply"
        );
        const wARSupplyData = JSON.parse(wARSupplyTag.value);

        const supplyData = {
            wAR: wARSupplyData
        };
        
        // Cache the result
        responseCache.set(cacheKey, {
            data: supplyData,
            timestamp: Date.now()
        });
        
        return supplyData;
    } catch (error) {
        console.error("Error fetching supply history:", error);
        throw error;
    }
}

/**
 * Fetches transaction counts for a specific process type over multiple time periods
 * @param {string} processName - The name of the process
 * @param {Array} periods - Array of time periods with start/end heights
 * @param {number} currentHeight - Current blockchain height
 * @returns {Promise<Array>} Array of transaction counts for each period
 */
export async function fetchProcessData(processName, periods, currentHeight) {
    try {
        // Create a unique cache key for this request
        const cacheKey = `${processName}-${JSON.stringify(periods.map(p => p.startHeight + '-' + p.endHeight))}`;
        
        // Check if we have cached data that's less than 10 minutes old
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 10 * 60 * 1000) {
                return data;
            }
        }
        
        // Process all periods in chunks (5 at a time) to avoid overwhelming the server
        const CHUNK_SIZE = 5;
        const results = [];
        
        for (let i = 0; i < periods.length; i += CHUNK_SIZE) {
            const chunk = periods.slice(i, i + CHUNK_SIZE);
            
            // Process chunk in parallel
            const chunkResults = await Promise.all(chunk.map(async (period, index) => {
                try {
                    const query = await generateQuery(
                        processName,
                        period.startHeight,
                        period.endHeight,
                        currentHeight
                    );
                    
                    const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query }),
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Network error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    if (result.errors) {
                        console.error(`GraphQL errors for ${processName}:`, result.errors);
                        return {
                            timestamp: period.endTime,
                            count: 0
                        };
                    }
                    
                    return {
                        timestamp: period.endTime,
                        count: result.data.transactions.count
                    };
                } catch (error) {
                    console.error(`Error fetching data for ${processName} (period ${i + index}):`, error);
                    return {
                        timestamp: period.endTime,
                        count: 0
                    };
                }
            }));
            
            results.push(...chunkResults);
            
            // Add a small delay between chunks to avoid rate limiting
            if (i + CHUNK_SIZE < periods.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Cache the results
        responseCache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });
        
        return results;
    } catch (error) {
        console.error(`Error fetching process data for ${processName}:`, error);
        throw error;
    }
}

/**
 * Fetches daily player stats for Stargrid Battle Tactics
 * @returns {Promise<Array>} Array of daily player count data
 */
export async function fetchStargridStats() {
    try {
        const cacheKey = 'stargrid-history';
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 15 * 60 * 1000) {
                return data;
            }
        }

        const response = await dryrun({
            process: 'wTTkZPnORwkt8PMV7CpJ4KVHUV3cY8pWKJgHkUEGM4g',
            data: '',
            tags: [
                { name: "Action", value: "GetDailyStats" },
                { name: "Data-Protocol", value: "ao" },
                { name: "Type", value: "Message" },
                { name: "Variant", value: "ao.TN.1" }
            ],
        });

        const statsTag = response.Messages[0]?.Tags.find(t => t.name === "DailyStats");
        if (!statsTag) throw new Error("No DailyStats tag found");

        const raw = JSON.parse(statsTag.value);
        let data = Object.entries(raw).map(([ts, d]) => ({
            timestamp: new Date(Number(ts)).toISOString(),
            count: d.ActiveUsersCount
        }));

        const todayTag = response.Messages[0]?.Tags.find(t => t.name === "TodayStats");
        if (todayTag) {
            const todayData = JSON.parse(todayTag.value);
            data.push({
                timestamp: new Date(todayData.Date).toISOString(),
                count: todayData.ActiveUsersCount
            });
        }

        // Sort data
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        responseCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    } catch (err) {
        console.error("Error fetching stargrid history:", err);
        throw err;
    }
}

/**
 * Fetches Rune Realm Streaks data
 * @returns {Promise<Object>} Object with streak breakdown data by day
 */
export async function fetchRuneRealmStats() {
    try {
        const cacheKey = 'rune-realm-streaks';
        // Use cached data if it's less than 15 minutes old
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 15 * 60 * 1000) {
                return data;
            }
        }
        
        const response = await dryrun({
            process: 'GhNl98tr7ZQxIJHx4YcVdGh7WkT9dD7X4kmQOipvePQ',
            data: '',
            tags: [
                { name: "Action", value: "GetCheckinMapping" },
                { name: "Data-Protocol", value: "ao" },
                { name: "Type", value: "Message" },
                { name: "Variant", value: "ao.TN.1" }
            ],
        });

        if (!response || !response.Messages || !response.Messages[0]) {
            throw new Error('Invalid response from Rune Realm process');
        }

        // Get the first message's data
        const message = response.Messages[0];
        const messageData = JSON.parse(message.Data);
        
        // Extract the History object from the data
        if (!messageData || !messageData.History) {
            throw new Error('No History data found in response');
        }

        const historyData = messageData.History;
        
        // Cache the result
        responseCache.set(cacheKey, {
            data: historyData,
            timestamp: Date.now()
        });
        
        return historyData;
    } catch (error) {
        console.error("Error fetching Rune Realm stats:", error);
        throw error;
    }
}

/**
 * Clears the API response cache
 */
export function clearCache() {
    responseCache.clear();
}
