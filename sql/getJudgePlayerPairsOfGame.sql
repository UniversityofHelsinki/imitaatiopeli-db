SELECT
    pc.game_id      AS game_id,
    pj.player_id    AS judge_player_id,
    pj.nickname     AS judge_nickname,
    pj.is_pretender AS judge_is_pretender,
    pp.player_id    AS player_player_id,
    pp.nickname     AS player_nickname,
    pp.is_pretender AS player_is_pretender,
    COALESCE(answer_counts.answer_count, 0) AS player_answer_count,
    COALESCE(question_counts.question_count, 0) AS player_question_count,
    CASE WHEN jfg.final_guess_id IS NOT NULL THEN TRUE ELSE FALSE END AS final_guess
FROM player_combination pc
         JOIN game_players gpj ON gpj.game_id = pc.game_id AND gpj.player_id = pc.judge_id
         JOIN player pj        ON pj.player_id = gpj.player_id
         JOIN game_players gpp ON gpp.game_id = pc.game_id AND gpp.player_id = pc.player_id
         JOIN player pp        ON pp.player_id = gpp.player_id
         LEFT JOIN (
    SELECT player_id, game_id, COUNT(*) AS answer_count
    FROM answer
    WHERE game_id = $1
    GROUP BY player_id, game_id
) answer_counts ON answer_counts.player_id = pp.player_id AND answer_counts.game_id = pc.game_id
         LEFT JOIN (
    SELECT judge_id, game_id, COUNT(*) AS question_count
    FROM question
    WHERE game_id = $1
    GROUP BY judge_id, game_id
) question_counts ON question_counts.judge_id = pp.player_id AND question_counts.game_id = pc.game_id
         LEFT JOIN judge_final_guess jfg ON jfg.game_id = pc.game_id AND jfg.judge_id = pj.player_id
WHERE pj.is_pretender = FALSE
  AND pp.is_pretender = FALSE
  AND pc.game_id = $1;
