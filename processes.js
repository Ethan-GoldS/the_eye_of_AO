/**
 * Process definitions and query generation for Eye of AO dashboard
 */

// Define processes with their query parameters
export const PROCESSES = {
    runeRealm: {
        description: "Rune Realm Player Streaks",
        displayName: "Rune Realm Streaks",
        type: "hardcoded",
        hasMultiLineData: true
    },
    permaswap: {
        description: "Permaswap Order Notice Processes",
        protocol: "ao",
        action: "Order-Notice",
        spawnerProcess: "5G5_ftQT6f2OsmJ8EZ4-84eRcIMNEmUyH9aQSD85f9I",
        defaultAddresses: [
            "xZwIYa2DapmKmOpqOn9iMN0YQnYV4hgtwKadiKBpbt8",
            "SMKH5JnFE7c0MjsURMVRZn7kUerg1yMwcnVbWJJBEDU",
            "tnzfEWXA9CRxr9lBGZbZfVEZux44lZj3pqMJCK5cHgc",
            "dBbZhQoV4Lq9Bzbm0vlTrHmOZT7NchC_Dillbmqx0tM",
            "vJY-ed1Aoa0pGgQ30BcpO9ehGBu1PfNHUlwV9W8_n5A",
            "-9lYCEgMbASuQMr76ddhnaT3H996UFjMPc5jOs3kiAk",
            "qhMOXu9ANdOmOE38fHC3PnJuRsAQ6JzGFNq09oBSmpM",
            "7AOIMfTZVpX52-XYBDS7VHsXdqEYYsGdYND_MoEVEwg",
        ]
    },
    botega: {
        description: "Botega Order Confirmation Processes",
        protocol: "ao",
        action: "Order-Confirmation",
        spawnerProcess: "3XBGLrygs11K63F_7mldWz4veNx6Llg6hI2yZs8LKHo",
        defaultAddresses: []
    },
    wARTransfer: {
        description: "wAR Token Transfer",
        fromProcess: ["xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10"],
        action: "Credit-Notice",
        displayName: "wAR Transfers"
    },
    wARweeklyTransfer: {
        description: "wAR Weekly Token Transfer",
        fromProcess: ["xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10"],
        action: "Credit-Notice",
        displayName: "wAR Weekly Transfers"
    },
    wUSDCTransfer: {
        description: "wUSDC Token Transfer",
        fromProcess: ["7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ"],
        action: "Credit-Notice",
        displayName: "wUSDC Transfers"
    },
    USDATransfer: {
        description: "USDA Token Transfer",
        fromProcess: ["o2eqRo_mwJrvToPyeZf7igiJOJz-efODYq3m6ufb4HM"],
        action: "Credit-Notice",
        displayName: "USDA Transfers"
    },
    AOTransfer: {
        description: "AO Token Transfer",
        fromProcess: ["0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc"],
        action: "Credit-Notice",
        displayName: "AO Transfers"
    },
    wARTotalSupply: {
        description: "wAR Total Supply",
        wARProcess: "Bi6bSPz-IyOCX9ZNedmLzv7Z6yxsrj9nHE1TnZzm_ks",
        action: "SupplyHistory"
    },
    llamaLand: {
        description: "LlamaLand Login Info",
        fromProcess: ["2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k"],
        action: "Login-Info",
        message: "No Reward",
        displayName: "LlamaLand"
    }
};

// Cache for process addresses to avoid repeated fetching
const processAddressCache = new Map();

/**
 * Fetches process addresses from the network
 * @param {string} spawnerProcess - The spawner process ID
 * @param {Array} defaultAddresses - Default addresses to use if fetch fails
 * @returns {Promise<Array>} Array of process addresses
 */
