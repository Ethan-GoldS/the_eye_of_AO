import { DATA_REFRESH_INTERVAL} from './config.js';
import { PROCESSES } from './processes.js';
import { 
    fetchNetworkInfo, 
    fetchBlockHistory, 
    fetchProcessData, 
    fetchSupplyHistory,
    fetchStargridStats,
    clearCache
} from './api.js';
import { 
    initializeCharts, 
    historicalData, 
    updateChartTimeRange,
    updateCombinedChart,
    fetchChartData
} from './charts.js';
import { 
    initializeUI, 
    toggleMainLoader, 
    toggleChartLoader, 
    updateNetworkInfoDisplay, 
    setupTimeRangeButtons,
    getChartTimeRange
} from './ui.js';
import { 
    getDailyPeriods, 
    getWeeklyPeriods,
    getLastDailyCheckpoint,
    getLastSundayCheckpoint,
    findBlockNearDate
} from './utils.js';

/**
 * Fetches additional weekly data for time range changes
 * @param {string} processName - The process name
 * @param {string} timeRange - The selected time range
 * @returns {Promise<void>}
 */
async function fetchAdditionalWeeklyData(processName, timeRange) {
    if (!processName.includes('weekly')) return;
    
    try {
        // Fetch network info and block history if not already available
        const networkInfo = window.currentNetworkInfo || await fetchNetworkInfo();
        window.currentNetworkInfo = networkInfo;
        
        const blockData = window.currentBlockData || await fetchBlockHistory();
        window.currentBlockData = blockData;
        
        const currentHeight = networkInfo.height;
        
        if (timeRange === '1M' && historicalData[processName]?.length > 0) {
            // Check if we already have enough data for 1M
            const hasEnoughDataFor1M = historicalData[processName].some(item => {
                const age = new Date() - new Date(item.timestamp);
                // If we have data that's at least 25 days old, we probably have enough for 1M
                return age >= (25 * 24 * 60 * 60 * 1000);
            });
            
            if (hasEnoughDataFor1M) {
                updateChartTimeRange(processName, timeRange);
                return true;
            }
        }
        
        // Generate more historical weekly periods based on the selected time range
        let extendedPeriods;
        if (timeRange === '1M') {
            // For 1 month, we need around 4 weeks of data
            extendedPeriods = generateWeeklyPeriods(currentHeight, blockData, 4);
        } else if (timeRange === '3M') {
            // For 3 months, we need around 12 weeks of data
            extendedPeriods = generateWeeklyPeriods(currentHeight, blockData, 12);
        } else {
            // For shorter time ranges, use the current periods
            return; // No additional data needed
        }
        
        // Get the existing data
        const existingData = historicalData[processName] || [];
        
        // Filter out periods we already have data for
        const newPeriods = extendedPeriods.filter(period => {
            // Check if we already have data for this week
            return !existingData.some(item => isSameWeek(item.timestamp, period.endTime));
        });
        
        if (newPeriods.length === 0) {
            return;
        }
        
        // Fetch the data for new periods
        const newData = await fetchProcessData(processName, newPeriods, currentHeight);
        
        if (newData.length > 0) {
            // Merge new data with existing data, preventing duplicates
            const mergedData = [...existingData]; // Start with existing data
            
            newData.forEach(newItem => {
                // Check if we already have data for this week
                const existingIndex = mergedData.findIndex(item => 
                    isSameWeek(item.timestamp, newItem.timestamp)
                );
                
                if (existingIndex >= 0) {
                    // Update existing entry instead of adding a duplicate
                    // Only update if the new entry is more recent or has different data
                    const existingTime = new Date(mergedData[existingIndex].timestamp).getTime();
                    const newTime = new Date(newItem.timestamp).getTime();
                    
                    if (newTime >= existingTime || mergedData[existingIndex].count !== newItem.count) {
                        mergedData[existingIndex] = newItem;
                    }
                } else {
                    // Add new entry if we don't have data for this week yet
                    mergedData.push(newItem);
                }
            });
            
            // Sort chronologically
            const sortedData = mergedData.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            // Update historical data
            historicalData[processName] = sortedData;
            
            updateChartTimeRange(processName, timeRange);
            return true; // Return success
        } else {
            console.log(`No new data points found for ${processName}`);
        }
        
    } catch (error) {
        console.error(`Error fetching additional weekly data for ${processName}:`, error);
    }
}


