import { createDataItemSigner, dryrun, message, result, results } from "https://unpkg.com/@permaweb/aoconnect@0.0.59/dist/browser.js";
import { PROCESSES, generateQuery } from './processes.js';

// Block Tracking Process ID
const BLOCK_TRACKING_PROCESS = '_g3kxQxL7F4Y9vXvHaR_cEa7oPkcjFpyuuHLMcHKSds';

// Store historical data for each query
const historicalData = {
    qARTransfer: [],
    wARTransfer: [],
    wUSDCTransfer: [],
    USDATransfer: [],
    AOTransfer: [],
    permaswap: [],
    botega: [],
    llamaLand: [],
    qARwARTotalSupply: [] 
};

const charts = {};
// Chart.defaults.plugins.legend.display = false; 

// Update the chart initialization to use PROCESSES
Object.keys(PROCESSES).forEach(processName => {
    // Skip creating charts for processes that are part of combined charts
    if (processName === 'USDATransfer' || processName === 'wARTransfer' || processName === 'wARweeklyTransfer') {
        return; // Skip chart creation for these processes
    }
    
    if (processName === 'qARTransfer') {
        const ctx = document.getElementById(processName + 'Chart').getContext('2d');
        charts[processName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'qAR Transfers',
                        data: [],
                        borderColor: getProcessColor('qARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    },
                    {
                        label: 'wAR Transfers',
                        data: [],
                        borderColor: getProcessColor('wARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index, ticks) {
                                const date = new Date(this.getLabelForValue(value));
                                return date.toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });
                            }
                        }
                    }
                }
            }
        });
    } else if (processName === 'wUSDCTransfer') {
        const ctx = document.getElementById(processName + 'Chart').getContext('2d');
        charts[processName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'wUSDC Transfers',
                        data: [],
                        borderColor: getProcessColor('wUSDCTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    },
                    {
                        label: 'USDA Transfers',
                        data: [],
                        borderColor: getProcessColor('USDATransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index, ticks) {
                                const date = new Date(this.getLabelForValue(value));
                                return date.toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });
                            }
                        }
                    }
                }
            }
        });
    } else if (processName === 'qARweeklyTransfer') {
        const ctx = document.getElementById(processName + 'Chart').getContext('2d');
        charts[processName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'qAR Weekly Transfers',
                        data: [],
                        borderColor: getProcessColor('qARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    },
                    {
                        label: 'wAR Weekly Transfers',
                        data: [],
                        borderColor: getProcessColor('wARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index, ticks) {
                                const date = new Date(this.getLabelForValue(value));
                                return date.toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });
                            }
                        }
                    }
                }
            }
        });
    } else if (processName === 'AOTransfer') {
        const ctx = document.getElementById(processName + 'Chart').getContext('2d');
        charts[processName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'AO Transfers',
                    data: [],
                    borderColor: getProcessColor('AOTransfer'),
                    tension: 0.1,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index, ticks) {
                                const date = new Date(this.getLabelForValue(value));
                                return date.toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });
                            }
                        }
                    }
                }
            }
        });
    } else if (processName === 'qARwARTotalSupply') {
        // New supply chart initialization
        const ctx = document.getElementById('qAR-wARTotalSupplyChart').getContext('2d');
        charts[processName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'qAR Total Supply',
                        data: [],
                        borderColor: getProcessColor('qARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    },
                    {
                        label: 'wAR Total Supply',
                        data: [],
                        borderColor: getProcessColor('wARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `Supply: ${Math.round(value).toLocaleString()}`;
                            }
                        }
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
                                return date.toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Your existing chart creation code for other charts
        const ctx = document.getElementById(processName + 'Chart').getContext('2d');
        charts[processName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '',
                    data: [],
                    borderColor: 'rgb(0, 0, 0)',
                    tension: 0.1,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index, ticks) {
                                // Convert UTC to local time
                                const date = new Date(this.getLabelForValue(value));
                                return date.toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataPoint = historicalData[processName][context.dataIndex];
                                const count = dataPoint.count;

                                // If this is the latest period, show "Current data as of [timestamp]"
                                if (context.dataIndex === historicalData[processName].length - 1) {
                                    const currentTime = new Date().toLocaleString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: true
                                    });
                                    return `Count: ${count} (Current data as of ${currentTime})`;
                                }

                                return `Count: ${count}`;
                            },
                            title: function(context) {
                                // Get the data index
                                const dataIndex = context[0].dataIndex;
                            
                                // Retrieve the correct timestamp from historical data
                                const dataPoint = historicalData[processName][dataIndex];
                                const date = new Date(dataPoint.timestamp); // Use the correct timestamp
                            
                                // Format the date using UTC to ensure consistency
                                return date.toLocaleString('en-US', {
                                    year: 'numeric', // Explicitly include the year
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true,
                                    weekday: 'short',
                                });
                            }
                        }
                    }
                }
            }
        });
    }
});


