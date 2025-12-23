WITH guess_cte AS (
    SELECT COUNT(*)::int AS guess_count
    FROM JUDGE_GUESS jg
             JOIN QUESTION q
                  ON q.question_id = jg.question_id
    WHERE q.game_id = $1
      AND jg.judge_id = $2
),
     question_cte AS (
         SELECT COUNT(*)::int AS question_count
         FROM QUESTION q
         WHERE q.game_id = $1
           AND q.judge_id = $2
     )
SELECT
    guess_cte.guess_count,
    question_cte.question_count
FROM guess_cte, question_cte;