/**
 * Generates weekly periods for time series data
 * @param {number} currentHeight - The current block height
 * @param {Array} blockData - Array of block data
 * @param {number} weeks - Number of weeks to generate
 * @returns {Array} Array of weekly time periods
 */
function generateWeeklyPeriods(currentHeight, blockData, weeks = 12) {
    // Find the most recent Sunday at 0:00 UTC
    const lastCheckpoint = getLastSundayCheckpoint(new Date());

    // For the current period, we need to find the block at the start of this week
    const currentWeekStartBlock = findBlockNearDate(blockData, lastCheckpoint);
    
    // Add current period (from last Sunday to now)
    const periods = [{
        endTime: new Date(),
        startTime: lastCheckpoint,
        endHeight: currentHeight,
        startHeight: currentWeekStartBlock ? currentWeekStartBlock.blockHeight : blockData[0].blockHeight
    }];

    // Then add historical periods 
    for (let i = 1; i < weeks; i++) {
        const endDate = new Date(lastCheckpoint);
        endDate.setDate(endDate.getDate() - (i - 1) * 7);

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        // Find blocks closest to these dates
        const endBlock = findBlockNearDate(blockData, endDate);
        const startBlock = findBlockNearDate(blockData, startDate);

        if (endBlock && startBlock) {
            periods.push({
                endTime: endDate,
                startTime: startDate,
                endHeight: endBlock.blockHeight,
                startHeight: startBlock.blockHeight
            });
        }
    }

    // Sort periods chronologically
    return periods.sort((a, b) => a.startTime - b.startTime);
}
/**
 * Fetches additional historical data for a specific process when a longer time range is selected
 * @param {string} processName - The process name
 * @param {string} timeRange - The selected time range
 * @returns {Promise<void>}
 */
export async function fetchAdditionalData(processName, timeRange) {
    try {
        
        // Fetch network info and block history if not already available
        const networkInfo = window.currentNetworkInfo || await fetchNetworkInfo();
        window.currentNetworkInfo = networkInfo;
        
        const blockData = window.currentBlockData || await fetchBlockHistory();
        window.currentBlockData = blockData;
        
        const currentHeight = networkInfo.height;
        
        // Generate more historical periods based on the selected time range
        let extendedPeriods;
        if (timeRange === '1M') {
            // For 1 month, we need to get around 30 days of data
            extendedPeriods = generateExtendedDailyPeriods(currentHeight, blockData, 30);
        } else if (timeRange === '3M') {
            // For 3 months, we need to get around 90 days of data
            extendedPeriods = generateExtendedDailyPeriods(currentHeight, blockData, 90);
        } else {
            // For shorter time ranges, use the current periods
            return; // No additional data needed
        }
        
        if (processName === 'wUSDCTransfer') {
            // Similar handling for wUSDC/USDA
            await fetchAndUpdateProcessData('wUSDCTransfer', extendedPeriods, currentHeight);
            await fetchAndUpdateProcessData('USDATransfer', extendedPeriods, currentHeight);
            updateChartTimeRange('wUSDCTransfer', timeRange);
            return;
        }
        
        // For single-process charts
        await fetchAndUpdateProcessData(processName, extendedPeriods, currentHeight);
        updateChartTimeRange(processName, timeRange);
    } catch (error) {
        console.error(`Error fetching additional data for ${processName}:`, error);
    }
}

// Helper function to fetch and update data for a single process
async function fetchAndUpdateProcessData(processName, periods, currentHeight) {
    // Helper function to format date as YYYY-MM-DD for comparison
    const formatDateForComparison = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    // Get the existing data
    const existingData = historicalData[processName] || [];
    
    // Create a map of existing data by date
    const existingDateMap = new Map();
    existingData.forEach(item => {
        const dateKey = formatDateForComparison(item.timestamp);
        existingDateMap.set(dateKey, item);
    });
    
    // Filter out periods we already have data for
    const newPeriods = periods.filter(period => {
        const dateKey = formatDateForComparison(period.endTime);
        return !existingDateMap.has(dateKey);
    });
    
    if (newPeriods.length === 0) {
        return;
    }
    
    
    // Fetch the data for new periods
    const newData = await fetchProcessData(processName, newPeriods, currentHeight);
    
    if (newData.length > 0) {
        
        // Instead of just concatenating arrays, merge while preventing duplicates
        const mergedData = [...existingData]; // Start with existing data
        
        newData.forEach(newItem => {
            const newDateKey = formatDateForComparison(newItem.timestamp);
            
            // Check if we already have data for this date
            const existingIndex = mergedData.findIndex(item => 
                formatDateForComparison(item.timestamp) === newDateKey
            );
            
            if (existingIndex >= 0) {
                // Update existing entry instead of adding a duplicate
                mergedData[existingIndex] = newItem;
            } else {
                // Add new entry if we don't have data for this date yet
                mergedData.push(newItem);
            }
        });
        
        // Sort chronologically
        const sortedData = mergedData.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        // Update historical data
        historicalData[processName] = sortedData;
    } else {
        console.log(`No new data points found for ${processName}`);
    }
}

