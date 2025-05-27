/**
 * Chart creation and management for the Eye of AO dashboard
 */
import { CHART_COLORS, CHART_DEFAULTS, TIME_FORMAT } from './config.js';
import { formatDate, formatDateUTCWithLocalTime, filterDataByTimeRange } from './utils.js';
import { getProcessDisplayName } from './processes.js';
import { setupTimeRangeButtons, toggleChartLoader, getChartTimeRange } from './ui.js';
import { fetchStargridStats } from './api.js'
import { fetchAdditionalData } from './index.js'

// Store all chart instances
const charts = {};

// Historical data for each chart
export const historicalData = {};

/**
 * Creates tooltip callbacks for weekly charts
 * @returns {Object} Tooltip callback functions
 */
function createWeeklyTooltipCallbacks() {
    return {
        label: function(context) {
            // Get the current dataset index and data index
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            
            // Determine which process data to use based on dataset index
            const processName = 'wARweeklyTransfer';
            const data = historicalData[processName];
            
            // If we don't have data or the index is out of bounds, show the raw value
            if (!data || !data[dataIndex]) {
                return `${context.dataset.label}: ${context.raw}`;
            }
            
            const count = data[dataIndex].count;
            
            // If this is the latest period, show "Current data"
            if (dataIndex === data.length - 1) {
                const currentTime = formatDate(new Date());
                return `${context.dataset.label}: ${count} (Current data as of ${currentTime})`;
            }
            
            return `${context.dataset.label}: ${count}`;
        },
        title: function(context) {
            const dataIndex = context[0].dataIndex;
            
            const wARData = historicalData['wARweeklyTransfer'];
            if (wARData && wARData[dataIndex]) {
                const date = new Date(wARData[dataIndex].timestamp);
                return formatDate(date, TIME_FORMAT.tooltip);
            }
            
            // If no data is available, use the default formatting
            return context[0].label;
        }
    };
}

/**
 * Returns the color for a specific process
 * @param {string} processName - The process name
 * @returns {string} Color value in rgb/rgba format
 */
export function getProcessColor(processName) {
    return CHART_COLORS[processName] || 'rgb(0, 0, 0)';
}

/**
 * Creates tooltip callbacks for a standard chart
 * @param {string} processName - The process name
 * @returns {Object} Tooltip callback functions
 */
function createStandardTooltipCallbacks(processName) {
    return {
        label: function(context) {
            const dataIndex = context.dataIndex;
            // Ensure we have data for this index
            if (!historicalData[processName] || !historicalData[processName][dataIndex]) {
                return `Count: ${context.raw}`;
            }
            
            const dataPoint = historicalData[processName][dataIndex];
            const count = dataPoint.count;
            
            if (dataIndex === historicalData[processName].length - 1) {
                const currentTime = formatDate(new Date());
                return `Count: ${count} (Current data as of ${currentTime})`;
            }
            
            return `Count: ${count}`;
        },
        title: function(context) {
            const dataIndex = context[0].dataIndex;
            if (!historicalData[processName] || !historicalData[processName][dataIndex]) {
                return context[0].label;
            }
            
            const dataPoint = historicalData[processName][dataIndex];
            if (!dataPoint) return context[0].label;
            
            const date = new Date(dataPoint.timestamp);
            return processName === 'stargrid'
            ? formatDateUTCWithLocalTime(date)
            : formatDate(date, TIME_FORMAT.tooltip);
        }
    };
}


/**
 * Creates tooltip callbacks for a supply chart
 * @returns {Object} Tooltip callback functions
 */
function createSupplyTooltipCallbacks() {
    return {
        label: function(context) {
            const value = context.raw;
            return `Supply: ${Math.round(value).toLocaleString()}`;
        }
    };
}

/**
 * Creates tooltip callbacks for a multi-line chart
 * @param {string} processName - The process name
 * @returns {Object} Tooltip callback functions
 */
