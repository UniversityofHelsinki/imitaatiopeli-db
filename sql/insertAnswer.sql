INSERT INTO ANSWER (question_id, player_id, answer_text, is_pretender, game_id, created, answer_order)
VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
