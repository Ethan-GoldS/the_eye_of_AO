// hyperbeam-uptime.js with fixes for node rendering issues
import { 
    addCustomNode, 
    removeCustomNode, 
    loadCustomNodes, 
    customNodes,
    loadAndDisplayCustomNodes
} from './customnodes/custom.js';

import { 
    initializeMainnetNodes,
    checkAllMainnetNodes,
    getMainnetNodesTotal,
    getMainnetNodesOnline,
    getCuNodesTotal,
    getCuNodesOnline,
    checkHyperBeamNodeStatus,
    checkCuNodeStatus
} from './mainnet-nodes.js';

// Added flag to track initialization state
let appInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded event fired");
    
    // Get DOM elements
    const additionalNodeInput = document.getElementById('additionalNode');
    const addNodeBtn = document.getElementById('addNodeBtn');
    const removeNodeBtn = document.getElementById('removeNodeBtn');
    const customStatusContainer = document.getElementById('customStatusContainer');
    
    // Load custom nodes with delay to ensure DOM is ready
    setTimeout(() => {
        loadCustomNodes();
    }, 100);
    
    // Add event listeners for nodes
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', function() {
            addCustomNode(additionalNodeInput, customStatusContainer);
        });
    }
    
    if (removeNodeBtn) {
        removeNodeBtn.addEventListener('click', function() {
            removeCustomNode(additionalNodeInput);
        });
    }
    
    // Handle navigation highlighting
    handleNavigationHighlighting();
    
    // Initialize the app with a slight delay to ensure DOM is ready
    // This is the most critical fix - ensuring the DOM is fully loaded
    setTimeout(() => {
        console.log("Delayed initialization starting...");
        initializeApp();
    }, 200);

    // Add a fallback initialization check after 1 second
    setTimeout(() => {
        if (!appInitialized) {
            console.log("Fallback initialization due to timeout");
            initializeApp();
        }
    }, 1000);
});

// Load event is more reliable than DOMContentLoaded for ensuring all resources are ready
window.addEventListener('load', function() {
    console.log("Window load event fired");
    // If app wasn't initialized by DOMContentLoaded, do it now
    if (!appInitialized) {
        console.log("Initializing app from load event");
        initializeApp();
    } else {
        console.log("App was already initialized, refreshing data");
        // If nodes aren't visible, try refreshing them
        const mainnetContent = document.getElementById('mainnetNodesContent');
        const mainnetStatusContainer = document.getElementById('mainnetStatusContainer');
        
        if (mainnetContent && mainnetStatusContainer && mainnetStatusContainer.children.length === 0) {
            console.log("Nodes container exists but is empty, rechecking nodes...");
            checkAllMainnetNodes();
        }
    }
});

