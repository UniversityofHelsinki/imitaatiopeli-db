SELECT
    p.player_id,
    p.nickname,
    COUNT(DISTINCT q.question_id) as questions_sent,
    COUNT(DISTINCT CASE WHEN jg.was_correct = true THEN jg.quess_id END) as correct_guesses,
    ARRAY_AGG(jg.confidence ORDER BY jg.created) as confidence_values
FROM
    GAME_PLAYERS gp
        JOIN PLAYER p ON gp.player_id = p.player_id
        LEFT JOIN QUESTION q ON q.game_id = gp.game_id AND q.judge_id = p.player_id
        LEFT JOIN JUDGE_GUESS jg ON jg.judge_id = p.player_id
        AND jg.question_id IN (
            SELECT q2.question_id
            FROM QUESTION q2
            WHERE q2.game_id = $1
        )
        JOIN GAME_ORGANIZER go ON go.game_id = $1 AND go.user_id = $2
WHERE
    gp.game_id = $1
GROUP BY
    p.player_id, p.nickname
ORDER BY
    p.player_id;