// Debugging function to log chart details
function logChartDetails() {
    Object.keys(charts).forEach(processName => {
        console.log(`Chart for ${processName}:`, {
            labels: charts[processName].data.labels,
            data: charts[processName].data.datasets[0].data,
            historicalData: historicalData[processName]
        });
    });
}
logChartDetails();

// Initialize loaders to be visible when page loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('mainLoader').style.display = 'flex';
    Object.keys(PROCESSES).forEach(processName => {
        const loaderElement = document.getElementById(`${processName}Loader`);
        if (loaderElement) {
            loaderElement.style.display = 'flex';
        } else {
            console.warn(`No loader found for process: ${processName}`);
        }
    });
});


async function fetchBlockHeights() {
    try {
        // First, get the current Arweave block height
        const infoResponse = await fetch("https://arweave.net/info");
        const networkInfo = await infoResponse.json();
        const currentHeight = networkInfo.height;
        console.log("Current Arweave network height is: " + currentHeight);

        // Dry run to get block history from AO process
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

        // Check if we have a valid response
        if (
            blockHistoryResponse && 
            blockHistoryResponse.Messages && 
            blockHistoryResponse.Messages[0] && 
            blockHistoryResponse.Messages[0].Tags
        ) {
            // Find the DailyBlocks tag
            const dailyBlocksTag = blockHistoryResponse.Messages[0].Tags.find(
                tag => tag.name === "DailyBlocks"
            );

            if (!dailyBlocksTag) {
                throw new Error("No DailyBlocks tag found in the response.");
            }

            const blockData = JSON.parse(dailyBlocksTag.value);
            
            // Sort blocks by date (descending)
            blockData.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Generate periods based on block history, using current network height
            const dailyPeriods = await getDailyPeriods(currentHeight, blockData);
            
            updateDisplayAndFetchData(currentHeight, dailyPeriods);

            // Fetch weekly data
            await fetchWeeklyData(currentHeight, blockData);
        } else {
            throw new Error("No valid block height data found in the response.");
        }
    } catch (error) {
        console.error("Error fetching block heights:", error);
        // Hide loaders on error

        Object.keys(PROCESSES).forEach(processName => {
            const loaderElement = document.getElementById(`${processName}Loader`);
            if (loaderElement) {
                loaderElement.style.display = 'none';
            }
        });
    }
}

