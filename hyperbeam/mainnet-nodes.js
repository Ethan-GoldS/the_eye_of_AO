// mainnet-nodes.js - HyperBEAM mainnet node checking functionality
import { mainnetNodes } from './mainnet-node-list.js';
import { updateSummary } from './hyperbeam-uptime.js';

// Configuration
const config = {
    checkTimeout: 10000, // Timeout for each check (ms)
    busyTimeout: 2000,   // Time to mark as busy (ms)
    autoRefreshInterval: 1200000 // Auto-refresh every 20 minutes
};

// State
let autoRefreshTimer;
let mainnetNodesTotal = 0;
let mainnetNodesOnline = 0;
let cuNodesTotal = 0;
let cuNodesOnline = 0;

// Initialize mainnet nodes dashboard
function initializeMainnetNodes() {
    // Initial check
    checkAllMainnetNodes();
    
    // Set up auto-refresh
    startAutoRefresh();
}

function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => checkAllMainnetNodes(), config.autoRefreshInterval);
}



function updateLastCheckedTime() {
    const mainnetLastUpdatedEl = document.getElementById('mainnetLastUpdated');
    const customLastUpdatedEl = document.getElementById('customLastUpdated');
    
    const now = new Date();
    const timeString = `Last updated: ${now.toLocaleTimeString()}`;
    
    // Update mainnet timestamp
    if (mainnetLastUpdatedEl) {
        mainnetLastUpdatedEl.textContent = timeString;
    }
    
    // Update custom nodes timestamp
    if (customLastUpdatedEl) {
        customLastUpdatedEl.textContent = timeString;
    }
}

function checkAllMainnetNodes() {
    const mainnetStatusContainer = document.getElementById('mainnetStatusContainer');
    if (!mainnetStatusContainer) {
        console.warn("Mainnet status container not found. Cannot check mainnet nodes.");
        return;
    }
    
    console.log("Starting mainnet node check...");
    
    // Clear the container
    mainnetStatusContainer.innerHTML = '';
    
    // Update last checked time
    updateLastCheckedTime();
    
    // Set the total count - mainnet nodes plus CU nodes that are not "--"
    mainnetNodesTotal = mainnetNodes.length;
    mainnetNodesOnline = 0; // Will be incremented as nodes are checked
    
    // Update the global cuNodesTotal variable, not just create a local one
    cuNodesTotal = mainnetNodes.filter(node => node.cu && node.cu !== "--").length;
    cuNodesOnline = 0; // Will be incremented as nodes are checked
    
    let checkedHBcount = 0;
    let checkedCUcount = 0;
    
    console.log(`Checking ${mainnetNodes.length} mainnet nodes with ${cuNodesTotal} CU nodes...`);
    
    // Check all mainnet nodes and their corresponding CUs
    mainnetNodes.forEach((node, index) => {
        const hbNodeUrl = node.proxy
            ? `https://node-checker-test.ravensnestx16r.workers.dev/?url=${node.hb}`
            : node.hb;
    
        const cuNodeUrl = node.cu && node.cu !== "--"
            ? (node.proxy
                ? `https://node-checker-test.ravensnestx16r.workers.dev/?url=${node.cu}`
                : node.cu)
            : "--";
    
        console.log(`Checking node pair: ${hbNodeUrl} and ${cuNodeUrl}`);
    
        checkMainnetNodePair(
            hbNodeUrl,
            cuNodeUrl,
            node.hb,
            node.cu,
            mainnetStatusContainer,
            (hbOnline, cuOnline) => {
          
            checkedHBcount++;
            if (hbOnline) mainnetNodesOnline++;
    
            if (node.cu !== "--") {
                checkedCUcount++;
                if (cuOnline) cuNodesOnline++;
            }
    
            updateSummary();
        });
    });
}

