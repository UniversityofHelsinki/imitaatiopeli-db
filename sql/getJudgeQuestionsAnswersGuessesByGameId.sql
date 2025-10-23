SELECT
    q.question_id,
    q.question_text,
    q.created as question_created,
    a.answer_id,
    a.answer_text,
    a.answer_order,
    a.created as answer_created,
    a.is_pretender,
    jg.quess_id,
    jg.confidence,
    jg.was_correct,
    jg.created as guess_created,
    jg.argument
FROM QUESTION q
         LEFT JOIN ANSWER a ON q.question_id = a.question_id
         LEFT JOIN JUDGE_GUESS jg ON q.question_id = jg.question_id AND jg.answer_id = a.answer_id
WHERE q.judge_id = $1 AND q.game_id = $2
ORDER BY q.created DESC;