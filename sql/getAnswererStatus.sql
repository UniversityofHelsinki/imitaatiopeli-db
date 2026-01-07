-- Check if the player needs to answer a question from their judge
WITH needs_to_answer AS (
SELECT 1
FROM PLAYER_COMBINATION pc
    JOIN QUESTION q ON q.judge_id = pc.player_id AND q.game_id = pc.game_id
WHERE pc.game_id = $2 AND pc.judge_id = $1
  AND NOT EXISTS (
    SELECT 1 FROM ANSWER a
    WHERE a.question_id = q.question_id
  AND a.player_id = $1
    )
    )
-- Determine the current status of the player
SELECT
    CASE
        -- 'answer': The player needs to answer a question from their judge
        WHEN EXISTS (SELECT 1 FROM needs_to_answer) THEN 'answer'
        ELSE 'wait'
        END as status;
