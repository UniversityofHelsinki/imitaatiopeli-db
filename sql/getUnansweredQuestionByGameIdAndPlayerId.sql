SELECT q.*
FROM QUESTION q
         LEFT JOIN ANSWER a ON q.question_id = a.question_id
WHERE q.game_id = $1
  AND q.judge_id = $2
  AND a.question_id IS NULL;
