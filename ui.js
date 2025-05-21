/**
 * UI-related operations and event handlers for the Eye of AO dashboard
 */
import { DEFAULT_TIME_RANGE } from './config.js';
import { formatDate, debounce } from './utils.js';
import { updateChartTimeRange } from './charts.js';

// Store time range state for each chart
const chartTimeRanges = {};

/**
 * Updates the network info display in the header
 * @param {number} currentHeight - Current network block height
 * @param {Object} latestPeriod - Latest time period data
 */
export function updateNetworkInfoDisplay(currentHeight, latestPeriod) {
    const infoElement = document.getElementById('blockInfo');
    if (!infoElement) return;
    
    const latestTime = new Date(latestPeriod.endTime);
    const timeStr = formatDate(latestTime);
    
    infoElement.textContent = `Current Block: ${currentHeight} | Latest Period (${timeStr}): ${latestPeriod.startHeight} - ${latestPeriod.endHeight}`;
}

/**
 * Shows the loader for a specific chart
 * @param {string} processName - The process name
 * @param {boolean} show - Whether to show or hide the loader
 */
export function toggleChartLoader(processName, show = true) {
    let loaderId;
    
    // Handle special cases for various chart loaders
    if (processName === 'USDATransfer') {
        // USDATransfer shares the same loader as wUSDCTransfer
        loaderId = 'wUSDCTransferLoader';
    } else {
        loaderId = `${processName}Loader`;
    }
    
    const loaderElement = document.getElementById(loaderId);
    if (loaderElement) {
        loaderElement.style.display = show ? 'flex' : 'none';
    } else {
        console.warn(`Loader element not found: ${loaderId} for process ${processName}`);
    }
}

/**
 * Shows or hides the main app loader
 * @param {boolean} show - Whether to show or hide the loader
 */
