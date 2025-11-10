INSERT INTO judge_final_guess
(game_id, judge_id, confidence, was_correct, argument)
VALUES (
           $1,
           $2,
           $3,
           $4,
           $5
       )
ON CONFLICT (game_id, judge_id) DO NOTHING
RETURNING *;
