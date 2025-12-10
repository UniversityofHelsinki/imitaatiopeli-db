SELECT * FROM (
                  SELECT
                      pj.nickname AS player_name,
                      pp.nickname AS respondent,
                      q.judge_id AS player,
                      CAST(ROW_NUMBER() OVER (PARTITION BY q.judge_id ORDER BY q.created) AS TEXT) AS sequence,
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
                           JOIN player pj ON pj.player_id = q.judge_id
                           JOIN player pp ON pp.player_id = pc.player_id AND pp.is_pretender = FALSE
                           LEFT JOIN answer a_pretender ON a_pretender.question_id = q.question_id AND a_pretender.is_pretender = FALSE
                           LEFT JOIN answer a_non ON a_non.question_id = q.question_id AND a_non.player_id = pp.player_id
                           LEFT JOIN judge_guess jg ON jg.question_id = q.question_id AND jg.judge_id = q.judge_id
                  WHERE q.game_id = $1

                  UNION ALL

                  SELECT
                      pj.nickname AS player_name,
                      pp.nickname AS respondent,
                      jfg.judge_id AS player,
                      'Final' AS sequence,
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
                           JOIN player_combination pc ON pc.game_id = jfg.game_id AND pc.judge_id = jfg.judge_id
                           JOIN player pj ON pj.player_id = jfg.judge_id
                           JOIN player pp ON pp.player_id = pc.player_id AND pp.is_pretender = FALSE
                  WHERE jfg.game_id = $1
              ) AS game_data
ORDER BY player,
         CASE WHEN sequence = 'Final' THEN '999' ELSE sequence END;