function createMultiLineTooltipCallbacks(processName) {
    return {
        label: function(context) {
            // Skip the placeholder dataset
            if (context.datasetIndex === 0) return null;
            
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            const dataset = context.chart.data.datasets[datasetIndex];
            
            const data = historicalData[processName];
            if (!data || dataIndex >= data.length) return `${dataset.label}: ${context.raw}`;
            
            // Get the value for this dataset and date
            return `${dataset.label}: ${context.raw}`;
        },
        title: function(context) {
            const dataIndex = context[0].dataIndex;
            const data = historicalData[processName];
            
            if (!data || dataIndex >= data.length) return context[0].label;
            
            // Format the date nicely
            const date = new Date(data[dataIndex].timestamp);
            return formatDate(date, TIME_FORMAT.tooltip);
        },
        filter: function(tooltipItem) {
            // Filter out the placeholder dataset
            return tooltipItem.datasetIndex !== 0;
        }
    };
}

/**
 * Creates a legend configuration that uses the correct colors
 * @returns {Object} Legend configuration object
 */
function createLegendConfig() {
    return {
        display: true,
        labels: {
            usePointStyle: true,
            pointStyle: 'line',
            pointRadius: 5,
            generateLabels: function(chart) {
                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                return originalLabels.map((label, index) => {
                    const datasetColor = chart.data.datasets[index].borderColor;
                    return {
                        ...label,
                        fillStyle: datasetColor,
                        strokeStyle: datasetColor,
                        lineWidth: 2
                    };
                });
            }
        }
    };
}

/**
 * Creates axis configuration for charts
 * @returns {Object} Axes configuration object
 */
function createAxesConfig() {
    return {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function(value) {
                    return Number(value).toLocaleString();
                }
            }
        },
        x: {
            ticks: {
                sampleSize: 30,
                maxRotation: 45,
                minRotation: 45,
                callback: function(value, index, ticks) {
                    const date = new Date(this.getLabelForValue(value));
                    return formatDate(date);
                }
            }
        }
    };
}

/**
 * Creates a standard single-line chart
 * @param {string} processName - The name of the process
 * @returns {Object} Chart instance
 */
function createStandardChart(processName) {
    const canvasId = processName + 'Chart';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    
    if (!ctx) {
        console.error(`Cannot create chart: Canvas element ${canvasId} not found`);
        return null;
    }
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: getProcessDisplayName(processName),
                data: [],
                borderColor: getProcessColor(processName),
                tension: CHART_DEFAULTS.tension,
                pointRadius: CHART_DEFAULTS.pointRadius
            }]
        },
        options: {
            responsive: CHART_DEFAULTS.responsive,
            maintainAspectRatio: CHART_DEFAULTS.maintainAspectRatio,
            scales: createAxesConfig(),
            plugins: {
                legend: createLegendConfig(),
                tooltip: {
                    callbacks: createStandardTooltipCallbacks(processName)
                }
            }
        }
    });
}

/**
 * Creates a combined chart for two datasets
 * @param {string} primaryProcess - The primary process name
 * @param {string} secondaryProcess - The secondary process name
 * @returns {Object} Chart instance
 */
function createCombinedChart(primaryProcess, secondaryProcess) {
    const canvasId = primaryProcess + 'Chart';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    
    if (!ctx) {
        console.error(`Cannot create chart: Canvas element ${canvasId} not found`);
        return null;
    }
    
    // Initialize historical data for both processes if not already done
    if (!historicalData[primaryProcess]) {
        historicalData[primaryProcess] = [];
    }
    if (!historicalData[secondaryProcess]) {
        historicalData[secondaryProcess] = [];
    }
    
    // Determine correct display names and colors
    let displayName1, displayName2, color1, color2;
    
    // For weekly charts, use the non-weekly process colors
    displayName1 = getProcessDisplayName(primaryProcess);
    displayName2 = getProcessDisplayName(secondaryProcess);
    color1 = getProcessColor(primaryProcess);
    color2 = getProcessColor(secondaryProcess);
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: displayName1,
                    data: [],
                    borderColor: color1,
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                },
                {
                    label: displayName2,
                    data: [],
                    borderColor: color2,
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                }
            ]
        },
        options: {
            responsive: CHART_DEFAULTS.responsive,
            maintainAspectRatio: CHART_DEFAULTS.maintainAspectRatio,
            scales: createAxesConfig(),
            plugins: {
                legend: createLegendConfig(),
                tooltip: {
                    callbacks: primaryProcess === 'wARweeklyTransfer' ? 
                        createWeeklyTooltipCallbacks() : 
                        createCombinedTooltipCallbacks(primaryProcess, secondaryProcess)
                }
            }
        }
    });
}

