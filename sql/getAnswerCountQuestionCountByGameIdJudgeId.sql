WITH answer_cte AS (
    SELECT COUNT(*)::int AS answer_count
    FROM PLAYER_COMBINATION pc
             JOIN ANSWER a
                  ON a.player_id = pc.player_id
                      AND a.game_id  = pc.game_id
    WHERE pc.game_id = $1
      AND pc.judge_id = $2
      AND pc.player_id <> 1
),
     question_cte AS (
         SELECT COUNT(*)::int AS question_count
         FROM QUESTION q
         WHERE q.game_id = $1
           AND q.judge_id = $2
     )
SELECT
    answer_cte.answer_count,
    question_cte.question_count
FROM answer_cte, question_cte;