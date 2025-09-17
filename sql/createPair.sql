INSERT INTO PLAYER_COMBINATION (
  game_id,
  judge_id,
  player_id
) VALUES (
  $1,
  $2,
  $3
) RETURNING *;