/**
 * Creates a multi-line chart for Rune Realm Streaks
 * @returns {Object} Chart instance
 */
function createMultiLineChart() {
    const canvasId = 'runeRealmStreaksChart';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    
    if (!ctx) {
        console.error(`Cannot create chart: Canvas element ${canvasId} not found`);
        return null;
    }
    
    // Initialize historical data if not already done
    if (!historicalData['runeRealmStreaks']) {
        historicalData['runeRealmStreaks'] = [];
    }
    
    // Set up the datasets with a placeholder dataset in the first position
    // This is a workaround for Chart.js to ensure proper display
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    // Placeholder dataset (invisible)
                    label: 'Placeholder',
                    data: [],
                    borderColor: 'rgba(0,0,0,0)',
                    pointRadius: 0,
                    hidden: true
                },
                {
                    label: 'Low',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                },
                {
                    label: 'Medium',
                    data: [],
                    borderColor: 'rgb(255, 159, 64)',
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                },
                {
                    label: 'High',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                },
                {
                    label: 'Total',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                }
            ]
        },
        options: {
            responsive: CHART_DEFAULTS.responsive,
            maintainAspectRatio: CHART_DEFAULTS.maintainAspectRatio,
            scales: createAxesConfig(),
            plugins: {
                legend: {
                    ...createLegendConfig(),
                    // Custom legend generation to filter out placeholder dataset
                    labels: {
                        ...createLegendConfig().labels,
                        filter: function(item, chart) {
                            // Filter out the placeholder dataset
                            return item.datasetIndex !== 0;
                        }
                    }
                },
                tooltip: {
                    callbacks: createMultiLineTooltipCallbacks('runeRealmStreaks')
                }
            }
        }
    });
}

/**
 * Creates a supply chart for wAR
 * @returns {Object} Chart instance
 */
function createSupplyChart() {
    const canvasId = 'wARTotalSupplyChart';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    
    if (!ctx) {
        console.error(`Cannot create chart: Canvas element ${canvasId} not found`);
        return null;
    }
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'wAR Total Supply',
                    data: [],
                    borderColor: getProcessColor('wARTransfer'),
                    tension: CHART_DEFAULTS.tension,
                    pointRadius: CHART_DEFAULTS.pointRadius
                }
            ]
        },
        options: {
            responsive: CHART_DEFAULTS.responsive,
            maintainAspectRatio: CHART_DEFAULTS.maintainAspectRatio,
            plugins: {
                legend: createLegendConfig(),
                tooltip: {
                    callbacks: createSupplyTooltipCallbacks()
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return Number(value).toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        sampleSize: 30,
                        maxRotation: 45,
                        minRotation: 45,
                        callback: function(value, index, ticks) {
                            const date = new Date(this.getLabelForValue(value));
                            return formatDate(date);
                        }
                    }
                }
            }
        }
    });
}

export async function fetchChartData(processName, timeRange) {
    if (processName === 'stargrid') {
        // For Stargrid, use the dedicated function
        await updateStargridChart();
    } else if (processName === 'runeRealmStreaks') {
        // For Rune Realm Streaks, use the dedicated function
        await updateRuneRealmChart();
    } else {
        console.log(`Using fetchAdditionalData for ${processName}`);
        await fetchAdditionalData(processName, timeRange);
    }
}


