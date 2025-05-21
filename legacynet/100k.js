// super.js - Super clusters node checking functionality
import { hundredknodes } from './hundredknodes.js';

// Configuration
const config = {
    testnet: {
        nodeSuffix: '.ao-testnet.xyz/',
    },
    checkTimeout: 15000, // Timeout for each check (ms)
    busyTimeout: 2000,  // Time to mark as busy (ms)
    autoRefreshInterval: 1200000 // Auto-refresh every 20 minutes
};

// State
let autoRefreshTimer;
let currentNetwork = 'testnet';

// Initialize super clusters dashboard
function initializehundredThouNodes() {
    // Initial check
    checkAllSuperNodes();
    
    // Set up auto-refresh
    startAutoRefresh();
}

function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => checkAllSuperNodes(), config.autoRefreshInterval);
}

function updateLastCheckedTime() {
    const lastUpdatedEl = document.getElementById('superLastUpdated');
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

let hundredKNodesTotal = 0;
let hundredKNodesOnline = 0;

function checkAllSuperNodes() {
    const superStatusContainer = document.getElementById('superStatusContainer');
    if (!superStatusContainer) return;
    
    // Clear the container
    superStatusContainer.innerHTML = '';
    
    // Update last checked time
    updateLastCheckedTime();
    
    // Set the total count
    hundredKNodesTotal = hundredknodes.length;
    hundredKNodesOnline = 0; // Will be incremented as nodes are checked
    
    // Check all super cluster nodes
    hundredknodes.forEach(nodeName => {
        const nodeUrl = `https://${nodeName}${config[currentNetwork].nodeSuffix}`;
        checkSuperNode(nodeUrl, superStatusContainer);
    });
}

function checkSuperNode(nodeUrl, container) {
    // Create a card for this node
    const nodeId = `super-${nodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
    const nodeName = nodeUrl.match(/\/\/([^.]+)/)[1] || nodeUrl;
    
    // Create the node card
    const nodeCard = document.createElement('div');
    nodeCard.id = nodeId;
    nodeCard.className = 'node-card';
    
    // Add to container
    container.appendChild(nodeCard);
    
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
    const busyTimeout = config.busyTimeout;
    const offlineTimeout = config.checkTimeout;
    
    // Create an AbortController to handle the final timeout
    const controller = new AbortController();
    
    // Setup the busy timeout - if node doesn't respond in set time, mark as busy
    const busyTimeoutId = setTimeout(() => {
        updateSuperNodeCard(nodeCard, 'busy');
    }, busyTimeout);
    
    // Setup the unavailable timeout - if node doesn't respond in set time, mark as unavailable
    const offlineTimeoutId = setTimeout(() => {
        controller.abort();
        updateSuperNodeCard(nodeCard, 'unavailable');
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
        
        // Determine status based on response time
        let status = 'online';
        if (parseInt(responseTime) > busyTimeout) {
            status = 'busy';
        }
        if (status === 'online' || status === 'busy') {
            hundredKNodesOnline++;
        }
        
        updateSuperNodeCard(nodeCard, status, responseTime);
    })
    .catch(error => {
        // Clear both timeouts
        clearTimeout(busyTimeoutId);
        clearTimeout(offlineTimeoutId);
        
        // If it's an abort error, we've already handled it with the timeout
        if (error.name === 'AbortError') {
            return;
        }
        
        // Update card to unavailable status
        updateSuperNodeCard(nodeCard, 'unavailable');
    });
}

function updateSuperNodeCard(nodeCard, status, responseTime = null) {
    const statusIndicator = nodeCard.querySelector('.status-indicator');
    const statusText = nodeCard.querySelector('.status span:last-child');
    const responseTimeEl = nodeCard.querySelector('.response-time');
    
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

function getHundredKNodesTotal() {
    return hundredKNodesTotal;
}

function getHundredKNodesOnline() {
    return hundredKNodesOnline;
}

// Export functions
export {
    initializehundredThouNodes,
    checkAllSuperNodes,
    checkSuperNode,
    getHundredKNodesTotal,
    getHundredKNodesOnline
};