export function toggleMainLoader(show = true) {
    const mainLoader = document.getElementById('mainLoader');
    if (mainLoader) {
        mainLoader.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Shows all loaders for charts
 */
export function showAllChartLoaders() {
    const loaders = document.querySelectorAll('.chart-loader');
    loaders.forEach(loader => {
        loader.style.display = 'flex';
    });
}

/**
 * Hides all loaders for charts
 */
export function hideAllChartLoaders() {
    const loaders = document.querySelectorAll('.chart-loader');
    loaders.forEach(loader => {
        loader.style.display = 'none';
    });
}

/**
 * Sets up event listeners for time range buttons on all charts
 * @param {Function} fetchDataCallback - Callback for regular data fetching
 * @param {Function} fetchWeeklyCallback - Callback for weekly data fetching
 */
export function setupTimeRangeButtons(fetchDataCallback, fetchWeeklyCallback) {
    // Get all chart cards
    const chartCards = document.querySelectorAll('.chart-card');
    
    // Initialize chartTimeRanges for each process
    const processNames = [
         'wARTransfer', 'wUSDCTransfer', 'USDATransfer', 
        'AOTransfer', 'permaswap', 'botega', 'llamaLand',
         'wARweeklyTransfer', 'wARTotalSupply', 'stargrid'
    ];
    
    processNames.forEach(processName => {
        chartTimeRanges[processName] = DEFAULT_TIME_RANGE;
    });
    
    // For each chart card, set up the buttons
    chartCards.forEach(card => {
        // Find the canvas to determine which chart we're dealing with
        const canvas = card.querySelector('canvas');
        if (!canvas) {
            console.warn('No canvas found in chart card', card);
            return;
        }
        
        // Get process name from canvas ID
        let processName;
        if (canvas.id === 'wARTotalSupplyChart') {
            processName = 'wARTotalSupply';
        } else {
            processName = canvas.id.replace('Chart', '');
        }
        
        // Set default time range for this chart
        chartTimeRanges[processName] = DEFAULT_TIME_RANGE;
        
        // Find all time range buttons in this card
        const buttons = card.querySelectorAll('.chart-action-btn');
        
        // Add click handlers to each button
        buttons.forEach(button => {
            // Remove any existing event listeners to prevent duplicates
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', async () => {
                // Get the time range from the button text
                const timeRange = newButton.textContent.trim();
                
                // Skip if this is already the active time range
                if (timeRange === chartTimeRanges[processName]) {
                    console.log(`${processName}: Already showing ${timeRange} time range`);
                    return;
                }
                
                // Update button states
                card.querySelectorAll('.chart-action-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                newButton.classList.add('active');
                
                // Show loader while updating
                toggleChartLoader(processName, true);
                
                // Update the stored time range
                chartTimeRanges[processName] = timeRange;
                
                try {
                    // Special handling for wAR chart
                    if (processName === 'wARTransfer') {
                        // Make sure we update both datasets
                        if (timeRange === '1M' || timeRange === '3M') {
                            await fetchDataCallback(processName, timeRange);
                        } else {
                            // For 1W, just update the chart display
                            updateChartTimeRange(processName, timeRange);
                        }
                    }
                    // Special handling for wUSDC/USDA combined chart
                    else if (processName === 'wUSDCTransfer') {
                        if (timeRange === '1M' || timeRange === '3M') {
                            await fetchDataCallback(processName, timeRange);
                        } else {
                            updateChartTimeRange(processName, timeRange);
                        }
                    }
                    // Check if we need more data for longer time ranges for specific charts
                    else if (['AOTransfer', 'permaswap', 'botega', 'llamaLand', 'stargrid'].includes(processName) &&
                        (timeRange === '1M' || timeRange === '3M')) {
                        
                        await fetchDataCallback(processName, timeRange);
                    } 
                    // For weekly charts
                    // Special handling for wAR weekly combined chart
                    else if (processName === 'wARweeklyTransfer') {
                        if (timeRange === '1M' || timeRange === '3M') {
                            await fetchWeeklyCallback(processName, timeRange);
                        } else {
                            updateChartTimeRange(processName, timeRange);
                        }
                    }
                    // For all other cases, just update the chart display
                    else {
                        updateChartTimeRange(processName, timeRange);
                    }
                    
                } catch (error) {
                    console.error(`Error updating chart for ${processName}:`, error);
                } finally {
                    // Hide loader regardless of success or failure
                    toggleChartLoader(processName, false);
                }
            });
        });
        
        // Set initial active button
        const defaultButton = Array.from(buttons).find(btn => 
            btn.textContent.trim() === DEFAULT_TIME_RANGE
        );
        if (defaultButton) {
            defaultButton.classList.add('active');
        } else if (buttons.length > 0) {
            // Fallback to first button if default not found
            buttons[0].classList.add('active');
        }
    });
}


/**
 * Sets up responsive behavior for the dashboard
 */
export function setupResponsiveness() {
    // Create a debounced resize handler
    const handleResize = debounce(() => {
        // Check screen size and adjust layout if needed
        const isMobile = window.innerWidth < 768;
        const dashboardGrid = document.querySelector('.dashboard-grid');
        
        if (dashboardGrid) {
            if (isMobile) {
                dashboardGrid.style.gridTemplateColumns = '1fr';
            } else {
                dashboardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))';
            }
        }
    }, 200);
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Initial call to set layout
    handleResize();
}

/**
 * Sets active state for the current navigation link
 */
export function setupNavigation() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        
        if (currentPage.includes(linkPath) && linkPath !== "/" && linkPath !== "/index.html") {
            link.classList.add('active');
        } else if (linkPath === "/index.html" && (currentPage === "/" || currentPage === "/index.html")) {
            link.classList.add('active');
        }
    });
}

/**
 * Gets the current time range for a chart
 * @param {string} processName - The process name
 * @returns {string} The current time range
 */
export function getChartTimeRange(processName) {
    return chartTimeRanges[processName] || DEFAULT_TIME_RANGE;
}

/**
 * Initializes all UI elements and handlers
 */
export function initializeUI() {
    // Show main loader initially
    toggleMainLoader(true);
    
    // Show all chart loaders initially
    showAllChartLoaders();
    
    // Set up navigation highlight
    setupNavigation();
    
    // Set up responsive behavior
    setupResponsiveness();
    
    // Initialize empty time ranges for all charts
    Object.keys(chartTimeRanges).forEach(key => {
        chartTimeRanges[key] = DEFAULT_TIME_RANGE;
    });
}