export async function updateStargridChart() {
    try {
        toggleChartLoader('stargrid', true);

        const stargridData = await fetchStargridStats();
        if (!stargridData) throw new Error('Failed to fetch stargrid data');

        const formatted = stargridData.map(entry => ({
            ...entry,
            timestamp: new Date(entry.timestamp).toISOString()
        }));

        historicalData['stargrid'] = formatted;

        const timeRange = getChartTimeRange('stargrid');
        updateChartTimeRange('stargrid', timeRange);

        toggleChartLoader('stargrid', false);
    } catch (error) {
        console.error('Error updating Stargrid chart:', error);
        toggleChartLoader('stargrid', false);
    }
}

/**
 * Updates the Rune Realm Streaks chart with data from the AO process
 */
export async function updateRuneRealmChart() {
    try {
        toggleChartLoader('runeRealmStreaks', true);

        // Import the fetchRuneRealmStats function from api.js
        const { fetchRuneRealmStats } = await import('./api.js');
        const historyData = await fetchRuneRealmStats();
        
        if (!historyData) throw new Error('Failed to fetch Rune Realm data');
        
        // Transform the data into a format suitable for the chart
        // Example data format from AO: {'20226': { Medium: 0, High: 3, Low: 11 }, ...}
        const formattedData = [];
        
        // Convert unix day numbers to actual dates and structure the data for the chart
        Object.entries(historyData).forEach(([day, stats]) => {
            // Convert the unix day number to a JavaScript Date
            // Unix day is number of days since Unix epoch (Jan 1, 1970)
            const dayNumber = parseInt(day, 10);
            const timestamp = new Date(dayNumber * 24 * 60 * 60 * 1000);
            
            // Calculate the total for all categories
            const total = (stats.Low || 0) + (stats.Medium || 0) + (stats.High || 0);
            
            formattedData.push({
                timestamp: timestamp.toISOString(),
                day: dayNumber,
                Low: stats.Low || 0,
                Medium: stats.Medium || 0,
                High: stats.High || 0,
                Total: total
            });
        });
        
        // Sort by timestamp ascending
        formattedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Store in historicalData for tooltip access and filtering
        historicalData['runeRealmStreaks'] = formattedData;
        
        // Apply time range filter and update chart
        const timeRange = getChartTimeRange('runeRealmStreaks');
        updateMultiLineChart(timeRange);
        
        toggleChartLoader('runeRealmStreaks', false);
    } catch (error) {
        console.error('Error updating Rune Realm Streaks chart:', error);
        toggleChartLoader('runeRealmStreaks', false);
    }
}


/**
 * Initialize all charts based on process definitions
 */
/**
 * Updates the multi-line chart for Rune Realm Streaks
 * @param {string} timeRange - The selected time range
 */
export function updateMultiLineChart(timeRange) {
    const chart = charts['runeRealmStreaks'];
    if (!chart) {
        console.error('No chart found for Rune Realm Streaks');
        return;
    }
    
    const data = historicalData['runeRealmStreaks'] || [];
    if (data.length === 0) {
        console.warn('No data available for Rune Realm Streaks');
        return;
    }
    
    // Filter data by time range
    const filteredData = filterDataByTimeRange(data, timeRange);
    
    // Ensure data is sorted chronologically
    const sortedData = [...filteredData].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Create labels from timestamps
    const labels = sortedData.map(d => {
        const date = new Date(d.timestamp);
        return formatDate(date);
    });
    
    // Extract values for each streak category
    const lowValues = sortedData.map(d => d.Low);
    const mediumValues = sortedData.map(d => d.Medium);
    const highValues = sortedData.map(d => d.High);
    const totalValues = sortedData.map(d => d.Total);
    
    // Update chart datasets (remember to keep the placeholder dataset at index 0)
    chart.data.labels = labels;
    chart.data.datasets[0].data = new Array(labels.length).fill(0); // Placeholder data
    chart.data.datasets[1].data = lowValues;
    chart.data.datasets[2].data = mediumValues;
    chart.data.datasets[3].data = highValues;
    chart.data.datasets[4].data = totalValues;
    
    // Update the chart with animation disabled for performance
    chart.update('none');
}

