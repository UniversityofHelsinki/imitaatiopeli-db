INSERT INTO GAME 
  (
    CONFIG_ID,
    GAME_CODE
  )
VALUES 
  (
    $1,
    $2
  ) RETURNING *;