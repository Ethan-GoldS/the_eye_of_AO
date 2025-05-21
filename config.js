/**
 * Configuration constants for the Eye of AO dashboard
 */

// Process colors for consistent chart styling
export const CHART_COLORS = {
    permaswap: 'rgb(54, 162, 235)',
    botega: 'rgb(255, 99, 132)',
    wARTransfer: 'rgb(255, 159, 64)',
    wARweeklyTransfer: 'rgb(255, 159, 64)',
    llamaLand: 'rgb(255, 205, 86)',
    stargrid: 'rgb(131, 86, 255)',
    AOTransfer: 'rgb(47, 243, 8)',
    wUSDCTransfer: 'rgb(19, 62, 252)',
    USDATransfer: 'rgb(51, 139, 0)',
    runeRealm: 'rgb(75, 192, 192)'
};

// Time range values in milliseconds
export const TIME_RANGES = {
    '1D': 24 * 60 * 60 * 1000,         // 1 day in milliseconds
    '1W': 7 * 24 * 60 * 60 * 1000,     // 1 week in milliseconds
    '1M': 30 * 24 * 60 * 60 * 1000,    // 1 month in milliseconds
    '3M': 90 * 24 * 60 * 60 * 1000     // 3 months in milliseconds
};

// Default time range for all charts
export const DEFAULT_TIME_RANGE = '1W';

// Block Tracking Process ID for AO Network
export const BLOCK_TRACKING_PROCESS = 'V5Pm1eScgJo1Ue6R0NL_qVUM53leE_B3zavwf1Z5zPk';

// Data refresh interval in milliseconds (20 minutes)
export const DATA_REFRESH_INTERVAL = 20 * 60 * 1000;

// Time format settings for consistent date formatting across the app
export const TIME_FORMAT = {
    short: {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    },
    tooltip: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        weekday: 'short'
    }
};

// Default line chart settings
export const CHART_DEFAULTS = {
    tension: 0.1,
    pointRadius: 5,
    responsive: true,
    maintainAspectRatio: false
};