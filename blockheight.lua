-- Enhanced Lua Script to Correctly Associate Blocks with Dates
local json = require('json')
local sqlite = require('lsqlite3')

-- Initialize SQLite database
Db = Db or sqlite.open_memory()
dbAdmin = require('@rakis/DbAdmin').new(Db)

-- Constants
MAX_RECENT_BLOCKS = 3
MAX_HISTORY_RECORDS = 1000

-- Initialize tables if they don't exist
Db:exec([[CREATE TABLE IF NOT EXISTS RecentBlocks (timestamp INTEGER, blockHeight INTEGER);]])
Db:exec([[CREATE TABLE IF NOT EXISTS DailyBlocks (date TEXT, timestamp INTEGER, blockHeight INTEGER);]])

-- Function to clear all historical entries
function clearTables()
    dbAdmin:apply([[DELETE FROM DailyBlocks;]], {})
    dbAdmin:apply([[DELETE FROM WeeklyBlocks;]], {})
    print("All historical entries cleared from tables")
end

-- Function to print current blocks data
function printBlocks()
    local dailyBlocks = dbAdmin:select([[
        SELECT * FROM DailyBlocks 
        ORDER BY timestamp DESC;
    ]], {})
    
    local weeklyBlocks = dbAdmin:select([[
        SELECT * FROM WeeklyBlocks 
        ORDER BY timestamp DESC;
    ]], {})
    
    local recentBlocks = dbAdmin:select([[
        SELECT * FROM RecentBlocks 
        ORDER BY timestamp DESC;
    ]], {})
    
    print("Recent Blocks:")
    print(json.encode(recentBlocks))
    print("\nDaily Blocks History:")
    print(json.encode(dailyBlocks))
    print("\nWeekly Blocks History:")
    print(json.encode(weeklyBlocks))
end

-- Handler for Info requests
Handlers.add('info',
    function(m) return m.Action == "BlocksHistory" end,
    function(msg)
        local dailyBlocks = dbAdmin:select([[
            SELECT * FROM DailyBlocks 
            ORDER BY timestamp DESC;
        ]], {})
        
        Send({
            Target = msg.From,
            DailyBlocks = json.encode(dailyBlocks)
        })
    end
)

-- Helper function to find the closest block to midnight
local function findClosestToMidnight(blocks, targetTimestamp)
    local closestBlock = nil
    local minDifference = math.huge

    for _, block in ipairs(blocks) do
        local diff = math.abs(block.timestamp - targetTimestamp)
        if diff < minDifference then
            minDifference = diff
            closestBlock = block
        end
    end

    return closestBlock
end

-- Process Cron messages
Handlers.add('cron',
    function(m) return m.Action == "Cron" end,
    function(msg)
        local timestamp = tonumber(msg.Timestamp)
        local blockHeight = tonumber(msg["Block-Height"])

        -- Convert timestamp from milliseconds to seconds for os.date
        local timestampSeconds = math.floor(timestamp / 1000)

        -- Get current date in UTC
        local currentDate = os.date("!%Y-%m-%d", timestampSeconds)

        -- Print current status
        print(string.format("Current Block Height: %d, UTC Time: %s",
            blockHeight,
            os.date("!%Y-%m-%d %H:%M:%S", timestampSeconds)))

        -- Add to recent blocks
        dbAdmin:apply([[INSERT INTO RecentBlocks (timestamp, blockHeight) VALUES (?, ?);]], {timestamp, blockHeight})

        -- Keep only last 3 blocks
        dbAdmin:apply([[DELETE FROM RecentBlocks WHERE timestamp NOT IN (
            SELECT timestamp FROM RecentBlocks ORDER BY timestamp DESC LIMIT ?);]], {MAX_RECENT_BLOCKS})

        -- Get the last recorded date from DailyBlocks
        local lastDateRow = dbAdmin:select([[SELECT date FROM DailyBlocks ORDER BY date DESC LIMIT 1;]], {})
        
        local nextDate
        if #lastDateRow > 0 then
            local lastDate = lastDateRow[1].date
            -- If the last recorded date is different from current date, use current date
            if lastDate ~= currentDate then
                nextDate = currentDate
            else
                print("Date already recorded. Skipping.")
                return
            end
        else
            -- If no previous date, use current date
            nextDate = currentDate
        end

        -- Check if the nextDate already exists in DailyBlocks
        local existingEntry = dbAdmin:select(
            [[SELECT date FROM DailyBlocks WHERE date = ? LIMIT 1;]],
            {nextDate}
        )
        if #existingEntry > 0 then
            print(string.format("Date %s already exists in DailyBlocks. Skipping insertion.", nextDate))
            return
        end

        -- Identify the block closest to the current timestamp
        local closestBlock = findClosestToMidnight(
            dbAdmin:select([[SELECT * FROM RecentBlocks ORDER BY timestamp DESC;]], {}),
            timestamp
        )

        if closestBlock then
            -- Add +1 to the block height before inserting
            local adjustedBlockHeight = closestBlock.blockHeight + 1
            
            -- Insert daily block with adjusted height
            dbAdmin:apply([[INSERT INTO DailyBlocks (date, timestamp, blockHeight) VALUES (?, ?, ?);]], 
                {nextDate, closestBlock.timestamp, adjustedBlockHeight})
        
            print(string.format("Inserted daily block %d for date %s", adjustedBlockHeight, nextDate))
        else
            print("No suitable block found for the target date.")
        end
    end
)
