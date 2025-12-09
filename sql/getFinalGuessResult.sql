SELECT
    jfg.was_correct AS final_was_correct,
    gc.show_result
FROM JUDGE_FINAL_GUESS jfg
         LEFT JOIN GAME_CONFIGURATION gc
                   ON gc.config_id = jfg.game_id
WHERE jfg.judge_id = $1
  AND jfg.game_id = $2;