export function initializeCharts() {
    // Clear any existing chart instances to prevent memory leaks
    Object.keys(charts).forEach(chartId => {
        if (charts[chartId]) {
            charts[chartId].destroy();
        }
    });
    
    // Special case: wUSDC/USDA combined chart
    charts['wUSDCTransfer'] = createCombinedChart('wUSDCTransfer', 'USDATransfer');
    
    // Special case: wAR total supply chart
    charts['wARTotalSupply'] = createSupplyChart();
    
    // Special case: Rune Realm Streaks multi-line chart
    charts['runeRealmStreaks'] = createMultiLineChart();
    
    // Standard charts for remaining processes
    ['wARweeklyTransfer', 'wARTransfer', 'AOTransfer', 'permaswap', 'botega', 'llamaLand', 'stargrid'].forEach(processName => {
        charts[processName] = createStandardChart(processName);
    });

    setupTimeRangeButtons(fetchChartData);
    
    return charts;
}

/**
 * Updates a standard chart with new data
 * @param {string} processName - The process name
 * @param {Array} dataPoints - Array of data points
 */
export function updateStandardChart(processName, dataPoints) {
    const chart = charts[processName];
    if (!chart) {
        console.error(`No chart found for process: ${processName}`);
        return;
    }
    
    // Ensure data is sorted chronologically by timestamp
    const sortedData = [...dataPoints].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Store the sorted data in historicalData for tooltip access
    historicalData[processName] = sortedData;
    
    // Create labels from timestamps
    const labels = sortedData.map(d => {
        const date = new Date(d.timestamp);
        return processName === 'stargrid' ? formatDateUTCWithLocalTime(date) : formatDate(date);
    });
    
    // Get the data values
    const values = sortedData.map(d => d.count);
    
    // Update chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].label = getProcessDisplayName(processName);
    
    // Update the chart with animation disabled for performance
    chart.update('none');
}

/**
 * Updates a combined chart with data from two processes
 * @param {string} primaryProcess - The primary process name
 * @param {string} secondaryProcess - The secondary process name
 * @param {string} timeRange - The selected time range
 */
export function updateCombinedChart(primaryProcess, secondaryProcess, timeRange) {
    const chart = charts[primaryProcess];
    if (!chart) {
        console.error(`No chart found for process: ${primaryProcess}`);
        return;
    }
    
    const primaryData = historicalData[primaryProcess] || [];
    const secondaryData = historicalData[secondaryProcess] || [];
    
    if (primaryData.length === 0 && secondaryData.length === 0) {
        console.warn(`No data available for ${primaryProcess} or ${secondaryProcess}`);
        return;
    }
    
    // Filter data by time range
    const filteredPrimaryData = filterDataByTimeRange(primaryData, timeRange);
    const filteredSecondaryData = filterDataByTimeRange(secondaryData, timeRange);
    
    // Choose the right approach based on the process type
    updateStandardCombinedChart(chart, primaryProcess, secondaryProcess, 
            filteredPrimaryData, filteredSecondaryData);
}

/**
 * Updates a standard combined chart (non-weekly)
 * @param {Object} chart - The chart instance
 * @param {string} primaryProcess - Primary process name
 * @param {string} secondaryProcess - Secondary process name
 * @param {Array} primaryData - Primary data array
 * @param {Array} secondaryData - Secondary data array
 */
