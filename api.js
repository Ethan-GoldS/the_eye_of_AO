/**
 * API functions for fetching data from Arweave and AO Network
 */
import { dryrun, connect } from "https://unpkg.com/@permaweb/aoconnect@0.0.82/dist/browser.js";
import { BLOCK_TRACKING_PROCESS } from './config.js';
import { generateQuery } from './processes.js';

// Cache for API responses
const responseCache = new Map();

const getConnection = () => connect({ CU_URL: "https://ur-cu.randao.net" });
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
 * Fetches Rune Realm player streak data
 * @returns {Promise<Array>} Array of daily streak data
 */
export async function fetchRuneRealmStats() {
    try {
        const cacheKey = 'runerealm-stats';
        // Use cached data if it's less than 20 minutes old
        if (responseCache.has(cacheKey)) {
            const { data, timestamp } = responseCache.get(cacheKey);
            if (Date.now() - timestamp < 20 * 60 * 1000) {
                return data;
            }
        }
        
        const { dryrun } = getConnection();
        // Fetch Rune Realm streak data from AO
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
        
        // Verify we got a valid response
        if (!response || !response.Messages || !response.Messages[0]) {
            throw new Error('Invalid response from Rune Realm API');
        }
        
        // Extract the streak data from the response
        const dataStr = response.Messages[0].Data;
        const rawData = JSON.parse(dataStr);
        
        if (!rawData.BreakdownByDay) {
            throw new Error('Missing BreakdownByDay data in Rune Realm response');
        }
        
        console.log('Raw Rune Realm data:', rawData);
        
        // Transform the data into the format expected by the chart
        const streakData = [];
        
        // Convert days since Unix epoch to actual dates
        Object.entries(rawData.BreakdownByDay).forEach(([day, breakdowns]) => {
            // Day number represents days since Jan 1, 1970 (Unix epoch start)
            // We need to multiply by milliseconds in a day (24*60*60*1000 = 86400000)
            // Unix epoch starts at midnight UTC on January 1, 1970
            const timestampMs = parseInt(day) * 86400000;
            const timestamp = new Date(timestampMs);
            
            // Log the conversion for debugging
            console.log(`Converting day ${day} to date: ${timestamp.toISOString()} (${timestamp.toLocaleDateString()})`);
            
            streakData.push({
                timestamp,
                day,
                breakdowns
            });
        });
        
        // Sort by timestamp
        streakData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Log the processed data for debugging
        console.log('Processed Rune Realm Streak Data:', JSON.stringify(streakData, null, 2));
        
        // Verify that all breakdowns have Low field
        streakData.forEach((day, index) => {
            console.log(`Day ${day.day} breakdown:`, day.breakdowns);
            if (day.breakdowns.Low === undefined) {
                console.warn(`Day ${day.day} is missing Low value! Adding default of 0.`);
                day.breakdowns.Low = 0;
            }
            if (day.breakdowns.Medium === undefined) {
                console.warn(`Day ${day.day} is missing Medium value! Adding default of 0.`);
                day.breakdowns.Medium = 0;
            }
            if (day.breakdowns.High === undefined) {
                console.warn(`Day ${day.day} is missing High value! Adding default of 0.`);
                day.breakdowns.High = 0;
            }
        });
        
        // Cache the result
        responseCache.set(cacheKey, {
            data: streakData,
            timestamp: Date.now()
        });
        
        return streakData;
    } catch (error) {
        console.error("Error fetching Rune Realm stats:", error);
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
 * Clears the API response cache
 */
export function clearCache() {
    responseCache.clear();
}