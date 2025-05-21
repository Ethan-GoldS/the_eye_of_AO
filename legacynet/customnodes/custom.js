


// A separate function to check custom nodes
function checkCustomNode(nodeUrl, nodeCard) {
    // Set to loading state
    const statusIndicator = nodeCard.querySelector('.status-indicator');
    const statusText = nodeCard.querySelector('.status span:last-child');
    const responseTimeEl = nodeCard.querySelector('.response-time');
    
    statusIndicator.className = 'status-indicator loading';
    statusText.textContent = 'Checking...';
    
    // Check the node status
    const startTime = performance.now();
    
    // Define timeouts to match the main page
    const busyTimeout = 2000;    // 2 seconds - mark as busy
    const offlineTimeout = 15000; // 15 seconds - mark as unavailable
    
    // Create an AbortController to handle the final timeout
    const controller = new AbortController();
    
    // Setup the busy timeout - if node doesn't respond in 2 seconds, mark as busy
    const busyTimeoutId = setTimeout(() => {
        statusIndicator.className = 'status-indicator busy';
        statusText.textContent = 'Busy';
        responseTimeEl.textContent = 'Slow response...';
    }, busyTimeout);
    
    // Setup the unavailable timeout - if node doesn't respond in 15 seconds, mark as unavailable
    const offlineTimeoutId = setTimeout(() => {
        controller.abort();
        statusIndicator.className = 'status-indicator unavailable';
        statusText.textContent = 'Unavailable';
        responseTimeEl.textContent = 'Timeout';
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
        if (parseInt(responseTime) > busyTimeout) {
            statusIndicator.className = 'status-indicator busy';
            statusText.textContent = 'Busy';
        } else {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Online';
        }
        
        responseTimeEl.textContent = `Response time: ${responseTime}ms`;
    })
    .catch(error => {
        // Clear both timeouts
        clearTimeout(busyTimeoutId);
        clearTimeout(offlineTimeoutId);
        
        // If it's an abort error, we've already handled it with the timeout
        if (error.name === 'AbortError') {
            return;
        }
        
        statusIndicator.className = 'status-indicator unavailable';
        statusText.textContent = 'Unavailable';
        responseTimeEl.textContent = 'Timeout';
    });
}

// Variables to export
let customNodes = [];

function saveCustomNodes() {
    localStorage.setItem('aoTrackerCustomNodes', JSON.stringify(customNodes));
}

function addCustomNode(additionalNodeInput, customStatusContainer, checkNode) {
    const nodeInput = additionalNodeInput.value.trim();
    if (!nodeInput) return;
    
    // Format the node URL - use input as is with protocol added if needed
    let nodeUrl;
    if (nodeInput.startsWith('http')) {
        // Full URL provided
        nodeUrl = nodeInput;
    } else {
        // Add the protocol but no suffix
        nodeUrl = `https://${nodeInput}`;
    }
    
    if (!customNodes.includes(nodeUrl)) {
        // Add to custom nodes array
        customNodes.push(nodeUrl);
        saveCustomNodes();
        
        // Create and insert the node card
        const nodeCard = document.createElement('div');
        const nodeId = `custom-${nodeUrl.replace(/https?:\/\//, '').replace(/\./g, '-').replace(/\//g, '')}`;
        
        // Use the original input name instead of extracting from URL
        const nodeName = nodeUrl.replace(/^https?:\/\//, '');
        
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
        
        // Insert at the beginning of the container
        if (customStatusContainer.firstChild) {
            customStatusContainer.insertBefore(nodeCard, customStatusContainer.firstChild);
        } else {
            customStatusContainer.appendChild(nodeCard);
        }
        
        // Check the node with our custom check function
        checkCustomNode(nodeUrl, nodeCard);
        additionalNodeInput.value = '';
    }
}

function removeCustomNode(additionalNodeInput) {
    const nodeInput = additionalNodeInput.value.trim();
    if (!nodeInput) return;
    
    // Format the node URL the same way as in addCustomNode
    let nodeUrl;
    if (nodeInput.startsWith('http')) {
        nodeUrl = nodeInput;
    } else {
        nodeUrl = `https://${nodeInput}`;
    }
    
    // Find the node in the customNodes array
    const nodeIndex = customNodes.indexOf(nodeUrl);
    
    if (nodeIndex !== -1) {
        // Remove from array
        customNodes.splice(nodeIndex, 1);
        
        // Save updated list
        saveCustomNodes();
        
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
        console.log(`Node "${nodeInput}" has been removed from your list.`);
    } else {
        alert(`Node "${nodeInput}" was not found in your custom nodes list.`);
    }
}

// Function to load saved nodes
function loadCustomNodes() {
    const savedNodes = localStorage.getItem('aoTrackerCustomNodes');
    if (savedNodes) {
        customNodes = JSON.parse(savedNodes);
    }
    return customNodes;
}

// Export the functions and variables
export {
    addCustomNode,
    removeCustomNode,
    saveCustomNodes,
    loadCustomNodes,
    checkCustomNode,
    customNodes
};