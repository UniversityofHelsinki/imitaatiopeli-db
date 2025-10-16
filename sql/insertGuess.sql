INSERT INTO JUDGE_GUESS (question_id, confidence, was_correct, created, judge_id, answer_id, argument)
VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
