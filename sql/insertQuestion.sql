INSERT INTO question
(judge_id, game_id, question_text, created)
VALUES
    ($1, $2, $3,NOW())
    RETURNING
    question_id,
    question_text,
    created;
