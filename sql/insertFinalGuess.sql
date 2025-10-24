WITH pretender AS (
    SELECT p.player_id
    FROM game_players gp
             JOIN player p ON p.player_id = gp.player_id
    WHERE gp.game_id = $1 AND p.is_pretender = true
)
INSERT INTO judge_final_guess
(game_id, judge_id, guessed_pretender_id, confidence, was_correct, argument)
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