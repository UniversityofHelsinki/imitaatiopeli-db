SELECT a.*, q.question_text
FROM ANSWER a
         JOIN QUESTION q ON a.question_id = q.question_id
         LEFT JOIN JUDGE_FINAL_GUESS jfg
                   ON q.game_id = jfg.game_id
                       AND jfg.judge_id = q.judge_id
WHERE q.game_id = $1
  AND q.judge_id = $2
  AND jfg.final_guess_id IS NULL;