/**
 * Generates extended daily periods for longer historical data
 * @param {number} currentHeight - The current block height
 * @param {Array} blockData - Array of block data
 * @param {number} days - Number of days to generate
 * @returns {Array} Array of time periods
 */
function generateExtendedDailyPeriods(currentHeight, blockData, days) {
    // Find the most recent 0:00 UTC day
    const lastCheckpoint = getLastDailyCheckpoint(new Date());
    
    // Create periods for the specified number of days
    const periods = [];
    
    // Add current period first (from last 0:00 UTC to now)
    periods.push({
        endTime: new Date(),
        startTime: lastCheckpoint,
        endHeight: currentHeight,
        startHeight: blockData[0].blockHeight
    });
    
    // Then add historical periods
    for (let i = 1; i < days; i++) {
        const endDate = new Date(lastCheckpoint);
        endDate.setUTCDate(endDate.getUTCDate() - (i - 1));
        
        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - 1);
        
        // Find blocks closest to these dates
        const endBlock = findBlockNearDate(blockData, endDate);
        const startBlock = findBlockNearDate(blockData, startDate);
        
        if (endBlock && startBlock) {
            periods.push({
                endTime: endDate,
                startTime: startDate,
                endHeight: endBlock.blockHeight,
                startHeight: startBlock.blockHeight
            });
        }
    }
    
    return periods;
}


/**
 * Updates the supply chart with data from the wAR processes
 */
async function updateSupplyChart() {
    try {
        toggleChartLoader('wARTotalSupply', true);
        
        const supplyData = await fetchSupplyHistory();
        if (!supplyData) throw new Error('Failed to fetch supply data');
        
        // Process only wAR supply data
        const processedData = supplyData.wAR.map(d => ({
            timestamp: d.date,
            wARSupply: Number(d.totalSupply) / 1e12
        }));
        
        // Ensure timestamps are properly formatted as date strings
        const formattedData = processedData.map(entry => ({
            ...entry,
            timestamp: new Date(entry.timestamp).toISOString()
        }));
        
        // Update historical data
        historicalData['wARTotalSupply'] = formattedData;
        
        // Update chart
        const timeRange = getChartTimeRange('wARTotalSupply');
        updateChartTimeRange('wARTotalSupply', timeRange);
        
        toggleChartLoader('wARTotalSupply', false);
    } catch (error) {
        console.error('Error updating supply chart:', error);
        toggleChartLoader('wARTotalSupply', false);
    }
}

/**
 * Updates the Stargrid chart with data 
 */
export async function updateStargridChart() {
    try {
        toggleChartLoader('stargrid', true);

        const stargridData = await fetchStargridStats();
        if (!stargridData) throw new Error('Failed to fetch Stargrid data');

        // Ensure valid date format
        const formattedData = stargridData.map(entry => ({
            ...entry,
            timestamp: new Date(entry.timestamp).toISOString()
        }));

        // Store in historicalData
        historicalData['stargrid'] = formattedData;

        // Update chart with current range
        const timeRange = getChartTimeRange('stargrid');
        updateChartTimeRange('stargrid', timeRange);

        toggleChartLoader('stargrid', false);
    } catch (error) {
        console.error('Error updating Stargrid chart:', error);
        toggleChartLoader('stargrid', false);
    }
}


/**
 * Fetches and updates data for a specific process
 * @param {string} processName - The process name
 * @param {Array} periods - Array of time periods
 * @param {number} currentHeight - Current block height
 */
