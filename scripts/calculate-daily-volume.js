// scripts/calculate-daily-volume.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

// Constants
const DATA_FILE = path.join(__dirname, '../data/volume-stats.json');
const DEFAULT_DATA = {
  lastUpdated: new Date().toISOString(),
  blockHeights: [],
  volumeData: {
    wAR: [],
    AO: [],
    wUSDC: []
  }
};

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Function to wait until exactly X minutes past the hour
async function waitUntilExactTime(targetMinutesPastHour) {
  console.log(`Checking timing for scheduled run at ${targetMinutesPastHour} minutes past the hour...`);
  
  const now = new Date();
  const currentMinutes = now.getMinutes();
  
  // Run immediately if between target minute and 40 minutes past the hour
  if ((currentMinutes > targetMinutesPastHour) && (currentMinutes <= 40)) {
    console.log(`Started at ${currentMinutes} minutes past the hour, within buffer window. Running immediately.`);
    return; // Exit the function, allowing script to proceed
  }
  
  // Original waiting logic for times outside the buffer window
  console.log(`Outside buffer window, waiting for next ${targetMinutesPastHour} minutes past the hour...`);
  
  while (true) {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    // If we're at the target minute and 0-5 seconds into it
    if (currentMinutes === targetMinutesPastHour && currentSeconds < 5) {
      console.log(`✓ Target time reached: ${now.toISOString()}`);
      break;
    }
    
    // Calculate time remaining until target
    let minutesToWait;
    let secondsToWait;
    
    if (currentMinutes < targetMinutesPastHour) {
      // Target is later in this hour
      minutesToWait = targetMinutesPastHour - currentMinutes - 1;
      secondsToWait = (minutesToWait * 60) + (60 - currentSeconds);
    } else {
      // Target is in the next hour
      minutesToWait = 60 - currentMinutes + targetMinutesPastHour - 1;
      secondsToWait = (minutesToWait * 60) + (60 - currentSeconds);
    }
    
    // Choose appropriate wait interval
    const waitInterval = secondsToWait > 60 ? 30000 : 1000; // 30 sec or 1 sec
    
    console.log(`Waiting ${Math.ceil(secondsToWait)} more seconds until ${targetMinutesPastHour} minutes past the hour...`);
    
    // Wait for the interval
    await new Promise(resolve => setTimeout(resolve, waitInterval));
  }
}

// Function to get attribution date
function getAttributionDate() {
  const now = new Date();
  
  // If time is between 00:00-00:07 UTC, attribute to previous day
  if (now.getUTCHours() === 0 && now.getUTCMinutes() <= 7) {
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return yesterday;
  }
  
  // Otherwise use current date
  return now;
}

// Extract volume from PowerShell output
function extractVolumeFromOutput(output) {
  console.log("Raw script output sample: " + output.substring(0, 500) + "...");
  
  // Try to find "Final total: X" pattern
  const finalTotalMatch = output.match(/Final total: ([0-9,]+)/);
  if (finalTotalMatch && finalTotalMatch[1]) {
    const volume = parseFloat(finalTotalMatch[1].replace(/,/g, ''));
    console.log(`Found final total pattern: ${finalTotalMatch[1]} → ${volume}`);
    return volume;
  }

  // Look for last number in output as fallback
  const lines = output.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const numberMatch = line.match(/[0-9,]+(\.[0-9]+)?$/);
    if (numberMatch) {
      const volume = parseFloat(numberMatch[0].replace(/,/g, ''));
      console.log(`Found number at end of line: "${line}" → ${volume}`);
      return volume;
    }
  }
  
  console.warn("Could not extract volume from output.");
  return null;
}

// Find most recent entry before given date
function findPreviousEntry(entries, dateStr) {
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  return sortedEntries.find(entry => entry.date < dateStr);
}

