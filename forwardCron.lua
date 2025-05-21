trackingProcess = "_g3kxQxL7F4Y9vXvHaR_cEa7oPkcjFpyuuHLMcHKSds"

Handlers.add(
    "ForwardCron",
    function(m)
        return m.Action == "Cron"
    end,
    function(m)
        Send({
            Target = trackingProcess,
            Action = "Cron"
        })
    end
)