SELECT a.*
FROM QUESTION q
         JOIN ANSWER a ON q.question_id = a.question_id
         LEFT JOIN JUDGE_GUESS jg ON q.question_id = jg.question_id
    AND jg.judge_id = $1
WHERE q.game_id = $2
  AND jg.quess_id IS NULL;