/**
 * Fetches and updates data for a specific process
 * @param {string} processName - The process name
 * @param {Array} periods - Array of time periods
 * @param {number} currentHeight - Current block height
 */
async function updateProcessData(processName, periods, currentHeight) {
    try {
        toggleChartLoader(processName, true);
        
        // Fetch the data
        const periodData = await fetchProcessData(processName, periods, currentHeight);
        
        // For first load or complete refresh
        if (!historicalData[processName] || historicalData[processName].length === 0) {
            historicalData[processName] = periodData;
        } else {
            // Merge with existing data, preserving the newest timestamps
            mergeProcessData(processName, periodData, processName.includes('weekly'));
        }
        
        // Update the chart
        const timeRange = getChartTimeRange(processName);
        updateChartTimeRange(processName, timeRange);
        
        toggleChartLoader(processName, false);
    } catch (error) {
        console.error(`Error updating ${processName} data:`, error);
        toggleChartLoader(processName, false);
    }
}

/**
 * Merges new process data with existing data, preserving the newest timestamps
 * @param {string} processName - The process name
 * @param {Array} newData - The new data to merge
 * @param {boolean} isWeekly - Whether this is weekly data
 */
function mergeProcessData(processName, newData, isWeekly = false) {
    if (!newData || newData.length === 0) return;
    
    // Get existing data
    const existingData = [...(historicalData[processName] || [])];
    
    // Helper function to determine if two dates are the same day/week
    const areSamePeriod = (date1, date2) => {
        if (isWeekly) {
            return isSameWeek(date1, date2);
        } else {
            return formatDateForComparison(date1) === formatDateForComparison(date2);
        }
    };
    
    // Merge new data with existing data
    newData.forEach(newItem => {
        // Find if we have an entry for this date/week
        const existingIndex = existingData.findIndex(item => 
            areSamePeriod(item.timestamp, newItem.timestamp)
        );
        
        if (existingIndex >= 0) {
            // Compare timestamps to keep the most recent
            const existingTime = new Date(existingData[existingIndex].timestamp).getTime();
            const newTime = new Date(newItem.timestamp).getTime();
            
            // Update if the new item has a newer timestamp or different count
            if (newTime > existingTime || existingData[existingIndex].count !== newItem.count) {
                existingData[existingIndex] = newItem;
            }
        } else {
            // Add new entry if we don't have data for this period yet
            existingData.push(newItem);
        }
    });
    
    // Sort the data chronologically
    const sortedData = existingData.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Update historical data
    historicalData[processName] = sortedData;
}

/**
 * Fetches data for all processes
 */
async function fetchAllData() {
    try {
        // Fetch network info and block history - this part was working
        const [networkInfo, blockData] = await Promise.all([
            fetchNetworkInfo(),
            fetchBlockHistory()
        ]);
        
        // Store globally for reuse in fetchAdditionalData
        window.currentNetworkInfo = networkInfo;
        window.currentBlockData = blockData;
        
        const currentHeight = networkInfo.height;
        console.log(`Current network height: ${currentHeight}`);
        
        // Generate daily and weekly periods
        const dailyPeriods = getDailyPeriods(currentHeight, blockData);
        const oneWeekPeriods = generateExtendedDailyPeriods(currentHeight, blockData, 7);
        const weeklyPeriods = generateWeeklyPeriods(currentHeight, blockData, 12);
        
        // Update network info display
        const latestPeriod = dailyPeriods[dailyPeriods.length - 1];
        updateNetworkInfoDisplay(currentHeight, latestPeriod);
        
        // Update supply chart
        await updateSupplyChart();
        
        // Process all daily and weekly data in parallel
        const processPromises = [];
        
        // Add daily process data fetches
        Object.keys(PROCESSES).forEach(processName => {
            if (!processName.includes('weekly') && processName !== 'wARTotalSupply') {
                // Use 1-week periods for standard charts that need less initial data
                const periods = ['AOTransfer', 'permaswap', 'botega', 'llamaLand'].includes(processName) 
                    ? oneWeekPeriods 
                    : dailyPeriods;
                    
                processPromises.push(updateProcessData(processName, periods, currentHeight));
            }
        });
        
        // Add weekly process data fetches
        Object.keys(PROCESSES).forEach(processName => {
            if (processName.includes('weekly')) {
                processPromises.push(updateProcessData(processName, weeklyPeriods, currentHeight));
            }
        });

        // Wait for all processes to update
        await Promise.allSettled(processPromises);
        
        // Hide main loader after first data fetch
        toggleMainLoader(false);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        toggleMainLoader(false);
    }
}

