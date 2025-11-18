SELECT
    gp.game_id,
    p.player_id,
    p.nickname,
    COALESCE(qc.question_count, 0)  AS questions_asked,
    COALESCE(cc.correct_guesses, 0) AS correct_guesses,
    COALESCE(cg.guesses_sent, 0)    AS guesses_sent
FROM game_players gp
         JOIN player p
              ON p.player_id = gp.player_id
         LEFT JOIN (
    SELECT
        q.judge_id,
        COUNT(*) AS question_count
    FROM question q
    WHERE q.game_id = $1
    GROUP BY q.judge_id
) qc
                   ON qc.judge_id = p.player_id
         LEFT JOIN (
    SELECT
        jg.judge_id,
        COUNT(*) AS correct_guesses
    FROM judge_guess jg
             JOIN question q ON q.question_id = jg.question_id
    WHERE jg.was_correct = TRUE
      AND q.game_id = $1
    GROUP BY jg.judge_id
) cc
                   ON cc.judge_id = p.player_id
         LEFT JOIN (
    SELECT
        jg.judge_id,
        COUNT(*) AS guesses_sent
    FROM judge_guess jg
             JOIN question q ON q.question_id = jg.question_id
    WHERE q.game_id = $1
    GROUP BY jg.judge_id
) cg
                   ON cg.judge_id = p.player_id
         JOIN game_organizer go
              ON go.game_id = gp.game_id
                  AND go.user_id::text = $2
WHERE gp.game_id = $1
ORDER BY p.player_id;