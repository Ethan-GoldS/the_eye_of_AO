/**
 * Utility functions for the Eye of AO dashboard
 */
import { TIME_FORMAT, TIME_RANGES } from './config.js';

/**
 * Formats a date using the provided format options
 * @param {Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = TIME_FORMAT.short) {
    return date.toLocaleString('en-US', options);
}


/**
 * Special functions for the stargrid data/time conversions that do not conform to TIME_FORMAT
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateUTCWithLocalTime(date) {
    const utcDate = date.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const localTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    return `${utcDate}, ${localTime}`;
}


/**
 * Finds the block nearest to a specific date in block data
 * @param {Array} blockData - Array of blocks with dates and heights
 * @param {Date} targetDate - The target date to find a block for
 * @returns {Object|null} The block nearest to the target date or null if not found
 */
export function findBlockNearDate(blockData, targetDate) {
    return blockData.reduce((closest, block) => {
        const blockDate = new Date(block.date);
        const currentClosestDate = closest ? new Date(closest.date) : null;
        
        const blockTimeDiff = Math.abs(blockDate - targetDate);
        const closestTimeDiff = currentClosestDate 
            ? Math.abs(currentClosestDate - targetDate) 
            : Infinity;

        return blockTimeDiff < closestTimeDiff ? block : closest;
    }, null);
}

/**
 * Gets the most recent 00:00 UTC checkpoint
 * @param {Date} now - Current date
 * @returns {Date} Date representing the last 00:00 UTC checkpoint
 */
export function getLastDailyCheckpoint(now) {
    const lastCheckpoint = new Date(now);
    lastCheckpoint.setUTCHours(0, 0, 0, 0);
    return lastCheckpoint;
}

/**
 * Gets the most recent Sunday at 00:00 UTC
 * @param {Date} now - Current date
 * @returns {Date} Date representing the last Sunday at 00:00 UTC
 */
export function getLastSundayCheckpoint(now) {
    // Set the time to 0:00 UTC
    const sunday = new Date(now);
    sunday.setUTCHours(0, 0, 0, 0);

    // Go back to the most recent Sunday
    const dayOfWeek = sunday.getUTCDay();
    sunday.setUTCDate(sunday.getUTCDate() - dayOfWeek);

    // If the current time is before Sunday 0:00 UTC, go back one week
    if (now < sunday) {
        sunday.setUTCDate(sunday.getUTCDate() - 7);
    }

    return sunday;
}

/**
 * Generates daily time periods based on block data
 * @param {number} currentHeight - Current block height
 * @param {Array} blockData - Array of blocks with dates and heights
 * @returns {Array} Array of time periods with start/end times and heights
 */
export function getDailyPeriods(currentHeight, blockData) {
    // Find the most recent 0:00 UTC day
    const lastCheckpoint = getLastDailyCheckpoint(new Date());

    // Add current period first (from last 0:00 UTC to now)
    const periods = [{
        endTime: new Date(),
        startTime: lastCheckpoint,
        endHeight: currentHeight,
        startHeight: blockData[0].blockHeight
    }];

    // Then add historical periods
    for (let i = 1; i < 14; i++) {
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

    return periods.reverse(); // Put in chronological order
}

/**
 * Generates weekly time periods based on block data
 * @param {number} currentHeight - Current block height
 * @param {Array} blockData - Array of blocks with dates and heights
 * @returns {Array} Array of time periods with start/end times and heights
 */
export function getWeeklyPeriods(currentHeight, blockData) {
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

    // Then add historical periods (7 weeks back)
    for (let i = 1; i < 8; i++) {
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
 * Filters data based on the selected time range
 * @param {Array} data - The data to filter
 * @param {string} timeRange - The time range to filter by (e.g., '1D', '1W')
 * @returns {Array} Filtered data
 */
export function filterDataByTimeRange(data, timeRange) {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const timeLimit = TIME_RANGES[timeRange] || TIME_RANGES['1M']; // Default to 1 month if invalid
    
    return data.filter(item => {
        const timestamp = new Date(item.timestamp);
        return (now - timestamp) <= timeLimit;
    });
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}