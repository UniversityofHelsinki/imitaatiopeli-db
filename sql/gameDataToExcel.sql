SELECT
    q.judge_id AS player,
    ROW_NUMBER() OVER (PARTITION BY q.judge_id ORDER BY q.created) AS sequence,
    q.question_text AS question,
    a_pretender.answer_text AS pretender,
    a_non.answer_text AS non_pretender,
    jg.argument AS assessment,
    CASE WHEN jg.answer_id = a_pretender.answer_id THEN 1 ELSE 0 END AS correct,
    jg.confidence,
    NULL AS final_assessment,
    NULL AS final_correct,
    NULL AS final_confidence
FROM question q
         JOIN player_combination pc ON pc.game_id = q.game_id AND pc.judge_id = q.judge_id
         JOIN player pp ON pp.player_id = pc.player_id AND pp.is_pretender = FALSE
         LEFT JOIN answer a_pretender ON a_pretender.question_id = q.question_id AND a_pretender.is_pretender = TRUE
         LEFT JOIN answer a_non ON a_non.question_id = q.question_id AND a_non.player_id = pp.player_id
         LEFT JOIN judge_guess jg ON jg.question_id = q.question_id AND jg.judge_id = q.judge_id
WHERE q.game_id = 1

UNION ALL

SELECT
    jfg.judge_id AS player,
    999 AS sequence,
    NULL AS question,
    NULL AS pretender,
    NULL AS non_pretender,
    NULL AS assessment,
    NULL AS correct,
    NULL AS confidence,
    jfg.argument AS final_assessment,
    CASE WHEN jfg.was_correct THEN 1 ELSE 0 END AS final_correct,
    jfg.confidence AS final_confidence
FROM judge_final_guess jfg
WHERE jfg.game_id = 1

ORDER BY player, sequence;