/**
 * Updates only today's data for a specific process
 * @param {string} processName - The process name
 * @param {Array} periods - Array with only today's period
 * @param {number} currentHeight - Current block height
 */
async function updateTodayProcessData(processName, periods, currentHeight) {
    try {
        toggleChartLoader(processName, true);
        
        // Fetch the data for today
        const todayData = await fetchProcessData(processName, periods, currentHeight);
        
        if (todayData.length > 0) {
            const today = formatDateForComparison(new Date());
            
            // Get existing data
            const existingData = [...historicalData[processName]];
            
            // Find and update today's entry if it exists
            const todayIndex = existingData.findIndex(item => 
                formatDateForComparison(item.timestamp) === today
            );
            
            if (todayIndex !== -1) {
                // Compare timestamps as Date objects for accurate time comparison
                const existingTime = new Date(existingData[todayIndex].timestamp).getTime();
                const newTime = new Date(todayData[0].timestamp).getTime();
                
                // Only update if the new data is more recent or has a different count
                if (newTime >= existingTime || existingData[todayIndex].count !== todayData[0].count) {
                    existingData[todayIndex] = todayData[0];
                }
            } else {
                // Add today's entry if it doesn't exist
                existingData.push(todayData[0]);
            }
            
            // Sort the data chronologically
            const sortedData = existingData.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            // Update historical data
            historicalData[processName] = sortedData;
        }
        
        // Update the chart with current time range
        const timeRange = getChartTimeRange(processName);
        updateChartTimeRange(processName, timeRange);
        
        toggleChartLoader(processName, false);
    } catch (error) {
        console.error(`Error updating today's data for ${processName}:`, error);
        toggleChartLoader(processName, false);
    }
}

/**
 * Updates only the current week's data for a weekly process
 * @param {string} processName - The process name
 * @param {Array} periods - Array with only the current week's period
 * @param {number} currentHeight - Current block height
 */
async function updateCurrentWeekData(processName, periods, currentHeight) {
    try {
        toggleChartLoader(processName, true);
        
        // Fetch the data for the current week
        const weekData = await fetchProcessData(processName, periods, currentHeight);
        
        if (weekData.length > 0) {
            // Get existing data
            const existingData = [...historicalData[processName]];
            
            // Find and update current week's entry if it exists
            const currentWeekIndex = existingData.findIndex(item => 
                isSameWeek(item.timestamp, weekData[0].timestamp)
            );
            
            if (currentWeekIndex !== -1) {
                // Compare timestamps as Date objects for accurate time comparison
                const existingTime = new Date(existingData[currentWeekIndex].timestamp).getTime();
                const newTime = new Date(weekData[0].timestamp).getTime();
                
                // Only update if the new data is more recent or has a different count
                if (newTime >= existingTime || existingData[currentWeekIndex].count !== weekData[0].count) {
                    existingData[currentWeekIndex] = weekData[0];
                }
            } else {
                // Add current week's entry if it doesn't exist
                existingData.push(weekData[0]);
            }
            
            // Sort the data chronologically
            const sortedData = existingData.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            // Update historical data
            historicalData[processName] = sortedData;
        }
        
        // Update the chart
        const timeRange = getChartTimeRange(processName);
        updateChartTimeRange(processName, timeRange);
        
        toggleChartLoader(processName, false);
    } catch (error) {
        console.error(`Error updating current week's data for ${processName}:`, error);
        toggleChartLoader(processName, false);
    }
}

/**
 * Helper function to format a date as YYYY-MM-DD for comparison
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDateForComparison(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Checks if two dates are in the same week
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are in the same week
 */
function isSameWeek(date1, date2) {
    // Get the week start (Sunday) for both dates
    const getWeekStart = (date) => {
        const result = new Date(date);
        const day = result.getDay();
        result.setDate(result.getDate() - day); // Go back to Sunday
        result.setHours(0, 0, 0, 0);
        return result;
    };
    
    const week1 = getWeekStart(date1);
    const week2 = getWeekStart(date2);
    
    return week1.getTime() === week2.getTime();
}
/**
 * Initializes the dashboard with improved loader removal
 */
