-- Enhanced Lua Script to Track wAR Total Supply Daily
local json = require('json')
local sqlite = require('lsqlite3')

-- Initialize SQLite database
Db = Db or sqlite.open_memory()
dbAdmin = require('@rakis/DbAdmin').new(Db)

-- Constants
MAX_RECENT_TIMESTAMPS = 3
MAX_HISTORY_RECORDS = 1000
QAR_CONTRACT = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8"

-- Initialize tables if they don't exist
Db:exec([[CREATE TABLE IF NOT EXISTS RecentTimestamps (
    timestamp INTEGER, 
    totalSupply TEXT
);]])

Db:exec([[CREATE TABLE IF NOT EXISTS DailySupply (
    date TEXT, 
    timestamp INTEGER, 
    totalSupply TEXT
);]])

-- Function to clear all historical entries
function clearTables()
    dbAdmin:apply([[DELETE FROM DailySupply;]], {})
    print("All historical entries cleared from tables")
end

-- Function to insert historical supply data
function insertHistoricalSupply(totalSupply, timestamp)
    local dateStr = os.date("!%Y-%m-%d", timestamp / 1000)
    
    -- First add to RecentTimestamps
    dbAdmin:apply([[
        INSERT INTO RecentTimestamps (timestamp, totalSupply)
        VALUES (?, ?);
    ]], {timestamp, totalSupply})
    
    -- Keep only last 3 timestamps
    dbAdmin:apply([[DELETE FROM RecentTimestamps WHERE timestamp NOT IN (
        SELECT timestamp FROM RecentTimestamps 
        ORDER BY timestamp DESC LIMIT ?);]], {MAX_RECENT_TIMESTAMPS})
    
    -- Then add to DailySupply if date doesn't exist
    local existingEntry = dbAdmin:select(
        [[SELECT date FROM DailySupply WHERE date = ? LIMIT 1;]],
        {dateStr}
    )
    
    if #existingEntry == 0 then
        dbAdmin:apply([[
            INSERT INTO DailySupply (date, timestamp, totalSupply)
            VALUES (?, ?, ?);
        ]], {dateStr, timestamp, totalSupply})
        print(string.format("Inserted historical supply %s for date %s", totalSupply, dateStr))
    else
        print(string.format("Date %s already exists in DailySupply. Skipping insertion.", dateStr))
    end
end

-- Function to print current supply data
function printSupplyData()
    local dailySupply = dbAdmin:select([[
        SELECT * FROM DailySupply 
        ORDER BY timestamp DESC;
    ]], {})
    
    local recentTimestamps = dbAdmin:select([[
        SELECT * FROM RecentTimestamps 
        ORDER BY timestamp DESC;
    ]], {})
    
    print("Recent Timestamps:")
    print(json.encode(recentTimestamps))
    print("\nDaily Supply History:")
    print(json.encode(dailySupply))
end

-- Handler for Info requests
Handlers.add('info',
    function(m) return m.Action == "SupplyHistory" end,
    function(msg)
        local dailySupply = dbAdmin:select([[
            SELECT * FROM DailySupply 
            ORDER BY timestamp DESC;
        ]], {})
        
        Send({
            Target = msg.From,
            DailySupply = json.encode(dailySupply)
        })
    end
)

-- Handler for responses from wAR contract
Handlers.add('supply',
    function(m) return m.From == QAR_CONTRACT end,
    function(msg)
        local timestamp = tonumber(msg.Timestamp)
        local totalSupply = msg.Data
        
        -- Convert timestamp from milliseconds to seconds for os.date
        local timestampSeconds = math.floor(timestamp / 1000)
        local currentDate = os.date("!%Y-%m-%d", timestampSeconds)
        
        -- Add to recent timestamps
        dbAdmin:apply([[INSERT INTO RecentTimestamps (timestamp, totalSupply) 
            VALUES (?, ?);]], {timestamp, totalSupply})

        -- Keep only last 3 timestamps
        dbAdmin:apply([[DELETE FROM RecentTimestamps WHERE timestamp NOT IN (
            SELECT timestamp FROM RecentTimestamps 
            ORDER BY timestamp DESC LIMIT ?);]], {MAX_RECENT_TIMESTAMPS})
            
        -- Check if we already have an entry for this date
        local existingEntry = dbAdmin:select(
            [[SELECT date FROM DailySupply WHERE date = ? LIMIT 1;]],
            {currentDate}
        )
        
        if #existingEntry == 0 then
            -- Insert the new daily supply record
            dbAdmin:apply([[INSERT INTO DailySupply (date, timestamp, totalSupply) 
                VALUES (?, ?, ?);]], 
                {currentDate, timestamp, totalSupply})
            
            print(string.format("Recorded total supply %s for date %s", 
                totalSupply, currentDate))
        end
    end
)

-- Helper function to find the closest timestamp to midnight
local function findClosestToMidnight(timestamps, targetTimestamp)
    local closest = nil
    local minDifference = math.huge

    for _, ts in ipairs(timestamps) do
        local diff = math.abs(ts.timestamp - targetTimestamp)
        if diff < minDifference then
            minDifference = diff
            closest = ts
        end
    end

    return closest
end

-- Process Cron messages
Handlers.add('cron',
    function(m) return m.Action == "Cron" end,
    function(msg)
        local timestamp = tonumber(msg.Timestamp)

        -- Convert timestamp from milliseconds to seconds for os.date
        local timestampSeconds = math.floor(timestamp / 1000)
        local currentDate = os.date("!%Y-%m-%d", timestampSeconds)

        -- Print current status
        print(string.format("Current UTC Time: %s",
            os.date("!%Y-%m-%d %H:%M:%S", timestampSeconds)))

        -- Get the last recorded date from DailySupply
        local lastDateRow = dbAdmin:select([[
            SELECT date FROM DailySupply 
            ORDER BY date DESC LIMIT 1;]], {})
        
        -- Check if we need to record for a new date
        if #lastDateRow > 0 and lastDateRow[1].date == currentDate then
            print("Supply already recorded for today. Skipping.")
            return
        end

        -- Send Total-Supply request to wAR contract
        Send({
            Target = QAR_CONTRACT,
            Action = "Total-Supply"
        })
    end
)