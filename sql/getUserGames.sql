SELECT g.game_id, g.game_code, g.config_id, g.start_time, g.end_time,
       gc.game_name, gc.theme_description, gc.language_model, gc.language_used,
       gc.is_research_game, gc.research_description,
       go.user_id, go.created_at
FROM GAME g
JOIN GAME_ORGANIZER go ON g.game_id = go.game_id
JOIN GAME_CONFIGURATION gc ON g.config_id = gc.config_id
WHERE go.user_id = $1
ORDER BY go.created_at DESC;