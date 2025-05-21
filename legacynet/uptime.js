import { 
    addCustomNode, 
    removeCustomNode, 
    loadCustomNodes, 
    customNodes,
    checkCustomNode
} from './customnodes/custom.js';

import { 
    initializehundredThouNodes,
    checkAllSuperNodes,
    getHundredKNodesTotal,
    getHundredKNodesOnline
} from './100k.js';


// Configuration
const config = {
    testnet: {
        baseUrl: 'https://cu.ao-testnet.xyz/',
        nodePrefix: 'https://cu',
        nodeSuffix: '.ao-testnet.xyz/',
        initialNodes: 75, // Check CU1 - CU75
    },
    autoRefreshInterval: 1200000 // Auto-refresh every 20 minutes
};

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const additionalNodeInput = document.getElementById('additionalNode');
    const addNodeBtn = document.getElementById('addNodeBtn');
    const removeNodeBtn = document.getElementById('removeNodeBtn');
    const customStatusContainer = document.getElementById('customStatusContainer');
    loadCustomNodes()
    // Add event listeners for nodes
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', function() {
            addCustomNode(additionalNodeInput, customStatusContainer, checkNode);
        });
    }
    
    if (removeNodeBtn) {
        removeNodeBtn.addEventListener('click', function() {
            removeCustomNode(additionalNodeInput);
        });
    }
    
    // Handle navigation highlighting
    handleNavigationHighlighting();
    
    // Initialize the app (which should contain everything else)
    initializeApp();
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

// State
let currentNetwork = 'testnet';
let autoRefreshTimer;

// DOM Elements
const statusContainer = document.getElementById('statusContainer');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdatedEl = document.getElementById('lastUpdated');
const summaryTextEl = document.getElementById('summaryText');
const addNodeBtn = document.getElementById('addNodeBtn');
const additionalNodeInput = document.getElementById('additionalNode');



function initializeApp() {
    // Load custom nodes from localStorage if available
    loadCustomNodes();
    
    // Set up event listeners
    refreshBtn.addEventListener('click', () => {
        checkAllNodes();
        // Also refresh super clusters if that section exists
        if (document.getElementById('hundredThouNodesContent')) {
            checkAllSuperNodes();
        }
    });
    
    // Initial check
    checkAllNodes();
    
    // Initialize super clusters if the section exists
    if (document.getElementById('hundredThouNodesContent')) {
        initializehundredThouNodes();
    }
    
    // Set up auto-refresh
    startAutoRefresh();
}


function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => checkAllNodes(), config.autoRefreshInterval);
}


function checkAllNodes() {
    // Clear the container
    statusContainer.innerHTML = '';
    
    // Update last checked time
    updateLastCheckedTime();
    
    // Get network config
    const networkConfig = config[currentNetwork];
    
    // First create cards for custom nodes at the top
    const customNodesCount = customNodes.length;
    
    // Then check default nodes
    let checkedCount = 0;
    let onlineCount = 0;
    let initialToCheck = networkConfig.initialNodes;
    let totalToCheck = initialToCheck + customNodes.length;

    
    // Check all the numbered nodes (after custom nodes)
    for (let i = 1; i <= networkConfig.initialNodes; i++) {
        const nodeUrl = `${networkConfig.nodePrefix}${i}${networkConfig.nodeSuffix}`;
        checkNode(nodeUrl, (isOnline) => {
            checkedCount++;
            if (isOnline) onlineCount++;
            updateSummary(onlineCount, checkedCount, totalToCheck);
            
        });
    }

    const customStatusContainer = document.getElementById('customStatusContainer');
    if (customStatusContainer) {
        loadAndDisplayCustomNodes(customStatusContainer, checkNode);
    }
}