async function initializeDashboard() {
    try {
        // Initialize UI components first
        initializeUI();
        
        // Initialize chart instances
        initializeCharts();
        
        // Set up time range button handlers
        setupTimeRangeButtons(fetchChartData, fetchAdditionalWeeklyData);
        
        // First fetch critical data - network info and block history
        console.log("Fetching network info and block history...");
        const networkInfoPromise = fetchNetworkInfo().catch(error => {
            console.error("Error fetching network info:", error);
            return { height: 0 }; // Return minimal valid object
        });
        
        const blockHistoryPromise = fetchBlockHistory().catch(error => {
            console.error("Error fetching block history:", error);
            return []; // Return empty array
        });
        
        // Wait for critical data
        const [networkInfo, blockData] = await Promise.all([networkInfoPromise, blockHistoryPromise]);
        
        // Store globally
        window.currentNetworkInfo = networkInfo;
        window.currentBlockData = blockData;
        
        const currentHeight = networkInfo.height;
        console.log(`Current network height: ${currentHeight}`);
        
        // Generate periods
        const dailyPeriods = getDailyPeriods(currentHeight, blockData);
        const oneWeekPeriods = generateExtendedDailyPeriods(currentHeight, blockData, 7);
        const weeklyPeriods = generateWeeklyPeriods(currentHeight, blockData, 12);
        
        // Update network info display
        const latestPeriod = dailyPeriods[dailyPeriods.length - 1];
        updateNetworkInfoDisplay(currentHeight, latestPeriod);
        
        // Load a high-priority chart first (wAR transfers) and wait for it
        // This ensures users see meaningful data before removing the main loader
        try {
            await loadProcessChart('wARTransfer', dailyPeriods, currentHeight);
        } catch (error) {
            console.error("Error loading primary chart:", error);
            // Continue even if primary chart fails - we'll still try to remove the loader
        }
        
        // Now we can remove the main loader since at least one chart is loaded (or attempted)
        toggleMainLoader(false);
        
        // Start loading the supply chart
        loadSupplyChart().catch(error => {
            console.error("Error loading supply chart:", error);
            toggleChartLoader('wARTotalSupply', false);
        });
        
        // Load remaining standard daily process charts
        Object.keys(PROCESSES).forEach(processName => {
            if (!processName.includes('weekly') && processName !== 'wARTotalSupply' && processName !== 'wARTransfer') {
                // Use appropriate periods based on chart type
                const periods = ['AOTransfer', 'permaswap', 'botega', 'llamaLand'].includes(processName) 
                    ? oneWeekPeriods 
                    : dailyPeriods;
                
                // Load each chart independently
                loadProcessChart(processName, periods, currentHeight).catch(error => {
                    console.error(`Error loading ${processName} chart:`, error);
                    toggleChartLoader(processName, false);
                });
            }
        });
        
        // Weekly process charts - load independently
        Object.keys(PROCESSES).forEach(processName => {
            if (processName.includes('weekly')) {
                loadProcessChart(processName, weeklyPeriods, currentHeight).catch(error => {
                    console.error(`Error loading ${processName} chart:`, error);
                    toggleChartLoader(processName, false);
                });
            }
        });
        
        loadStargridChart().catch(error => {
            console.error("Error loading Stargrid chart:", error);
            toggleChartLoader('stargrid', false);
        });
        
        // Load Rune Realm Streaks chart
        loadRuneRealmStreaksChart().catch(error => {
            console.error("Error loading Rune Realm Streaks chart:", error);
            toggleChartLoader('runeRealmStreaks', false);
        });

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        toggleMainLoader(false); // Ensure loader is removed even if there's an error
    }
}

// ... (rest of the code remains the same)
/**
 * Loads the Stargrid chart with data from AO
 * @returns {Promise<void>} Resolves when chart is loaded
 */
async function loadStargridChart() {
    try {
      console.log("Loading Stargrid chart...");
      toggleChartLoader('stargrid', true);
      
      const stargridData = await fetchStargridStats();
      console.log(`Loaded Stargrid data: ${stargridData.length} points`);
      
      // Update historical data
      if (stargridData.length > 0) {
        historicalData['stargrid'] = stargridData;
        
        // Update the chart
        const timeRange = getChartTimeRange('stargrid');
        updateChartTimeRange('stargrid', timeRange);
      }
    } catch (error) {
      console.error("Error loading Stargrid chart:", error);
    } finally {
      toggleChartLoader('stargrid', false);
    }
  }