function updateStandardCombinedChart(chart, primaryProcess, secondaryProcess, primaryData, secondaryData) {
    // Align the data to create consistent labels
    const allTimestamps = [
        ...primaryData.map(d => d.timestamp),
        ...secondaryData.map(d => d.timestamp)
    ];
    
    // Create a sorted unique array of timestamps (ensure chronological order)
    const uniqueTimestamps = [...new Set(allTimestamps)].sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    // Create aligned datasets
    const primaryValues = [];
    const secondaryValues = [];
    const labels = [];
    
    // Update the aligned data points in historicalData for tooltip access
    const alignedPrimaryData = [];
    const alignedSecondaryData = [];
    
    uniqueTimestamps.forEach(timestamp => {
        const primaryPoint = primaryData.find(d => d.timestamp === timestamp);
        const secondaryPoint = secondaryData.find(d => d.timestamp === timestamp);
        
        primaryValues.push(primaryPoint ? primaryPoint.count : null);
        secondaryValues.push(secondaryPoint ? secondaryPoint.count : null);
        
        // Add to aligned data arrays for tooltips
        alignedPrimaryData.push(primaryPoint || { timestamp, count: null });
        alignedSecondaryData.push(secondaryPoint || { timestamp, count: null });
        
        const date = new Date(timestamp);
        labels.push(formatDate(date));
    });
    
    // Store the aligned data for tooltip access
    historicalData[primaryProcess] = alignedPrimaryData;
    historicalData[secondaryProcess] = alignedSecondaryData;
    
    // Update chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = primaryValues;
    chart.data.datasets[1].data = secondaryValues;
    
    // Update dataset labels
    chart.data.datasets[0].label = getProcessDisplayName(primaryProcess);
    chart.data.datasets[1].label = getProcessDisplayName(secondaryProcess);
    
    // Update the chart with animation disabled for performance
    chart.update('none');
}

/**
 * Creates tooltip callbacks for a combined chart (non-weekly)
 * @param {string} primaryProcess - Primary process name
 * @param {string} secondaryProcess - Secondary process name
 * @returns {Object} Tooltip callback functions
 */
function createCombinedTooltipCallbacks(primaryProcess, secondaryProcess) {
    return {
        label: function(context) {
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            
            // Determine which process data to use based on dataset index
            const processName = datasetIndex === 0 ? primaryProcess : secondaryProcess;
            const data = historicalData[processName];
            
            // If we don't have data or the index is out of bounds, show the raw value
            if (!data || !data[dataIndex]) {
                return `${context.dataset.label}: ${context.raw}`;
            }
            
            const count = data[dataIndex].count;
            
            // If this is the latest period, show "Current data"
            if (dataIndex === data.length - 1) {
                const currentTime = formatDate(new Date());
                return `${context.dataset.label}: ${count} (Current data as of ${currentTime})`;
            }
            
            return `${context.dataset.label}: ${count}`;
        },
        title: function(context) {
            const dataIndex = context[0].dataIndex;
            
            // Try to get timestamp from primary data first
            const primaryData = historicalData[primaryProcess];
            if (primaryData && primaryData[dataIndex]) {
                const date = new Date(primaryData[dataIndex].timestamp);
                return formatDate(date, TIME_FORMAT.tooltip);
            }
            
            // Fall back to secondary data if needed
            const secondaryData = historicalData[secondaryProcess];
            if (secondaryData && secondaryData[dataIndex]) {
                const date = new Date(secondaryData[dataIndex].timestamp);
                return formatDate(date, TIME_FORMAT.tooltip);
            }
            
            // If no data is available, use the default formatting
            return context[0].label;
        }
    };
}

/**
 * Updates the supply chart with wAR supply data
 * @param {Array} supplyData - Array of supply data points
 * @param {string} timeRange - The selected time range
 */
export function updateSupplyChart(supplyData, timeRange) {
    const chart = charts['wARTotalSupply'];
    if (!chart) {
        console.error('No supply chart found');
        return;
    }
    
    if (!supplyData || supplyData.length === 0) {
        console.warn('No supply data available');
        return;
    }
    
    // Filter by time range
    const filteredData = filterDataByTimeRange(supplyData, timeRange);
    
    // Sort data by timestamp to ensure chronological order
    const sortedData = [...filteredData].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Create labels and datasets (just wAR now)
    const labels = sortedData.map(d => formatDate(new Date(d.timestamp)));
    const wARSupply = sortedData.map(d => d.wARSupply);
    
    // Update chart with only wAR data
    chart.data.labels = labels;
    chart.data.datasets[0].data = wARSupply;
    chart.data.datasets[0].label = 'wAR Total Supply';
    
    // Update the chart
    chart.update('none');
}

