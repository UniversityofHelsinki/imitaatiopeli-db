WITH pretender AS (
    SELECT player_id
    FROM player_combination
    WHERE game_id = $1 AND judge_id = $2 AND player_id = 1
)
INSERT INTO judge_final_guess
(game_id, judge_id, guessed_player_id, confidence, was_correct, argument)
VALUES (
           $1,
           $2,
           $3,
           $4,
           ($3 = (SELECT player_id FROM pretender)),
           $5
       )
ON CONFLICT (game_id, judge_id) DO NOTHING
RETURNING *;