function handleNavigationHighlighting() {
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

// DOM Elements
let summaryTextEl; // Changed to let so we can reassign if needed

function initializeApp() {
    // Prevent multiple initializations
    if (appInitialized) {
        console.log("App already initialized, skipping");
        return;
    }
    
    console.log("Initializing app...");
    
    // Try to get the summary element again in case it wasn't available earlier
    summaryTextEl = document.getElementById('summaryText');
    
    // Load custom nodes from localStorage if available
    loadCustomNodes();
    
    // Initialize mainnet nodes if the section exists
    const mainnetContent = document.getElementById('mainnetNodesContent');
    const mainnetStatusContainer = document.getElementById('mainnetStatusContainer');
    
    if (mainnetContent) {
        console.log("Mainnet content found:", mainnetContent);
        console.log("Mainnet status container:", mainnetStatusContainer);
        
        if (!mainnetStatusContainer) {
            console.warn("Mainnet status container is missing! Creating it...");
            // Create the container if it's missing
            const newContainer = document.createElement('div');
            newContainer.id = 'mainnetStatusContainer';
            newContainer.className = 'node-grid';
            mainnetContent.appendChild(newContainer);
        }
        
        console.log("Initializing mainnet nodes...");
        initializeMainnetNodes();
    } else {
        console.warn("Mainnet nodes section not found. Skipping mainnet initialization.");
    }
    
    // Only check custom nodes if we have the container
    const customStatusContainer = document.getElementById('customStatusContainer');
    if (customStatusContainer) {
        console.log("Checking custom nodes...");
        loadAndDisplayCustomNodes(customStatusContainer);
    } else {
        console.warn("Custom nodes container not found. Skipping custom node check.");
    }
    
    // Set the initialization flag
    appInitialized = true;
    console.log("App initialization complete");
}

// Updated function to handle three states with response time consideration
function updateNodeCard(nodeCard, status, responseTime = null) {
    if (!nodeCard) {
        console.error("updateNodeCard called with null nodeCard");
        return;
    }
    
    const statusIndicator = nodeCard.querySelector('.status-indicator');
    const statusText = nodeCard.querySelector('.status span:last-child');
    const responseTimeEl = nodeCard.querySelector('.response-time');
    
    if (!statusIndicator || !statusText || !responseTimeEl) {
        console.error("Required elements not found in nodeCard:", nodeCard);
        return;
    }
    
    // If we have a response time, determine status based on that
    if (responseTime !== null) {
        const busyThreshold = 2000; // 2 seconds
        
        if (parseInt(responseTime) > busyThreshold) {
            status = 'busy'; // Override the status if response time exceeds threshold
        }
    }
    
    // Set appropriate status class and text
    switch(status) {
        case 'online':
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Online';
            responseTimeEl.textContent = `Response time: ${responseTime}ms`;
            break;
        case 'busy':
            statusIndicator.className = 'status-indicator busy';
            statusText.textContent = 'Busy';
            responseTimeEl.textContent = responseTime ? `Response time: ${responseTime}ms` : 'Slow response...';
            break;
        case 'unavailable':
            statusIndicator.className = 'status-indicator unavailable';
            statusText.textContent = 'Unavailable';
            responseTimeEl.textContent = 'Timeout';
            break;
    }
}

function updateSummary() {
    // Try to get the element again if it wasn't found initially
    if (!summaryTextEl) {
        summaryTextEl = document.getElementById('summaryText');
        if (!summaryTextEl) {
            console.warn("Summary text element not found. Cannot update summary.");
            return;
        }
    }

    // Get current values from mainnet node tracker
    const mainnetHBTotal = getMainnetNodesTotal() || 0;
    const mainnetHBOnline = getMainnetNodesOnline() || 0;
    const mainnetCUTotal = getCuNodesTotal() || 0;
    const mainnetCUOnline = getCuNodesOnline() || 0;
    
    // Sanity check - ensure online count never exceeds total count
    const validatedCUOnline = Math.min(mainnetCUOnline, mainnetCUTotal);
    const validatedHBOnline = Math.min(mainnetHBOnline, mainnetHBTotal);

    // Make sure total is at least equal to online count
    const adjustedCUTotal = Math.max(mainnetCUTotal, mainnetCUOnline);
    const adjustedHBTotal = Math.max(mainnetHBTotal, mainnetHBOnline);

    const hbPercentage = adjustedHBTotal > 0
        ? ((validatedHBOnline / adjustedHBTotal) * 100).toFixed(1)
        : 0;

    const cuPercentage = adjustedCUTotal > 0
        ? ((validatedCUOnline / adjustedCUTotal) * 100).toFixed(1)
        : 0;

    summaryTextEl.innerHTML = `
        <div class="stats-section">
            <h3>HyperBEAM Nodes</h3>
            <strong>${validatedHBOnline}</strong> of <strong>${adjustedHBTotal}</strong> nodes available (${hbPercentage}%)
            <br>
            <progress value="${validatedHBOnline}" max="${adjustedHBTotal}" style="width: 70%; margin-top: 10px;"></progress>
        </div>
        
        <div class="stats-section" style="margin-top: 15px;">
            <h3>Compute Units (CU)</h3>
            <strong>${validatedCUOnline}</strong> of <strong>${adjustedCUTotal}</strong> nodes available (${cuPercentage}%)
            <br>
            <progress value="${validatedCUOnline}" max="${adjustedCUTotal}" style="width: 70%; margin-top: 10px;"></progress>
        </div>
    `;
}

export {
    updateNodeCard,
    updateSummary
};