/**
 * Gets a chart instance by process name
 * @param {string} processName - The process name
 * @returns {Object|null} Chart instance or null if not found
 */
export function getChart(processName) {
    return charts[processName] || null;
}

/**
 * Updates the chart for a specific process based on time range
 * @param {string} processName - The process name
 * @param {string} timeRange - The selected time range
 */
export function updateChartTimeRange(processName, timeRange) {
    // Get a consistent reference to the data
    let data = historicalData[processName] || [];
    
    // Make sure data is properly sorted (this is crucial to prevent duplicates)
    data = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Filter out any duplicate data points based on date or week
    const filteredData = removeDuplicateDates(data, processName.includes('weekly'));
    
    // Store back the cleaned data
    historicalData[processName] = filteredData;
    
    // Handle special combined charts
    if (processName === 'wUSDCTransfer') {
        updateCombinedChart('wUSDCTransfer', 'USDATransfer', timeRange);
    } else if (processName === 'wARTotalSupply') {
        // Call the specialized function for supply chart
        updateSupplyChart(historicalData[processName], timeRange);
    } else {
        // Standard single-line charts
        const filteredByTimeRange = filterDataByTimeRange(filteredData, timeRange);
        updateStandardChart(processName, filteredByTimeRange);
    }
}

/**
 * Removes duplicate date entries from a dataset but preserves today's entries
 * @param {Array} data - The dataset to clean
 * @param {boolean} isWeekly - Whether this is weekly data
 * @returns {Array} Cleaned dataset
 */
function removeDuplicateDates(data, isWeekly = false) {
    if (!data || data.length === 0) return [];
    
    // Get today's date in UTC
    const today = new Date();
    const todayUTC = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    console.log("Today's UTC date:", todayUTC);
    
    // Separate today's entries from other entries
    const todayEntries = [];
    const otherEntries = [];
    
    data.forEach(item => {
        if (!item || !item.timestamp) return;
        
        const date = new Date(item.timestamp);
        const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        
        if (dateKey === todayUTC) {
            todayEntries.push(item);
        } else {
            otherEntries.push(item);
        }
    });
    
    // For today's entries, keep both the earliest (00:00:00) and the latest timestamp
    let earliestToday = null;
    let latestToday = null;
    
    todayEntries.forEach(item => {
        const timestamp = new Date(item.timestamp);
        
        // Check if it's a midnight entry (00:00:00)
        const isMidnight = timestamp.getUTCHours() === 0 && 
                           timestamp.getUTCMinutes() === 0 && 
                           timestamp.getUTCSeconds() === 0;
        
        if (isMidnight) {
            // Keep the midnight entry
            earliestToday = item;
        } else if (!latestToday || new Date(item.timestamp) > new Date(latestToday.timestamp)) {
            // Keep the latest non-midnight entry
            latestToday = item;
        }
    });
    
    // For other entries, deduplicate by date
    const seen = new Map();
    
    otherEntries.forEach(item => {
        let key;
        if (isWeekly) {
            // For weekly data, use week start
            const date = new Date(item.timestamp);
            const day = date.getUTCDay();
            const weekStart = new Date(date);
            weekStart.setUTCDate(date.getUTCDate() - day);
            weekStart.setUTCHours(0, 0, 0, 0);
            key = weekStart.toISOString().split('T')[0];
        } else {
            // For daily data, use YYYY-MM-DD
            const date = new Date(item.timestamp);
            key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        }
        
        // Keep the latest entry for each day/week
        if (!seen.has(key) || new Date(item.timestamp) > new Date(seen.get(key).timestamp)) {
            seen.set(key, item);
        }
    });
    
    // Build the final result
    const result = Array.from(seen.values());
    
    // Add today's entries
    if (earliestToday) {
        result.push(earliestToday);
    }
    
    if (latestToday) {
        result.push(latestToday);
    }
    
    // Sort chronologically
    const sortedResult = result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return sortedResult;
}
