WITH game AS (
    INSERT INTO GAME (config_id, game_code)
        VALUES ($1, $2)
        RETURNING game_id
)
INSERT INTO GAME_ORGANIZER (game_id, user_id, created_at)
SELECT game_id, $3, CURRENT_TIMESTAMP
FROM game
RETURNING game_id;