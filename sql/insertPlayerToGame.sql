INSERT INTO game_players (game_id, player_id)
VALUES ($1, $2)
RETURNING *;