// Function to load and display saved nodes in the custom section
function loadAndDisplayCustomNodes(customStatusContainer, checkNode) {
    const savedNodes = loadCustomNodes();
    
    // Display any saved custom nodes in the custom section
    if (savedNodes && savedNodes.length > 0 && customStatusContainer) {
        // Clear the container first to avoid duplicates
        customStatusContainer.innerHTML = '';
        
        savedNodes.forEach(nodeUrl => {
            // Skip null or undefined URLs
            if (!nodeUrl) return;
            
            // Create and display node card
            const nodeId = `custom-${nodeUrl.replace(/^https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
            
            // Get display name (full URL without protocol)
            let nodeName = nodeUrl.replace(/^https?:\/\//, '');
            let nodeCard = document.createElement('div');
            nodeCard.id = nodeId;
            nodeCard.className = 'node-card';
            nodeCard.innerHTML = `
                <div class="node-name">${nodeName}</div>
                <div class="status">
                    <span class="status-indicator loading"></span>
                    <span>Checking...</span>
                </div>
                <div class="response-time">-</div>
            `;
            
            // Add to custom container
            customStatusContainer.appendChild(nodeCard);
            
            // Check the node with our custom check function instead of the regular checkNode
            checkCustomNode(nodeUrl, nodeCard);
        });
    }
    
    return savedNodes;
}


function checkNode(nodeUrl, callback) {
    // Create a card for this node
    const nodeId = nodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '');
    const nodeName = nodeUrl.match(/\/\/([^.]+)/)[1] || nodeUrl;
    
    // Create or update the node card
    let nodeCard = document.getElementById(nodeId);
    if (!nodeCard) {
        nodeCard = document.createElement('div');
        nodeCard.id = nodeId;
        nodeCard.className = 'node-card';
        
        // If this is a custom node, insert at the top
        const isCustomNode = customNodes.includes(nodeUrl);
        if (isCustomNode) {
            // Find the first non-custom node card and insert before it
            const firstRegularNode = Array.from(statusContainer.children).find(card => {
                const cardNodeUrl = 'https://' + card.id.replace(/-/g, '.') + '/';
                return !customNodes.includes(cardNodeUrl);
            });
            
            if (firstRegularNode) {
                statusContainer.insertBefore(nodeCard, firstRegularNode);
            } else {
                statusContainer.appendChild(nodeCard);
            }
        } else {
            // Regular node goes after custom nodes
            statusContainer.appendChild(nodeCard);
        }
    }
    
    // Update card UI to loading state
    nodeCard.innerHTML = `
        <div class="node-name">${nodeName}</div>
        <div class="status">
            <span class="status-indicator loading"></span>
            <span>Checking...</span>
        </div>
        <div class="response-time">-</div>
    `;
    
    // Check the node status
    const startTime = performance.now();
    
    // Define timeouts
    const busyTimeout = 2000;    // 3 seconds - mark as busy
    const offlineTimeout = 15000; // 10 seconds - mark as unavailable
    
    // Create an AbortController to handle the final timeout
    const controller = new AbortController();
    
    // Setup the busy timeout - if node doesn't respond in 3 seconds, mark as busy
    const busyTimeoutId = setTimeout(() => {
        updateNodeCard(nodeCard, 'busy');
    }, busyTimeout);
    
    // Setup the unavailable timeout - if node doesn't respond in 10 seconds, mark as unavailable
    const offlineTimeoutId = setTimeout(() => {
        controller.abort();
        updateNodeCard(nodeCard, 'unavailable');
        if (callback) callback(false);
    }, offlineTimeout);
    
    fetch(nodeUrl, { 
        method: 'HEAD',
        signal: controller.signal 
    })
    .then(response => {
        // Clear both timeouts
        clearTimeout(busyTimeoutId);
        clearTimeout(offlineTimeoutId);
        
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(0);
        
        updateNodeCard(nodeCard, 'online', responseTime);
        if (callback) callback(true);
    })
    .catch(error => {
        // Clear both timeouts
        clearTimeout(busyTimeoutId);
        clearTimeout(offlineTimeoutId);
        
        // If it's an abort error, we've already handled it with the timeout
        if (error.name === 'AbortError') {
            return;
        }
        
        // Check if the error is due to the node not existing
        const isNonExistent = error.message && (
            error.message.includes('ERR_NAME_NOT_RESOLVED') || 
            error.message.includes('Failed to fetch')
        );
        
        // Only remove non-existent nodes that aren't in the first 150
        const isStandardNode = nodeUrl.includes(config[currentNetwork].nodePrefix);
        const nodeNumber = isStandardNode ? parseInt(nodeUrl.match(/cu(\d+)/)[1]) : 0;
        const isInInitialSet = nodeNumber > 0 && nodeNumber <= config[currentNetwork].initialNodes;
        const isCustom = customNodes.includes(nodeUrl);
        
        if (isNonExistent && !isInInitialSet && !isCustom) {
            // Remove card for non-existent nodes that aren't custom or in the initial set
            nodeCard.remove();
        } else {
            // Node exists but is unavailable
            updateNodeCard(nodeCard, 'unavailable');
        }
        
        if (callback) callback(false);
    });
}

// Updated function to handle three states with response time consideration
function updateNodeCard(nodeCard, status, responseTime = null) {
    const statusIndicator = nodeCard.querySelector('.status-indicator');
    const statusText = nodeCard.querySelector('.status span:last-child');
    const responseTimeEl = nodeCard.querySelector('.response-time');
    
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

function updateSummary(onlineCount, checkedCount, totalCount) {

    const hundredKTotal = getHundredKNodesTotal() || 0;
    const hundredKOnline = getHundredKNodesOnline() || 0;
    // Add the hundredK nodes to our totals
    const grandTotalCount = checkedCount + hundredKTotal;
    const grandOnlineCount = onlineCount + hundredKOnline;
    
    // Calculate percentage based on all nodes
    const percentage = ((grandOnlineCount / grandTotalCount) * 100).toFixed(1);
    
    // Update the display with the combined totals
    summaryTextEl.innerHTML = `
        <strong>${grandOnlineCount}</strong> of <strong>${grandTotalCount}</strong> nodes available (${percentage}%)
        <br>
        <progress value="${grandOnlineCount}" max="${grandTotalCount}" style="width: 50%; margin-top: 10px;"></progress>
    `;
    
}

function updateLastCheckedTime() {
    const now = new Date();
    lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}