SELECT
    p.player_id,
    p.nickname,
    p.session_token
FROM
    PLAYER p
        INNER JOIN game_players gp ON p.player_id = gp.player_id
WHERE
    gp.game_id = $1
ORDER BY
    p.nickname;