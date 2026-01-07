-- Get the maximum number of questions allowed for the current game configuration
WITH current_game_config AS (
    SELECT gc.max_questions
    FROM GAME g
    JOIN GAME_CONFIGURATION gc ON g.config_id = gc.config_id
    WHERE g.game_id = $2
),
-- Count answers and judge ratings for each question belonging to the specified judge
judge_questions AS (
    SELECT
        q.question_id,
        (SELECT COUNT(*) FROM ANSWER a WHERE a.question_id = q.question_id) as answer_count,
        (SELECT COUNT(*) FROM JUDGE_GUESS jg WHERE jg.question_id = q.question_id AND jg.judge_id = $1) as rating_count
    FROM QUESTION q
    WHERE q.game_id = $2 AND q.judge_id = $1
),
-- Identify the most recent question created by the judge
latest_question AS (
    SELECT * FROM judge_questions
    ORDER BY question_id DESC
    LIMIT 1
),
-- Count how many questions have been fully answered (2+ answers) and rated by the judge
finished_questions_count AS (
    SELECT COUNT(*) as finished_count
    FROM judge_questions
    WHERE answer_count >= 2 AND rating_count > 0
),
-- Check if the judge has indicated they want to send the final guess early
player_intent AS (
    SELECT wants_to_send_final_guess
    FROM GAME_PLAYERS
    WHERE game_id = $2 AND player_id = $1
),
-- Check if the judge has already submitted a final guess for the game
final_guess AS (
    SELECT 1 FROM JUDGE_FINAL_GUESS WHERE game_id = $2 AND judge_id = $1
),
-- Check if the player needs to answer a question from their judge
needs_to_answer AS (
    SELECT 1
    FROM PLAYER_COMBINATION pc
    JOIN QUESTION q ON q.judge_id = pc.player_id AND q.game_id = pc.game_id
    WHERE pc.game_id = $2 AND pc.judge_id = $1
    AND NOT EXISTS (
        SELECT 1 FROM ANSWER a
        WHERE a.question_id = q.question_id
        AND a.player_id = $1
    )
)
-- Determine the current status of the player
SELECT
    CASE
        -- 'end': The final rating has been made
        WHEN EXISTS (SELECT 1 FROM final_guess) THEN 'end'

        -- 'answer': The player needs to answer a question from their judge
        WHEN EXISTS (SELECT 1 FROM needs_to_answer) THEN 'answer'

        -- 'final-review': The judge has completed max_questions OR has indicated they want to send the final guess early
        WHEN (SELECT finished_count FROM finished_questions_count) >= (SELECT max_questions FROM current_game_config)
             OR (SELECT wants_to_send_final_guess FROM player_intent) = TRUE
        THEN 'final-review'

        -- 'ask': The judge has no questions in the database yet
        WHEN NOT EXISTS (SELECT 1 FROM latest_question) THEN 'ask'

        -- 'rate': The latest question has two answers but no rating from the judge
        WHEN (SELECT answer_count FROM latest_question) >= 2 AND (SELECT rating_count FROM latest_question) = 0 THEN 'rate'

        -- 'wait': The latest question has fewer than two answers (waiting for players or AI)
        WHEN (SELECT answer_count FROM latest_question) < 2 THEN 'wait'

        -- 'ask': The judge's last question has already been rated, and more questions can still be asked
        WHEN (SELECT answer_count FROM latest_question) >= 2 AND (SELECT rating_count FROM latest_question) > 0 THEN 'ask'

        ELSE 'ask'
    END as status;
