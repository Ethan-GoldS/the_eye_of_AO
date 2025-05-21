// Import functions from mainnet-nodes.js
import { checkHyperBeamNodeStatus, checkCuNodeStatus, unwrapProxiedUrl } from '../mainnet-nodes.js';

// Variables to export
let customNodes = [];
let customNodesCuRelationship = {};
let customNodesProtocol = {}; // Store protocol information (http/https)

// Configuration - match mainnet config
const config = {
    checkTimeout: 10000, // Timeout for each check (ms)
    busyTimeout: 2000    // Time to mark as busy (ms)
};

function saveCustomNodes() {
    localStorage.setItem('hyperbeamTrackerCustomNodes', JSON.stringify(customNodes));
    localStorage.setItem('hyperbeamTrackerNodeProtocols', JSON.stringify(customNodesProtocol));
}

// Add this to your initialization code
function initializeProtocolToggles() {
    // HB Node protocol toggle
    document.getElementById('hbHttpsToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('hbHttpToggle').classList.remove('selected');
    });
    
    document.getElementById('hbHttpToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('hbHttpsToggle').classList.remove('selected');
    });
    
    // CU Node protocol toggle
    document.getElementById('cuHttpsToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('cuHttpToggle').classList.remove('selected');
    });
    
    document.getElementById('cuHttpToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('cuHttpsToggle').classList.remove('selected');
    });
}

// Call this in your document ready function
document.addEventListener('DOMContentLoaded', function() {
    initializeProtocolToggles();
    // Rest of your initialization code...
});

// Function to add the toggle UI to the page
function addProtocolToggles() {
    // Get the container elements
    const nodeInputGroup = document.querySelector('.node-input-group');
    if (!nodeInputGroup) {
        console.error("Node input group not found");
        return;
    }
    
    // Create toggle containers
    const hbToggleContainer = document.createElement('div');
    hbToggleContainer.className = 'protocol-toggle-container';
    hbToggleContainer.innerHTML = `
        <span>HB Protocol:</span>
        <div class="toggle-buttons">
            <button class="toggle-button selected" id="hbHttpsToggle">HTTPS</button>
            <button class="toggle-button" id="hbHttpToggle">HTTP</button>
        </div>
    `;
    
    const cuToggleContainer = document.createElement('div');
    cuToggleContainer.className = 'protocol-toggle-container';
    cuToggleContainer.innerHTML = `
        <span>CU Protocol:</span>
        <div class="toggle-buttons">
            <button class="toggle-button selected" id="cuHttpsToggle">HTTPS</button>
            <button class="toggle-button" id="cuHttpToggle">HTTP</button>
        </div>
    `;
    
    // Insert the toggles after the input fields
    // First add a container for better layout
    const togglesContainer = document.createElement('div');
    togglesContainer.className = 'protocol-toggles-row';
    togglesContainer.appendChild(hbToggleContainer);
    togglesContainer.appendChild(cuToggleContainer);
    
    // Insert after the input group
    nodeInputGroup.after(togglesContainer);
    
    // Add click handlers
    document.getElementById('hbHttpsToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('hbHttpToggle').classList.remove('selected');
    });
    
    document.getElementById('hbHttpToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('hbHttpsToggle').classList.remove('selected');
    });
    
    document.getElementById('cuHttpsToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('cuHttpToggle').classList.remove('selected');
    });
    
    document.getElementById('cuHttpToggle').addEventListener('click', function() {
        this.classList.add('selected');
        document.getElementById('cuHttpsToggle').classList.remove('selected');
    });
}

