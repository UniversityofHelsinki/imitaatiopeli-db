SELECT a.*, q.question_text
FROM ANSWER a
         JOIN QUESTION q ON a.question_id = q.question_id
         LEFT JOIN JUDGE_GUESS jg
                   ON q.question_id = jg.question_id
                       AND jg.judge_id = q.judge_id
WHERE q.game_id = $1
  AND q.judge_id = $2
  AND jg.quess_id IS NULL;  -- use the actual column name


