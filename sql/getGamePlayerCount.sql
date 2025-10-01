SELECT COUNT(DISTINCT player_id) AS player_count FROM GAME_PLAYERS
WHERE game_id = $1;