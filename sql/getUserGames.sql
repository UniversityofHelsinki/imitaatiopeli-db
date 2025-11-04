SELECT g.*
FROM GAME g
         JOIN GAME_ORGANIZER go ON go.user_id = $1
WHERE go.user_id = $1
ORDER BY g.start_time DESC;