SELECT COUNT(*) FILTER (WHERE jfq.judge_id IS NULL) = 0 AS all_have_final_guess
FROM game_players gp
         LEFT JOIN judge_final_guess jfq
                   ON jfq.game_id = gp.game_id
                       AND jfq.judge_id = gp.player_id
WHERE gp.game_id = $1;