async function getDailyPeriods(currentHeight, blockData) {
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

function findBlockNearDate(blockData, targetDate) {
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

async function fetchWeeklyData(currentHeight, blockData) {
    try {
        // Show weekly chart loaders
        Object.keys(PROCESSES).forEach(processName => {
            if (processName.includes('weekly')) {
                const loaderElement = document.getElementById(`${processName}Loader`);
                if (loaderElement) {
                    loaderElement.style.display = 'flex';
                } else {
                    console.warn(`No loader found for weekly process: ${processName}`);
                }
            }
        });

        const weeklyPeriods = await getWeeklyPeriods(currentHeight, blockData);

        // Fetch historical data for weekly processes
        for (const processName of Object.keys(PROCESSES)) {
            if (processName.includes('weekly')) {
                await fetchHistoricalData(weeklyPeriods, processName);
            }
        }

        // Hide weekly chart loaders
        Object.keys(PROCESSES).forEach(processName => {
            if (processName.includes('weekly')) {
                const loaderElement = document.getElementById(`${processName}Loader`);
                if (loaderElement) {
                    loaderElement.style.display = 'none';
                }
            }
        });
    } catch (error) {
        console.error(error);
        // Hide weekly loaders on error
        Object.keys(PROCESSES).forEach(processName => {
            if (processName.includes('weekly')) {
                const loaderElement = document.getElementById(`${processName}Loader`);
                if (loaderElement) {
                    loaderElement.style.display = 'none';
                }
            }
        });
    }
}

async function getWeeklyPeriods(currentHeight, blockData) {
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

function getLastSundayCheckpoint(now) {
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

function getLastDailyCheckpoint(now) {
    const lastCheckpoint = new Date(now);
    lastCheckpoint.setUTCHours(0, 0, 0, 0);
    return lastCheckpoint;
}

function updateDisplayAndFetchData(currentHeight, periods) {
    // Update display
    const latestPeriod = periods[periods.length - 1];
    const latestTime = new Date(latestPeriod.endTime);
    const timeStr = latestTime.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    document.getElementById('blockInfo').textContent =
        `Current Block: ${currentHeight} | Latest Period (${timeStr}): ${latestPeriod.startHeight} - ${latestPeriod.endHeight}`;



    // Fetch historical data for daily processes
    for (const processName of Object.keys(PROCESSES)) {
        if (!processName.includes('weekly')) {
            fetchHistoricalData(periods, processName);
        }
    }
}

// Helper function to generate consistent colors for processes
function getProcessColor(processName) {
    const colorMap = {
        permaswap: 'rgb(54, 162, 235)',
        botega: 'rgb(255, 99, 132)',
        qARTransfer: 'rgb(75, 192, 192)',
        wARTransfer: 'rgb(255, 159, 64)',
        llamaLand: 'rgb(255, 205, 86)',
        AOTransfer: 'rgb(47, 243, 8)',
        wUSDCTransfer: 'rgb(19, 62, 252)',
        USDATransfer: 'rgb(51, 139, 0)'
    };
    return colorMap[processName] || 'rgb(0, 0, 0)';
}


async function fetchHistoricalData(periods, processName) {
    try {
        console.log(`>>> START Fetching historical data for ${processName}`);
        console.log('Periods:', JSON.stringify(periods, null, 2));
        if (processName === 'wUSDCTransfer') {
            // Fetch wUSDC and USDA data in parallel
            const [wUSDCPeriodData, USDAPeriodData] = await Promise.all([
                // Fetch wUSDC data
                Promise.all(periods.map(async (period, index) => {
                    try {
                        const query = await generateQuery(
                            'wUSDCTransfer',
                            period.startHeight,
                            period.endHeight,
                            periods[periods.length - 1].endHeight
                        );
                        const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                        });
                        const result = await response.json();
                        return result.data.transactions.count;
                    } catch (error) {
                        console.error(`Error fetching wUSDC data for period ${index}:`, error);
                        return 0;
                    }
                })),
                // Fetch USDA data
                Promise.all(periods.map(async (period, index) => {
                    try {
                        const query = await generateQuery(
                            'USDATransfer',
                            period.startHeight,
                            period.endHeight,
                            periods[periods.length - 1].endHeight
                        );
                        const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                        });
                        const result = await response.json();
                        return result.data.transactions.count;
                    } catch (error) {
                        console.error(`Error fetching USDA data for period ${index}:`, error);
                        return 0;
                    }
                }))
            ]);
        
            // Update historical data for both datasets
            historicalData['wUSDCTransfer'] = wUSDCPeriodData.map((count, index) => ({
                timestamp: periods[index].endTime,
                count: count
            }));
            historicalData['USDATransfer'] = USDAPeriodData.map((count, index) => ({
                timestamp: periods[index].endTime,
                count: count
            }));
        
            // Generate chart labels
            const chartLabels = periods.map(period => {
                const labelDate = new Date(period.endTime);
                return labelDate.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                });
            });
        
            // Update the combined chart
            const chart = charts[processName];
            chart.data.labels = chartLabels;
            chart.data.datasets = [
                {
                    label: 'wUSDC Transfers',
                    data: wUSDCPeriodData,
                    borderColor: getProcessColor('wUSDCTransfer'),
                    tension: 0.1,
                    pointRadius: 5
                },
                {
                    label: 'USDA Transfers',
                    data: USDAPeriodData,
                    borderColor: getProcessColor('USDATransfer'),
                    tension: 0.1,
                    pointRadius: 5
                }
            ];
        
            chart.update('none');
        
            // Hide loader
            const loader = document.getElementById(`wUSDCTransferLoader`);
            if (loader) {
                loader.style.display = 'none';
            }
            
            console.log(`>>> END Successfully updated combined wUSDC/USDA transfer chart`);
            return;
        }
        if (processName === 'qARwARTotalSupply') {
            try {
                // Fetch qAR supply history
                const qARResponse = await dryrun({
                    process: 'e4kbo6uYtQc9vDZ1YkwZnwXLUWL-XCUx4XhLP25vRx0',
                    data: '',
                    tags: [
                        { name: "Action", value: "SupplyHistory" },
                        { name: "Data-Protocol", value: "ao" },
                        { name: "Type", value: "Message" },
                        { name: "Variant", value: "ao.TN.1" }
                    ],
                });
        
                // Fetch wAR supply history
                const wARResponse = await dryrun({
                    process: 'ekKjTNc7soQFx_bJJMIJYX29125XkgIsl-75aaJ7IYU',
                    data: '',
                    tags: [
                        { name: "Action", value: "SupplyHistory" },
                        { name: "Data-Protocol", value: "ao" },
                        { name: "Type", value: "Message" },
                        { name: "Variant", value: "ao.TN.1" }
                    ],
                });
        
                // Process qAR data
                const qARSupplyTag = qARResponse.Messages[0].Tags.find(
                    tag => tag.name === "DailySupply"
                );
                const qARSupplyData = JSON.parse(qARSupplyTag.value);
        
                // Process wAR data
                const wARSupplyTag = wARResponse.Messages[0].Tags.find(
                    tag => tag.name === "DailySupply"
                );
                const wARSupplyData = JSON.parse(wARSupplyTag.value);
        
                // Log the raw data for debugging
                console.log('qAR Supply Data:', qARSupplyData);
                console.log('wAR Supply Data:', wARSupplyData);
        
                // Sort and align the data
                const allDates = [...new Set([
                    ...qARSupplyData.map(d => d.date),
                    ...wARSupplyData.map(d => d.date)
                ])].sort();
        
                // Update historical data
                historicalData[processName] = allDates.map(date => {
                    const qAREntry = qARSupplyData.find(d => d.date === date);
                    const wAREntry = wARSupplyData.find(d => d.date === date);
                    
                    return {
                        timestamp: date,
                        qARSupply: qAREntry ? Number(qAREntry.totalSupply) / 1e12 : null,
                        wARSupply: wAREntry ? Number(wAREntry.totalSupply) / 1e12 : null
                    };
                }).filter(entry => entry.qARSupply !== null && entry.wARSupply !== null);
        
                // Debug logging
                console.log('Processing supply data for chart update');
                console.log('Historical Data:', historicalData[processName]);
                
                const chart = charts[processName];
                console.log('Found chart:', chart);

                if (!chart) {
                    console.error('Chart not found for:', processName);
                    return;
                }

                // Create labels and datasets
                const last30Days = historicalData[processName].slice(-30);

                // Create labels and datasets
                const labels = last30Days.map(d => 
                    new Date(d.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    })
                );
                
                const qARData = last30Days.map(d => d.qARSupply);
                const wARData = last30Days.map(d => d.wARSupply);
                console.log('qAR data points:', qARData);
                console.log('wAR data points:', wARData);

                // Update chart data
                chart.data.labels = labels;
                chart.data.datasets = [
                    {
                        label: 'qAR Total Supply',
                        data: qARData,
                        borderColor: getProcessColor('qARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    },
                    {
                        label: 'wAR Total Supply',
                        data: wARData,
                        borderColor: getProcessColor('wARTransfer'),
                        tension: 0.1,
                        pointRadius: 5
                    }
                ];

                console.log('Updated chart data:', chart.data);
                
                // Force a full chart update
                chart.update();  // Remove 'none' option to force full redraw

                console.log('Chart update completed');

                // Hide loader
                const loader = document.getElementById('qAR-wARTotalSupplyLoader');
                if (loader) {
                    loader.style.display = 'none';
                }

                return;
            } catch (error) {
                console.error('Error updating supply chart:', error);
                throw error;  // Re-throw to see full error stack
            }
        }
        if (!window.firstChartLoaded) {
            // For the combined charts, check if either dataset has non-zero data
            if (processName === 'qARTransfer' || processName === 'qARweeklyTransfer') {
                const combinedQuery = await Promise.all([
                    generateQuery(
                        processName.replace('weekly', ''), 
                        periods[periods.length - 1].startHeight, 
                        periods[periods.length - 1].endHeight, 
                        periods[periods.length - 1].endHeight
                    ),
                    generateQuery(
                        processName.replace('weekly', '') === 'qARTransfer' ? 'wARTransfer' : 'wARweeklyTransfer', 
                        periods[periods.length - 1].startHeight, 
                        periods[periods.length - 1].endHeight, 
                        periods[periods.length - 1].endHeight
                    )
                ]);

                const [qResponse, wResponse] = await Promise.all([
                    fetch('https://arweave-search.goldsky.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: combinedQuery[0] }),
                    }),
                    fetch('https://arweave-search.goldsky.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: combinedQuery[1] }),
                    })
                ]);

                const [qResult, wResult] = await Promise.all([qResponse.json(), wResponse.json()]);
                const hasData = qResult.data.transactions.count > 0 || wResult.data.transactions.count > 0;

                if (hasData) {
                    window.firstChartLoaded = true;
                    document.getElementById('mainLoader').style.display = 'none';
                }
            } 
            // For other single charts
            else {
                const query = await generateQuery(
                    processName, 
                    periods[periods.length - 1].startHeight, 
                    periods[periods.length - 1].endHeight, 
                    periods[periods.length - 1].endHeight
                );

                const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                const hasData = result.data.transactions.count > 0;

                if (hasData) {
                    window.firstChartLoaded = true;
                    document.getElementById('mainLoader').style.display = 'none';
                }
            }
        }
        // Special handling for qAR chart which will contain both datasets
        if (processName === 'qARTransfer') {
            // Fetch qAR and wAR data in parallel
            const [qARPeriodData, wARPeriodData] = await Promise.all([
                // Fetch qAR data
                Promise.all(periods.map(async (period, index) => {
                    try {
                        const query = await generateQuery(
                            'qARTransfer',
                            period.startHeight,
                            period.endHeight,
                            periods[periods.length - 1].endHeight
                        );
                        const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                        });
                        const result = await response.json();
                        return result.data.transactions.count;
                    } catch (error) {
                        console.error(`Error fetching qAR data for period ${index}:`, error);
                        return 0;
                    }
                })),
                // Fetch wAR data
                Promise.all(periods.map(async (period, index) => {
                    try {
                        const query = await generateQuery(
                            'wARTransfer',
                            period.startHeight,
                            period.endHeight,
                            periods[periods.length - 1].endHeight
                        );
                        const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                        });
                        const result = await response.json();
                        return result.data.transactions.count;
                    } catch (error) {
                        console.error(`Error fetching wAR data for period ${index}:`, error);
                        return 0;
                    }
                }))
            ]);

            // Update historical data for both datasets
            historicalData['qARTransfer'] = qARPeriodData.map((count, index) => ({
                timestamp: periods[index].endTime,
                count: count
            }));
            historicalData['wARTransfer'] = wARPeriodData.map((count, index) => ({
                timestamp: periods[index].endTime,
                count: count
            }));

            // Generate chart labels
            const chartLabels = periods.map(period => {
                const labelDate = new Date(period.endTime);
                return labelDate.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                });
            });

            // Update the combined chart
            const chart = charts[processName];
            chart.data.labels = chartLabels;
            chart.data.datasets = [
                {
                    label: 'qAR Transfers',
                    data: qARPeriodData,
                    borderColor: getProcessColor('qARTransfer'),
                    tension: 0.1,
                    pointRadius: 5
                },
                {
                    label: 'wAR Transfers',
                    data: wARPeriodData,
                    borderColor: getProcessColor('wARTransfer'),
                    tension: 0.1,
                    pointRadius: 5
                }
            ];

            chart.update('none');

            // Hide loader
            const loader = document.getElementById(`qARTransferLoader`);
            if (loader) {
                loader.style.display = 'none';
            }
            
            console.log(`>>> END Successfully updated combined transfer chart`);
            return;
        }

        if (processName === 'qARweeklyTransfer') {
            // Fetch qAR and wAR weekly data in parallel
            const [qARPeriodData, wARPeriodData] = await Promise.all([
                // Fetch qAR weekly data
                Promise.all(periods.map(async (period, index) => {
                    try {
                        const query = await generateQuery(
                            'qARweeklyTransfer',
                            period.startHeight,
                            period.endHeight,
                            periods[periods.length - 1].endHeight
                        );
                        const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                        });
                        const result = await response.json();
                        return result.data.transactions.count;
                    } catch (error) {
                        console.error(`Error fetching qAR weekly data for period ${index}:`, error);
                        return 0;
                    }
                })),
                // Fetch wAR weekly data
                Promise.all(periods.map(async (period, index) => {
                    try {
                        const query = await generateQuery(
                            'wARweeklyTransfer',
                            period.startHeight,
                            period.endHeight,
                            periods[periods.length - 1].endHeight
                        );
                        const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                        });
                        const result = await response.json();
                        return result.data.transactions.count;
                    } catch (error) {
                        console.error(`Error fetching wAR weekly data for period ${index}:`, error);
                        return 0;
                    }
                }))
            ]);
        
            // Update historical data
            historicalData['qARweeklyTransfer'] = qARPeriodData.map((count, index) => ({
                timestamp: periods[index].endTime,
                count: count
            }));
            historicalData['wARweeklyTransfer'] = wARPeriodData.map((count, index) => ({
                timestamp: periods[index].endTime,
                count: count
            }));
        
            // Update the combined weekly chart
            const chart = charts[processName];
            chart.data.labels = periods.map(period => {
                const labelDate = new Date(period.endTime);
                return labelDate.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                });
            });
            chart.data.datasets = [
                {
                    label: 'qAR Weekly Transfers',
                    data: qARPeriodData,
                    borderColor: getProcessColor('qARTransfer'),
                    tension: 0.1,
                    pointRadius: 5
                },
                {
                    label: 'wAR Weekly Transfers',
                    data: wARPeriodData,
                    borderColor: getProcessColor('wARTransfer'),
                    tension: 0.1,
                    pointRadius: 5
                }
            ];
        
            chart.update('none');
        
            // Hide loader
            const loader = document.getElementById(`qARweeklyTransferLoader`);
            if (loader) {
                loader.style.display = 'none';
            }
            
            console.log(`>>> END Successfully updated combined weekly transfer chart`);
            return;
        }
        
        // Skip processing for wAR weekly transfer since it's now part of the combined chart
        if (processName === 'wARweeklyTransfer') {
            const loader = document.getElementById(`wARweeklyTransferLoader`);
            if (loader) {
                loader.style.display = 'none';
            }
            return;
        }

        // Original code for other charts continues here
        const chart = charts[processName];
        if (!chart) {
            console.error(`CRITICAL: No chart found for process: ${processName}`);
            console.log('Available charts:', Object.keys(charts));
            return;
        }

        // Rest of your original code for other charts...
        const periodData = await Promise.all(periods.map(async (period, index) => {
            try {
                const query = await generateQuery(
                    processName, 
                    period.startHeight, 
                    period.endHeight, 
                    periods[periods.length - 1].endHeight
                );
                console.log(`GraphQL Query for ${processName} (Period ${index}):`, query);

                const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                const count = result.data.transactions.count;
                
                console.log(`Period ${index} result for ${processName}:`, {
                    startHeight: period.startHeight,
                    endHeight: period.endHeight,
                    endTime: period.endTime,
                    count: count
                });

                return count;
            } catch (periodError) {
                console.error(`Error processing period ${index} for ${processName}:`, periodError);
                return 0;
            }
        }));

        // Update historical data
        historicalData[processName] = periodData.map((count, index) => ({
            timestamp: periods[index].endTime,
            count: count
        }));

        const chartLabels = historicalData[processName].map((d, index, array) => {
            let labelDate;
            if (index === 0) {
                labelDate = new Date(d.timestamp);
            } else {
                const prevLabelDate = new Date(array[index - 1].timestamp);
                labelDate = new Date(prevLabelDate);
                const daysToAdd = processName.includes('weekly') ? 7 : 1;
                labelDate.setDate(prevLabelDate.getDate() + daysToAdd);
            }

            if (processName.includes('weekly')) {
                labelDate.setDate(labelDate.getDate());
            }

            return labelDate.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            });
        });

        const chartData = historicalData[processName].map((d) => d.count);

        // Update chart
        chart.data.labels = chartLabels;
        chart.data.datasets[0].data = chartData;
        chart.data.datasets[0].label = processName;
        chart.data.datasets[0].borderColor = getProcessColor(processName);
        chart.update('none');

        // Hide loader
        const loader = document.getElementById(`${processName}Loader`);
        if (loader) {
            loader.style.display = 'none';
        }

        console.log(`>>> END Successfully updated chart for ${processName}`);
    } catch (error) {
        console.error(`COMPREHENSIVE ERROR for ${processName}:`, error);
        const loader = document.getElementById(`${processName}Loader`);
        if (loader) {
            loader.style.display = 'none';
        }
    }
}
// Initial update using AO block tracking
fetchBlockHeights();

// Update every 20 minutes
setInterval(fetchBlockHeights, 20 * 60 * 1000);

// Export functions if needed
export { fetchBlockHeights, fetchHistoricalData };