/**
 * Loads the Rune Realm Streaks chart with data from AO
 * @returns {Promise<void>} Resolves when chart is loaded
 */
async function loadRuneRealmStreaksChart() {
  try {
    console.log("Loading Rune Realm Streaks chart...");
    toggleChartLoader('runeRealmStreaks', true);
    
    // Import the updateRuneRealmChart function
    const { updateRuneRealmChart } = await import('./charts.js');
    
    // Call the update function which will fetch the data and update the chart
    await updateRuneRealmChart();
    console.log("Rune Realm Streaks data loaded and chart updated");
    
  } catch (error) {
    console.error("Error loading Rune Realm Streaks chart:", error);
  } finally {
    toggleChartLoader('runeRealmStreaks', false);
  }
}

/**
 * Loads a process chart, handling both standard and combined charts
 * @param {string} processName - The process name
 * @param {Array} periods - Time periods to fetch
 * @param {number} currentHeight - Current block height
 * @returns {Promise<void>} Resolves when chart is loaded
 */
async function loadProcessChart(processName, periods, currentHeight) {
    try {
        // Skip if this is USDATransfer (handled with wUSDC)
        if (processName === 'USDATransfer') return;
        
        toggleChartLoader(processName, true);
        
        // Special handling for wUSDC/USDA combined chart
        if (processName === 'wUSDCTransfer') {
            // Fetch data for both wUSDC and USDA transfers
            const wUSDCPromise = fetchProcessData('wUSDCTransfer', periods, currentHeight)
                .catch(error => {
                    console.error("Error fetching wUSDCTransfer data:", error);
                    return [];
                });
                
            const USDAPromise = fetchProcessData('USDATransfer', periods, currentHeight)
                .catch(error => {
                    console.error("Error fetching USDATransfer data:", error);
                    return [];
                });
            
            const [wUSDCData, USDAData] = await Promise.all([wUSDCPromise, USDAPromise]);
            
            // Update historical data
            if (wUSDCData.length > 0) {
                historicalData['wUSDCTransfer'] = wUSDCData;
            }
            
            if (USDAData.length > 0) {
                historicalData['USDATransfer'] = USDAData;
            }
            
            // Update the chart
            const timeRange = getChartTimeRange('wUSDCTransfer');
            updateCombinedChart('wUSDCTransfer', 'USDATransfer', timeRange);
            toggleChartLoader(processName, false);
            
        } else {
            // Standard chart
            const data = await fetchProcessData(processName, periods, currentHeight);
            
            // Update historical data
            if (data.length > 0) {
                historicalData[processName] = data;
                
                // Update the chart
                const timeRange = getChartTimeRange(processName);
                updateChartTimeRange(processName, timeRange);
                toggleChartLoader(processName, false);
            }
        }
    } catch (error) {
        console.error(`Error loading ${processName} chart:`, error);
        throw error; // Rethrow to allow caller to handle
    }
}

/**
 * Loads the supply chart
 */
async function loadSupplyChart() {
    try {
        toggleChartLoader('wARTotalSupply', true);
        
        const supplyData = await fetchSupplyHistory();
        if (!supplyData) throw new Error('Failed to fetch supply data');
        
        // Process only wAR supply data
        const processedData = supplyData.wAR.map(d => ({
            timestamp: d.date,
            wARSupply: Number(d.totalSupply) / 1e12
        }));
        
        // Ensure timestamps are properly formatted as date strings
        const formattedData = processedData.map(entry => ({
            ...entry,
            timestamp: new Date(entry.timestamp).toISOString()
        }));
        
        // Update historical data
        historicalData['wARTotalSupply'] = formattedData;
        
        // Update chart
        const timeRange = getChartTimeRange('wARTotalSupply');
        updateChartTimeRange('wARTotalSupply', timeRange);
    } catch (error) {
        console.error('Error updating supply chart:', error);
        throw error; // Rethrow to allow the caller to handle it
    } finally {
        toggleChartLoader('wARTotalSupply', false);
    }
}

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Export for potential future use
export { initializeDashboard, fetchAllData };