function addCustomNode(additionalNodeInput, customStatusContainer) {
    const nodeInput = additionalNodeInput.value.trim();
    const cuInput = document.getElementById('additionalCuNode')?.value.trim();
    if (!nodeInput) return;

    // Get protocol from toggles
    const useHttpsForHB = document.getElementById('hbHttpsToggle').classList.contains('selected');
    const useHttpsForCU = document.getElementById('cuHttpsToggle').classList.contains('selected');

    // Format URLs with the correct protocol
    const hbProtocol = useHttpsForHB ? 'https://' : 'http://';
    const cuProtocol = useHttpsForCU ? 'https://' : 'http://';
    
    // Clean the input to remove any existing protocol
    const cleanNodeInput = nodeInput.replace(/^https?:\/\//, '');
    const cleanCuInput = cuInput ? cuInput.replace(/^https?:\/\//, '') : '';
    
    // Format the URLs with the selected protocol
    let nodeUrl = hbProtocol + cleanNodeInput;
    if (!nodeUrl.endsWith('/')) nodeUrl += '/';

    let cuUrl = "--";
    if (cleanCuInput) {
        cuUrl = cuProtocol + cleanCuInput;
        if (!cuUrl.endsWith('/')) cuUrl += '/';
    }

    // Check if this node already exists
    if (!customNodes.includes(nodeUrl)) {
        customNodes.push(nodeUrl);
        
        // Save protocol information to localStorage
        const savedProtocols = JSON.parse(localStorage.getItem('hyperbeamTrackerNodeProtocols')) || {};
        savedProtocols[nodeUrl] = { 
            protocol: useHttpsForHB ? 'https' : 'http',
            cuProtocol: useHttpsForCU ? 'https' : 'http'
        };
        
        // Save CU relationship
        const savedCuMap = JSON.parse(localStorage.getItem('hyperbeamTrackerCuRelationship')) || {};
        savedCuMap[nodeUrl] = cuUrl;
        customNodesCuRelationship = savedCuMap;
        
        // Save everything to localStorage
        localStorage.setItem('hyperbeamTrackerCustomNodes', JSON.stringify(customNodes));
        localStorage.setItem('hyperbeamTrackerNodeProtocols', JSON.stringify(savedProtocols));
        localStorage.setItem('hyperbeamTrackerCuRelationship', JSON.stringify(savedCuMap));

        // Store protocol info in memory
        customNodesProtocol = savedProtocols;

        // Create card UI
        const nodeCard = document.createElement('div');
        const nodeId = `custom-${nodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
        const nodeName = nodeUrl.replace(/^https?:\/\//, '');
        const cuName = cuUrl === "--" ? "--" : cuUrl.replace(/^https?:\/\//, '');

        nodeCard.id = nodeId;
        nodeCard.className = 'node-card';
        nodeCard.innerHTML = `
            <div class="node-name">${nodeName} <span class="hb-protocol-tag protocol-tag"></span></div>
            <div class="status">
                <span class="status-indicator loading"></span>
                <span>Checking...</span>
            </div>
            <div class="response-time">-</div>
            <div class="cu-status-container">
                <div class="cu-label">CU: ${cuName} <span class="cu-protocol-tag protocol-tag"></span></div>
                <div class="status">
                    <span class="status-indicator ${cuUrl === "--" ? "unavailable" : "loading"}"></span>
                    <span>${cuUrl === "--" ? "Not Available" : "Checking CU..."}</span>
                </div>
                <div class="response-time">${cuUrl === "--" ? "-" : "-"}</div>
            </div>
            <div class="node-actions">
                <a href="${nodeUrl}" target="_blank" title="Visit Node">
                    <i class="fas fa-external-link-alt"></i>
                </a>
                <a href="${nodeUrl}~meta@1.0/info" target="_blank" title="View Metadata">
                    <i class="fas fa-info-circle"></i>
                </a>
                ${cuUrl !== "--" ? `
                <a href="${cuUrl}" target="_blank" title="Visit CU Node">
                    <i class="fas fa-server"></i>
                </a>` : ""}
            </div>
        `;

        // Update the protocol tags
        const hbProtoTag = nodeCard.querySelector('.hb-protocol-tag');
        hbProtoTag.textContent = useHttpsForHB ? 'HTTPS' : 'HTTP';
        hbProtoTag.classList.add(useHttpsForHB ? 'https' : 'http');

        if (cuUrl !== "--") {
            const cuProtoTag = nodeCard.querySelector('.cu-protocol-tag');
            cuProtoTag.textContent = useHttpsForCU ? 'HTTPS' : 'HTTP';
            cuProtoTag.classList.add(useHttpsForCU ? 'https' : 'http');
        }

        customStatusContainer.insertBefore(nodeCard, customStatusContainer.firstChild);
        
        // Check nodes based on protocol
        checkCustomNodeStatus(nodeUrl, useHttpsForHB, nodeCard, () => {
            if (cuUrl !== "--") {
                checkCustomCuNodeStatus(cuUrl, useHttpsForCU, nodeCard);
            }
        });
        
        // Clear inputs
        additionalNodeInput.value = '';
        document.getElementById('additionalCuNode').value = '';
    }
}

function checkCustomNodeStatus(nodeUrl, isHttps, nodeCard, callback) {
    // For HTTP nodes, use the proxy
    let urlToCheck = nodeUrl;
    
    if (!isHttps) {
        // HTTP node needs proxy
        urlToCheck = `https://node-checker.ravensnestx16r.workers.dev/?url=${nodeUrl}`;
    }
    
    checkHyperBeamNodeStatus(urlToCheck, nodeCard, (isOnline) => {
        if (callback) callback(isOnline);
    });
}

function checkCustomCuNodeStatus(cuUrl, isHttps, nodeCard, callback) {
    // For HTTP nodes, use the proxy
    let urlToCheck = cuUrl;
    
    if (!isHttps) {
        // HTTP node needs proxy
        urlToCheck = `https://node-checker.ravensnestx16r.workers.dev/?url=${cuUrl}`;
    }
    
    checkCuNodeStatus(urlToCheck, nodeCard, (isOnline) => {
        if (callback) callback(isOnline);
    });
}

function removeCustomNode(additionalNodeInput) {
    const nodeInput = additionalNodeInput.value.trim();
    if (!nodeInput) return;
    
    // Get current protocol selection from toggle
    const useHttps = document.getElementById('hbHttpsToggle').classList.contains('selected');
    const protocol = useHttps ? 'https://' : 'http://';
    
    // Clean input and format URL consistently
    const cleanNodeInput = nodeInput.replace(/^https?:\/\//, '');
    let nodeUrl = protocol + cleanNodeInput;
    if (!nodeUrl.endsWith('/')) {
        nodeUrl = nodeUrl + '/';
    }
    
    // Find the node by URL
    const nodeIndex = customNodes.indexOf(nodeUrl);
    
    // If node not found with selected protocol, try the other protocol
    if (nodeIndex === -1) {
        const altProtocol = useHttps ? 'http://' : 'https://';
        const altNodeUrl = altProtocol + cleanNodeInput;
        if (!altNodeUrl.endsWith('/')) {
            nodeUrl = altNodeUrl + '/';
        } else {
            nodeUrl = altNodeUrl;
        }
        
        // Check with alternative protocol
        const altNodeIndex = customNodes.indexOf(nodeUrl);
        if (altNodeIndex === -1) {
            alert(`Node "${nodeInput}" was not found in your custom nodes list.`);
            return;
        }
    }
    
    // Remove from array and storage
    customNodes = customNodes.filter(node => node !== nodeUrl);
    
    // Save updated list
    saveCustomNodes();
    
    // Also remove from CU relationships and protocols if exists
    if (customNodesCuRelationship[nodeUrl]) {
        delete customNodesCuRelationship[nodeUrl];
        localStorage.setItem('hyperbeamTrackerCuRelationship', JSON.stringify(customNodesCuRelationship));
    }
    
    if (customNodesProtocol[nodeUrl]) {
        delete customNodesProtocol[nodeUrl];
        localStorage.setItem('hyperbeamTrackerNodeProtocols', JSON.stringify(customNodesProtocol));
    }
    
    // Get the node ID
    const nodeId = `custom-${nodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
    const nodeElement = document.getElementById(nodeId);
    
    // If we found the element, remove it
    if (nodeElement) {
        nodeElement.parentNode.removeChild(nodeElement);
        additionalNodeInput.value = '';
        console.log(`Node "${nodeInput}" has been removed.`);
    } else {
        console.error(`Element for node "${nodeInput}" not found in the DOM.`);
    }
    
    additionalNodeInput.value = '';
}


function loadCustomNodes() {
    const savedNodes = localStorage.getItem('hyperbeamTrackerCustomNodes');
    const savedProtocols = localStorage.getItem('hyperbeamTrackerNodeProtocols');
    const savedCuMap = localStorage.getItem('hyperbeamTrackerCuRelationship');
    
    if (savedNodes) {
        customNodes = JSON.parse(savedNodes);
    }
    
    if (savedProtocols) {
        customNodesProtocol = JSON.parse(savedProtocols);
    } else {
        // Initialize if missing
        customNodesProtocol = {};
    }
    
    if (savedCuMap) {
        customNodesCuRelationship = JSON.parse(savedCuMap);
    }

    // Set toggle buttons based on last node's protocol settings
    const lastNodeUrl = customNodes[customNodes.length - 1];
    if (lastNodeUrl && customNodesProtocol[lastNodeUrl]) {
        const { protocol, cuProtocol } = customNodesProtocol[lastNodeUrl];
        
        // Only update toggles if they exist
        const hbHttpsToggle = document.getElementById('hbHttpsToggle');
        const hbHttpToggle = document.getElementById('hbHttpToggle');
        const cuHttpsToggle = document.getElementById('cuHttpsToggle');
        const cuHttpToggle = document.getElementById('cuHttpToggle');

        // HB protocol toggle
        if (hbHttpsToggle && hbHttpToggle) {
            if (protocol === 'https') {
                hbHttpsToggle.classList.add('selected');
                hbHttpToggle.classList.remove('selected');
            } else {
                hbHttpToggle.classList.add('selected');
                hbHttpsToggle.classList.remove('selected');
            }
        }

        // CU protocol toggle
        if (cuHttpsToggle && cuHttpToggle) {
            if (cuProtocol === 'https') {
                cuHttpsToggle.classList.add('selected');
                cuHttpToggle.classList.remove('selected');
            } else {
                cuHttpToggle.classList.add('selected');
                cuHttpsToggle.classList.remove('selected');
            }
        }
    }
    
    return customNodes;
}

// Function to check all saved custom nodes
function checkAllCustomNodes(customStatusContainer) {
    if (!customStatusContainer) {
        console.warn("Custom status container not found. Cannot check custom nodes.");
        return;
    }
    
    // Clear the container
    customStatusContainer.innerHTML = '';
    
    // Update last checked time
    updateLastCheckedTime();
    
    // Load saved nodes and their relationships directly from localStorage
    const savedNodes = JSON.parse(localStorage.getItem('hyperbeamTrackerCustomNodes')) || [];
    const savedCuMap = JSON.parse(localStorage.getItem('hyperbeamTrackerCuRelationship')) || {};
    const savedProtocols = JSON.parse(localStorage.getItem('hyperbeamTrackerNodeProtocols')) || {};
    
    console.log(`Checking ${savedNodes.length} custom nodes...`);
    console.log('Protocol info:', savedProtocols); // Debug log to see what's actually in storage
    
    savedNodes.forEach(nodeUrl => {
        const cuUrl = savedCuMap[nodeUrl] || "--";
        
        // Get protocol info (with fallback)
        const nodeProtocolInfo = savedProtocols[nodeUrl] || { protocol: 'https', cuProtocol: 'https' };
        console.log(`Node ${nodeUrl} protocol info:`, nodeProtocolInfo); // Debug logging
        
        // Remove both protocol prefix and trailing slash from display names
        const nodeName = nodeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const cuName = cuUrl === "--" ? "--" : cuUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        // Create node card
        const nodeCard = document.createElement('div');
        const nodeId = `custom-${nodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
        
        // Add protocol indicators
        const hbProtocolIndicator = nodeProtocolInfo.protocol === 'https' 
            ? '<span class="protocol-tag https">HTTPS</span>' 
            : '<span class="protocol-tag http">HTTP</span>';
        
        const cuProtocolIndicator = cuUrl !== "--" 
            ? (nodeProtocolInfo.cuProtocol === 'https' 
               ? '<span class="protocol-tag https">HTTPS</span>' 
               : '<span class="protocol-tag http">HTTP</span>') 
            : '';
        
        nodeCard.id = nodeId;
        nodeCard.className = 'node-card';
        nodeCard.innerHTML = `
            <div class="node-name">${nodeName} <span class="hb-protocol-tag protocol-tag"></span></div>
            <div class="status">
                <span class="status-indicator loading"></span>
                <span>Checking...</span>
            </div>
            <div class="response-time">-</div>
            <div class="cu-status-container">
                <div class="cu-label">CU: ${cuName} <span class="cu-protocol-tag protocol-tag"></span></div>
                <div class="status">
                    <span class="status-indicator ${cuUrl === "--" ? "unavailable" : "loading"}"></span>
                    <span>${cuUrl === "--" ? "Not Available" : "Checking CU..."}</span>
                </div>
                <div class="response-time">${cuUrl === "--" ? "-" : "-"}</div>
            </div>
            <div class="node-actions">
                <a href="${nodeUrl}" target="_blank" title="Visit Node">
                    <i class="fas fa-external-link-alt"></i>
                </a>
                <a href="${nodeUrl}~meta@1.0/info" target="_blank" title="View Metadata">
                    <i class="fas fa-info-circle"></i>
                </a>
                ${cuUrl !== "--" ? `
                <a href="${cuUrl}" target="_blank" title="Visit CU Node">
                    <i class="fas fa-server"></i>
                </a>` : ""}
            </div>
        `;

        const hbProtoTag = nodeCard.querySelector('.hb-protocol-tag');
        hbProtoTag.textContent = nodeProtocolInfo.protocol.toUpperCase();
        hbProtoTag.classList.add(nodeProtocolInfo.protocol); // 'http' or 'https'

        if (cuUrl !== "--") {
            const cuProtoTag = nodeCard.querySelector('.cu-protocol-tag');
            cuProtoTag.textContent = nodeProtocolInfo.cuProtocol.toUpperCase();
            cuProtoTag.classList.add(nodeProtocolInfo.cuProtocol);
        }
        
        customStatusContainer.appendChild(nodeCard);
        
        // Check node status based on protocol
        const isHttps = nodeProtocolInfo.protocol === 'https';
        const isCuHttps = nodeProtocolInfo.cuProtocol === 'https';
        
        // Use the appropriate proxy based on protocol
        let urlToCheck = nodeUrl;
        if (!isHttps) {
            urlToCheck = `https://node-checker.ravensnestx16r.workers.dev/?url=${nodeUrl}`;
        }
        
        checkHyperBeamNodeStatus(urlToCheck, nodeCard, (isOnline) => {
            if (cuUrl !== "--") {
                let cuUrlToCheck = cuUrl;
                if (!isCuHttps) {
                    cuUrlToCheck = `https://node-checker.ravensnestx16r.workers.dev/?url=${cuUrl}`;
                }
                checkCuNodeStatus(cuUrlToCheck, nodeCard, (isCuOnline) => {
                    // Additional logic after both checks complete if needed
                });
            }
        });
    });
}

// Function to load and display saved nodes in the custom section
function loadAndDisplayCustomNodes(customStatusContainer) {
    const savedNodes = loadCustomNodes();
    
    // Display any saved custom nodes in the custom section
    if (savedNodes && savedNodes.length > 0 && customStatusContainer) {
        // Clear the container first to avoid duplicates
        customStatusContainer.innerHTML = '';
        
        // Load protocols data
        const protocolsMap = JSON.parse(localStorage.getItem('hyperbeamTrackerNodeProtocols')) || {};
        
        savedNodes.forEach(nodeUrl => {
            if (!nodeUrl) return;
        
            const cuMap = JSON.parse(localStorage.getItem('hyperbeamTrackerCuRelationship')) || {};
            const cuUrl = cuMap[nodeUrl] || "--";
            
            // Get protocol info (with fallback)
            const nodeProtocolInfo = protocolsMap[nodeUrl] || { 
                protocol: nodeUrl.startsWith('https://') ? 'https' : 'http',
                cuProtocol: 'https'
            };
            
            console.log(`Loading node ${nodeUrl} with protocol:`, nodeProtocolInfo);
        
            const nodeId = `custom-${nodeUrl.replace(/^https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
            let nodeName = nodeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
            let cuName = cuUrl === "--" ? "--" : cuUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
            
            // Create protocol tag HTML using existing CSS classes
            const hbProtocolHtml = `<span class="protocol-tag ${nodeProtocolInfo.protocol}">${nodeProtocolInfo.protocol.toUpperCase()}</span>`;
            
            let cuProtocolHtml = '';
            if (cuUrl !== "--") {
                cuProtocolHtml = `<span class="protocol-tag ${nodeProtocolInfo.cuProtocol}">${nodeProtocolInfo.cuProtocol.toUpperCase()}</span>`;
            }
        
            const nodeCard = document.createElement('div');
            nodeCard.id = nodeId;
            nodeCard.className = 'node-card';
            nodeCard.innerHTML = `
                <div class="node-name">${nodeName} ${hbProtocolHtml}</div>
                <div class="status">
                    <span class="status-indicator loading"></span>
                    <span>Checking...</span>
                </div>
                <div class="response-time">-</div>
                <div class="cu-status-container">
                    <div class="cu-label">CU: ${cuName} ${cuProtocolHtml}</div>
                    <div class="status">
                        <span class="status-indicator ${cuUrl === "--" ? "unavailable" : "loading"}"></span>
                        <span>${cuUrl === "--" ? "Not Available" : "Checking CU..."}</span>
                    </div>
                    <div class="response-time">${cuUrl === "--" ? "-" : "-"}</div>
                </div>
                <div class="node-actions">
                    <a href="${nodeUrl}" target="_blank" title="Visit Node">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                    <a href="${nodeUrl}~meta@1.0/info" target="_blank" title="View Metadata">
                        <i class="fas fa-info-circle"></i>
                    </a>
                    ${cuUrl !== "--" ? `
                    <a href="${cuUrl}" target="_blank" title="Visit CU Node">
                        <i class="fas fa-server"></i>
                    </a>` : ''}
                </div>
            `;
        
            customStatusContainer.appendChild(nodeCard);
            
            // Check with proper protocol handling
            const isHttps = nodeProtocolInfo.protocol === 'https';
            const isCuHttps = nodeProtocolInfo.cuProtocol === 'https';
            
            let urlToCheck = nodeUrl;
            if (!isHttps) {
                urlToCheck = `https://node-checker.ravensnestx16r.workers.dev/?url=${nodeUrl}`;
                console.log(`Using proxy for HTTP node: ${urlToCheck}`);
            }
            
            checkHyperBeamNodeStatus(urlToCheck, nodeCard, () => {
                if (cuUrl !== "--") {
                    let cuUrlToCheck = cuUrl;
                    if (!isCuHttps) {
                        cuUrlToCheck = `https://node-checker.ravensnestx16r.workers.dev/?url=${cuUrl}`;
                        console.log(`Using proxy for HTTP CU node: ${cuUrlToCheck}`);
                    }
                    checkCuNodeStatus(cuUrlToCheck, nodeCard);
                }
            });
        });
    }
    
    return savedNodes;
}

function updateLastCheckedTime() {
    const customLastUpdatedEl = document.getElementById('customLastUpdated');
    if (customLastUpdatedEl) {
        const now = new Date();
        customLastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

// Export functions
export {
    addCustomNode,
    removeCustomNode,
    loadCustomNodes,
    checkAllCustomNodes,
    addProtocolToggles,
    customNodes,
    loadAndDisplayCustomNodes
};