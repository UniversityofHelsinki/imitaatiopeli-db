SELECT pc.player_id
FROM player_combination pc
         INNER JOIN player p ON pc.player_id = p.player_id
WHERE pc.game_id = $1
  AND pc.judge_id = $2
  AND p.is_pretender = false