function checkMainnetNodePair(hbNodeUrl, cuNodeUrl, hbDisplayName, cuDisplayName, container, callback) {
    // Create a card for this node pair
    const nodeId = `mainnet-${hbNodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
    // Remove both protocol prefix and trailing slash from display names
    const hbNodeName = hbDisplayName.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Get CU display name - also remove trailing slash
    const cuNodeName = cuDisplayName && cuDisplayName !== "--"
        ? cuDisplayName.replace(/^https?:\/\//, '').replace(/\/$/, '')
        : "--";
  
    
    // Create the node card
    const nodeCard = document.createElement('div');
    nodeCard.id = nodeId;
    nodeCard.className = 'node-card';
    
    // Add to container
    container.appendChild(nodeCard);
    
    // Update card UI to loading state
    nodeCard.innerHTML = `
        <div class="node-name">${hbNodeName}</div>
        <div class="status">
            <span class="status-indicator loading"></span>
            <span>Checking HyperBEAM...</span>
        </div>
        <div class="response-time">-</div>
        <div class="cu-status-container">
            <div class="cu-label">CU: ${cuNodeName}</div>
            <div class="status">
                <span class="status-indicator ${cuNodeUrl === "--" ? "unavailable" : "loading"}"></span>
                <span>${cuNodeUrl === "--" ? "Not Available" : "Checking CU..."}</span>
            </div>
            <div class="response-time">${cuNodeUrl === "--" ? "-" : "-"}</div>
        </div>
        <div class="node-actions">
            <a href="${unwrapProxiedUrl(hbDisplayName)}" target="_blank" title="Visit HyperBEAM Node">

                <i class="fas fa-external-link-alt"></i>
            </a>
            <a href="${unwrapProxiedUrl(hbDisplayName)}~meta@1.0/info" target="_blank" title="View HyperBEAM Metadata">
                <i class="fas fa-info-circle"></i>
            </a>
            ${cuNodeUrl !== "--" ? `
            <a href="${unwrapProxiedUrl(cuDisplayName)}" target="_blank" title="Visit CU Node">
                <i class="fas fa-server"></i>
            </a>` : ''}
        </div>
    `;
    
    // Check HyperBEAM node status
    let hbOnline = false;
    let cuOnline = false;
    
    // Check HB node first
    checkHyperBeamNodeStatus(hbNodeUrl, nodeCard, (isHbOnline) => {
        hbOnline = isHbOnline;
        
        // After HB check is done, check CU if it exists
        if (cuNodeUrl !== "--") {
            checkCuNodeStatus(cuNodeUrl, nodeCard, (isCuOnline) => {
                cuOnline = isCuOnline;
                if (callback) callback(hbOnline, cuOnline);
            });
        } else {
            // No CU to check
            if (callback) callback(hbOnline, false);
        }
    });
}

function unwrapProxiedUrl(url) {
    if (url.includes("node-checker-test.ravensnestx16r.workers.dev/?url=")) {
        return decodeURIComponent(url.split("url=")[1]);
    }
    return url;
}



// Function to check HyperBEAM nodes
function checkHyperBeamNodeStatus(nodeUrl, nodeCard, callback) {
    const isProxied = nodeUrl.includes("node-checker");
    const busyTimeout = config.busyTimeout;
    const offlineTimeout = config.checkTimeout;
    const startTime = performance.now();
    const controller = new AbortController();

    const statusIndicator = nodeCard.querySelector('.status-indicator');
    const statusText = nodeCard.querySelector('.status span:last-child');
    const responseTimeEl = nodeCard.querySelector('.response-time');

    const busyTimeoutId = setTimeout(() => {
        statusIndicator.className = 'status-indicator busy';
        statusText.textContent = 'Busy';
        responseTimeEl.textContent = 'Slow response...';
    }, busyTimeout);

    const offlineTimeoutId = setTimeout(() => {
        controller.abort();
        statusIndicator.className = 'status-indicator unavailable';
        statusText.textContent = 'Unavailable';
        responseTimeEl.textContent = 'Timeout';
        if (callback) callback(false);
    }, offlineTimeout);

    const fetchOptions = {
        method: isProxied ? 'GET' : 'HEAD',
        signal: controller.signal,
        mode: isProxied ? 'cors' : 'no-cors',
        credentials: 'omit'
    };

    fetch(nodeUrl, fetchOptions)
        .then(res => isProxied ? res.json() : res)
        .then(data => {
            clearTimeout(busyTimeoutId);
            clearTimeout(offlineTimeoutId);
            const endTime = performance.now();
            const responseTime = (endTime - startTime).toFixed(0);

            const isOnline = isProxied ? data.online === true : true;
            const status = parseInt(responseTime) > busyTimeout ? 'busy' : 'online';

            if (isOnline) {
                statusIndicator.className = `status-indicator ${status}`;
                statusText.textContent = status === 'online' ? 'Online' : 'Busy';
                responseTimeEl.textContent = `Response time: ${responseTime}ms`;
                if (callback) callback(true);
            } else {
                statusIndicator.className = 'status-indicator unavailable';
                statusText.textContent = 'Unavailable';
                responseTimeEl.textContent = 'Offline';
                if (callback) callback(false);
            }
        })
        .catch(error => {
            clearTimeout(busyTimeoutId);
            clearTimeout(offlineTimeoutId);
            console.error(`Error checking HB node ${nodeUrl}:`, error.message);
            statusIndicator.className = 'status-indicator unavailable';
            statusText.textContent = 'Unavailable';
            responseTimeEl.textContent = 'Error';
            if (callback) callback(false);
        });
}


function checkCuNodeStatus(nodeUrl, nodeCard, callback) {
    if (nodeUrl.includes("node-checker")) {
        checkCuViaWorker(nodeUrl, nodeCard, callback);
    } else {
        checkCuDirectHttps(nodeUrl, nodeCard, callback);
    }
}

function checkCuViaWorker(nodeUrl, nodeCard, callback) {
    const startTime = performance.now();
    const controller = new AbortController();

    fetch(nodeUrl, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
    })
    .then(async res => {
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(0);

        let data;
        try {
            data = await res.json();
        } catch {
            console.warn(`⚠️ CU Proxy JSON invalid for ${nodeUrl}`);
            return markCuOffline();
        }

        const isOnline = data.online === true && data.status >= 200 && data.status < 500;
        updateCuDisplay(isOnline, responseTime, nodeCard, callback);
    })
    .catch(err => {
        console.error(`[CU Proxy ERROR] ${nodeUrl}`, err.message);
        updateCuDisplay(false, 'Error', nodeCard, callback);
    });

    function markCuOffline() {
        updateCuDisplay(false, 'Offline', nodeCard, callback);
    }
}


function checkCuDirectHttps(nodeUrl, nodeCard, callback) {
    const startTime = performance.now();
    const controller = new AbortController();

    fetch(nodeUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
        credentials: 'omit'
    })
    .then(() => {
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(0);

        updateCuDisplay(true, responseTime, nodeCard, callback);
    })
    .catch(err => {
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(0);

        // Treat opaque failures (CORS) as online
        const isCorsRelated = [
            'Failed to fetch',
            'NotSameOrigin',
            'CORS'
        ].some(msg => err.message.includes(msg));

        updateCuDisplay(isCorsRelated, responseTime, nodeCard, callback);
    });
}


function updateCuDisplay(isOnline, responseTime, nodeCard, callback) {
    const statusIndicator = nodeCard.querySelector('.cu-status-container .status-indicator');
    const statusText = nodeCard.querySelector('.cu-status-container .status span:last-child');
    const responseTimeEl = nodeCard.querySelector('.cu-status-container .response-time');

    if (isOnline) {
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'Online';
        responseTimeEl.textContent = `Response time: ${responseTime}ms`;
        if (callback) callback(true);
    } else {
        statusIndicator.className = 'status-indicator unavailable';
        statusText.textContent = 'CU Unavailable';
        responseTimeEl.textContent = responseTime;
        if (callback) callback(false);
    }
}




function getMainnetNodesTotal() {
    return mainnetNodesTotal;
}

function getMainnetNodesOnline() {
    return mainnetNodesOnline;
}

function getCuNodesTotal() {
    return cuNodesTotal;
}

function getCuNodesOnline() {
    return cuNodesOnline;
}

// Export functions
export {
    initializeMainnetNodes,
    checkAllMainnetNodes,
    getMainnetNodesTotal,
    getMainnetNodesOnline,
    getCuNodesTotal,
    getCuNodesOnline,
    checkCuNodeStatus,
    checkHyperBeamNodeStatus,
    unwrapProxiedUrl
};