// Main function
async function calculateDailyVolume() {
  console.log('Starting daily volume calculation process...');
  console.log('Current time (UTC):', new Date().toISOString());
  
  // IMPORTANT: Wait until exactly 2 minutes past the hour
  // This applies to both scheduled and manual runs
  await waitUntilExactTime(2);
  
  try {
    // 1. Load existing data or create default structure
    let volumeStats = DEFAULT_DATA;
    if (fs.existsSync(DATA_FILE)) {
      console.log(`Loading existing data from ${DATA_FILE}`);
      volumeStats = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } else {
      console.log(`No existing data file found at ${DATA_FILE}, creating new structure`);
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    
    // 2. Get current Arweave block height
    console.log('Fetching current Arweave block height...');
    const response = await fetch('https://arweave.net/info');
    const data = await response.json();
    const currentHeight = data.height;
    console.log(`Current Arweave block height: ${currentHeight}`);
    
    // 3. Determine the date to attribute this run to
    const attributionDate = getAttributionDate();
    const attributionDateStr = formatDate(attributionDate);
    console.log(`Attribution date: ${attributionDateStr} (UTC Hour: ${new Date().getUTCHours()}, UTC Minutes: ${new Date().getUTCMinutes()})`);
    
    // 4. Check if we already have an entry for this attribution date
    const existingEntryIndex = volumeStats.blockHeights.findIndex(entry => 
      entry.date === attributionDateStr
    );
    
    let startHeight;
    
    if (existingEntryIndex >= 0) {
      // Update existing entry for this attribution date
      console.log(`Updating existing entry for ${attributionDateStr}`);
      
      // Get the start height from the existing entry
      const existingVolumeEntries = Object.values(volumeStats.volumeData)
        .flatMap(entries => entries)
        .filter(entry => entry.date === attributionDateStr);
      
      if (existingVolumeEntries.length > 0) {
        startHeight = existingVolumeEntries[0].startHeight;
        console.log(`Using existing start height: ${startHeight}`);
      } else {
        // This shouldn't happen, but as a fallback find the most recent entry
        console.log("No volume entries found for this date, finding previous entry");
        const allEntries = Object.values(volumeStats.volumeData).flat();
        const prevEntry = findPreviousEntry(allEntries, attributionDateStr);
        
        if (prevEntry) {
          startHeight = prevEntry.endHeight;
          console.log(`Using previous entry end height as start: ${startHeight}`);
        } else {
          console.log("No previous entry found, using default starting point");
          startHeight = currentHeight - 800; // Approximate 1 day back
        }
      }
      
      // Update the end height for this entry
      volumeStats.blockHeights[existingEntryIndex].endHeight = currentHeight;
    } else {
      // Creating a new entry for this attribution date
      console.log(`Creating new entry for ${attributionDateStr}`);
      
      // Find the most recent entry to get start height
      const allEntries = Object.values(volumeStats.volumeData).flat();
      const prevEntry = findPreviousEntry(allEntries, attributionDateStr);
      
      if (prevEntry) {
        startHeight = prevEntry.endHeight;
        console.log(`Found previous entry from ${prevEntry.date} with end height: ${startHeight}`);
      } else {
        console.log("No previous entry found, using default starting point");
        startHeight = currentHeight - 800; // Approximate 1 day back
      }
      
      // Add new block height entry
      volumeStats.blockHeights.push({
        date: attributionDateStr,
        endHeight: currentHeight
      });
    }
    
    // Skip processing if start and end heights are the same
    if (startHeight === currentHeight) {
      console.log(`Start height equals end height (${startHeight}). No blocks to process. Skipping scripts.`);
      
      // Still update lastUpdated timestamp
      volumeStats.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(volumeStats, null, 2));
      
      console.log('Updated lastUpdated timestamp and saved file.');
      return;
    }
    
    console.log(`FINAL HEIGHT VALUES - Start: ${startHeight}, End: ${currentHeight}`);
    
    // 5. Run each PowerShell script with the appropriate heights
    const scripts = ['wAR.ps1', 'AO.ps1', 'wUSDC.ps1'];
    
    for (const script of scripts) {
      console.log(`------------------------------------------------------------`);
      console.log(`Running ${script} with heights: ${startHeight} -> ${currentHeight}`);
      
      try {
        // Construct the command with proper path resolution
        const scriptPath = path.resolve(__dirname, script);
        console.log(`Full script path: ${scriptPath}`);
        
        if (!fs.existsSync(scriptPath)) {
          throw new Error(`Script ${scriptPath} does not exist!`);
        }
        
        const command = `powershell -Command "& '${scriptPath}' ${startHeight} ${currentHeight}"`;
        console.log(`Executing: ${command}`);
        console.log(`Waiting for script execution...`);
        
        const startTime = Date.now();
        // Increase timeout to 10 minutes
        const result = execSync(command, { 
          encoding: 'utf8',
          timeout: 600000, // 10 minute timeout
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        const executionTime = (Date.now() - startTime) / 1000;
        console.log(`Script execution completed in ${executionTime.toFixed(2)} seconds`);
        
        // Extract volume from output properly
        const volume = extractVolumeFromOutput(result);
        
        // Determine which token this is for the data structure
        const tokenKey = script.replace('.ps1', '');
        
        // Update or add volume data entry
        const volumeEntryIndex = volumeStats.volumeData[tokenKey].findIndex(entry => 
          entry.date === attributionDateStr
        );
        
        if (volumeEntryIndex >= 0) {
          console.log(`Updating existing ${tokenKey} volume entry for ${attributionDateStr}`);
          volumeStats.volumeData[tokenKey][volumeEntryIndex] = {
            date: attributionDateStr,
            startHeight: startHeight,
            endHeight: currentHeight,
            volume: volume
          };
        } else {
          console.log(`Adding new ${tokenKey} volume entry for ${attributionDateStr}`);
          volumeStats.volumeData[tokenKey].push({
            date: attributionDateStr,
            startHeight: startHeight,
            endHeight: currentHeight,
            volume: volume
          });
        }
        
        console.log(`Successfully processed ${script}: Volume = ${volume}`);
      } catch (scriptError) {
        console.error(`Error running ${script}:`, scriptError);
        
        // Add placeholder with error flag if needed
        const tokenKey = script.replace('.ps1', '');
        const volumeEntryIndex = volumeStats.volumeData[tokenKey].findIndex(entry => 
          entry.date === attributionDateStr
        );
        
        if (volumeEntryIndex < 0) {
          // Only add error entry if no entry exists for this attribution date
          volumeStats.volumeData[tokenKey].push({
            date: attributionDateStr,
            startHeight: startHeight,
            endHeight: currentHeight,
            volume: null,
            error: true
          });
        }
      }
    }
    
    // 6. Update lastUpdated timestamp
    volumeStats.lastUpdated = new Date().toISOString();
    
    // 7. Write updated data back to file
    console.log('Writing updated data to file...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(volumeStats, null, 2));
    console.log('Volume calculation complete and saved to data/volume-stats.json');
    
  } catch (error) {
    console.error('Error in volume calculation process:', error);
    process.exit(1);
  }
}

// Run the process
calculateDailyVolume();
