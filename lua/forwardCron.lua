BHtrackingProcess = "V5Pm1eScgJo1Ue6R0NL_qVUM53leE_B3zavwf1Z5zPk"
wARtrackingProcess = "Bi6bSPz-IyOCX9ZNedmLzv7Z6yxsrj9nHE1TnZzm_ks"
qARtrackingProcess = "e4kbo6uYtQc9vDZ1YkwZnwXLUWL-XCUx4XhLP25vRx0"

Handlers.add(
    "ForwardCron",
    function(m)
        return m.Action == "Cron"
    end,
    function(m)
        Send({
            Target = BHtrackingProcess,
            Action = "Cron"
        })

        Send({
            Target = wARtrackingProcess,
            Action = "Cron"
        })

        Send({
            Target = qARtrackingProcess,
            Action = "Cron"
        })
    end
)