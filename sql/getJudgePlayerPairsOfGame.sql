SELECT
    pc.game_id      AS game_id,
    pj.player_id    AS judge_player_id,
    pj.nickname     AS judge_nickname,
    pj.is_pretender AS judge_is_pretender,
    pp.player_id    AS player_player_id,
    pp.nickname     AS player_nickname,
    pp.is_pretender AS player_is_pretender
FROM player_combination pc
         JOIN player pj
              ON pj.game_id = pc.game_id
                  AND pj.player_id = pc.judge_id
         JOIN player pp
              ON pp.game_id = pc.game_id
                  AND pp.player_id = pc.player_id
WHERE pj.is_pretender = FALSE
  AND pp.is_pretender = FALSE
  AND pc.game_id = $1;