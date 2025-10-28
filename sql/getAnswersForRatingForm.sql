SELECT a.*
FROM ANSWER a
         JOIN QUESTION q ON a.question_id = q.question_id
         LEFT JOIN JUDGE_GUESS jg
                   ON q.question_id = jg.question_id
                       AND jg.judge_id = q.judge_id  -- ensure it’s the same judge who owns the question
WHERE q.game_id = $1
  AND q.judge_id = $2                -- the judge you’re checking for
  AND jg.quess_id IS NULL;          -- judge hasn’t guessed yet