async function fetchProcessAddresses(spawnerProcess, defaultAddresses = []) {
    // Check cache first
    const cacheKey = `process-addresses-${spawnerProcess}`;
    if (processAddressCache.has(cacheKey)) {
        return processAddressCache.get(cacheKey);
    }
    
    const buildQuery = (cursor) => `
        query {
            transactions(
                block: {min: 0}
                tags: [
                    { name: "From-Process", values: "${spawnerProcess}" }
                    { name: "Action", values: "Spawned" }
                ],
                first: 100,
                after: ${cursor ? `"${cursor}"` : null}
            ) {
                edges {
                    node {
                        id
                        tags {
                            name
                            value
                        }
                    }
                    cursor
                }
                pageInfo {
                    hasNextPage
                }
            }
        }
    `;

    try {
        const processAddresses = new Set();
        let hasNextPage = true;
        let cursor = null;
        let pageCount = 0;
        const MAX_PAGES = 10; // Limit pages to avoid excessive queries

        console.log(`Fetching process addresses for spawner ${spawnerProcess}...`);

        // Loop through pages until no more results or max pages reached
        while (hasNextPage && pageCount < MAX_PAGES) {
            pageCount++;
            
            const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: buildQuery(cursor) }),
            });

            if (!response.ok) {
                throw new Error(`Network error: ${response.status}`);
            }

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL errors:', result.errors);
                break;
            }

            const transactions = result.data.transactions;

            // Process current page
            transactions.edges.forEach((edge) => {
                if (!edge.node.tags) return;
                
                const processTags = edge.node.tags.filter((tag) => tag.name === "Process");
                processTags.forEach((processTag) => {
                    processAddresses.add(processTag.value);
                });
            });

            // Check if there's another page
            hasNextPage = transactions.pageInfo.hasNextPage;
            if (hasNextPage && transactions.edges.length > 0) {
                cursor = transactions.edges[transactions.edges.length - 1].cursor;
            } else {
                hasNextPage = false;
            }
        }

        // Add default addresses
        defaultAddresses.forEach((address) => processAddresses.add(address));
        
        const processList = Array.from(processAddresses);
        
        // Cache the result for future use
        processAddressCache.set(cacheKey, processList);
        
        console.log(`Found ${processList.length} processes for spawner ${spawnerProcess}`);
        return processList;
    } catch (error) {
        console.error(`Error fetching process addresses for ${spawnerProcess}:`, error);
        
        // Return default addresses on error
        console.log(`Using ${defaultAddresses.length} default addresses for ${spawnerProcess}`);
        processAddressCache.set(cacheKey, defaultAddresses);
        return defaultAddresses;
    }
}

/**
 * Generates a GraphQL query for a specific process and block range
 * @param {string} processType - The process type
 * @param {number} startHeight - The starting block height
 * @param {number} endHeight - The ending block height
 * @param {number} currentHeight - The current block height
 * @returns {Promise<string>} The generated GraphQL query
 */
export async function generateQuery(processType, startHeight, endHeight, currentHeight) {
    const process = PROCESSES[processType];
    
    if (!process) {
        throw new Error(`Unknown process type: ${processType}`);
    }

    // If endHeight is current block height, only use min for live data
    const blockRange = endHeight === currentHeight 
        ? `block: { min: ${startHeight} }`
        : `block: { min: ${startHeight}, max: ${endHeight} }`;

    // Hardcoded data for runeRealm
    if (process.type === "hardcoded") {
        return "hardcoded";
    }

    switch(processType) {
        case 'permaswap': {
            // Fetch addresses for Permaswap
            const addresses = await fetchProcessAddresses(
                process.spawnerProcess, 
                process.defaultAddresses
            );
            
            return `query {
                transactions (
                    ${blockRange}
                    tags: [
                        { name: "Data-Protocol", values: ["${process.protocol}"] }
                        { name: "Action", values: ["${process.action}"] }
                        { name: "From-Process", values: ${JSON.stringify(addresses)} }
                    ]
                ) {
                    count
                }
            }`;
        }
            
        case 'botega': {
            // Fetch addresses for Botega
            const addresses = await fetchProcessAddresses(
                process.spawnerProcess,
                process.defaultAddresses
            );
            
            return `query {
                transactions (
                    ${blockRange}
                    tags: [
                        { name: "Data-Protocol", values: ["${process.protocol}"] }
                        { name: "Action", values: ["${process.action}"] }
                        { name: "From-Process", values: ${JSON.stringify(addresses)} }
                    ]
                ) {
                    count
                }
            }`;
        }
            
        case 'wARTransfer':
        case 'wARweeklyTransfer':
        case 'wUSDCTransfer':
        case 'USDATransfer':
        case 'AOTransfer':
            return `query {
                transactions (
                    ${blockRange}
                    tags:[
                        { name:"Action", values: ["${process.action}"]},
                        { name: "From-Process", values: ${JSON.stringify(process.fromProcess)}},
                    ]
                ) {
                    count
                }
            }`;
            
        case 'llamaLand':
            return `query {
                transactions(
                    ${blockRange}
                    tags: [
                        { name: "From-Process", values: ${JSON.stringify(process.fromProcess)}}
                        { name: "Action", values: "${process.action}" },
                        { name: "Message", values: "${process.message}" },
                    ],
                    sort: HEIGHT_DESC
                ) {
                    count
                }
            }`;
            
        default:
            throw new Error(`Query template not found for process type: ${processType}`);
    }
}

/**
 * Gets the display name for a process
 * @param {string} processName - The process name
 * @returns {string} The display name for the process
 */
export function getProcessDisplayName(processName) {
    const process = PROCESSES[processName];
    return process?.displayName || processName;
}

/**
 * Clears the process address cache
 */
export function clearProcessAddressCache() {
    processAddressCache.clear();
}