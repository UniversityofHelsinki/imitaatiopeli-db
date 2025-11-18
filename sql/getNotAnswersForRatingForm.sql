SELECT a.*, q.question_text
FROM ANSWER a
         JOIN QUESTION q ON a.question_id = q.question_id
WHERE q.game_id = $1
  AND q.judge_id = $2
  AND NOT EXISTS (
    SELECT 1
    FROM JUDGE_GUESS jg
             JOIN QUESTION qq ON qq.question_id = jg.question_id
    WHERE qq.game_id = q.game_id
      AND qq.judge_id = q.judge_id
);