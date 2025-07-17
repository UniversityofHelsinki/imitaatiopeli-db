INSERT INTO GAME 
  (
    CONFIG_ID
  )
VALUES 
  (
    $1 
  ) RETURNING *;