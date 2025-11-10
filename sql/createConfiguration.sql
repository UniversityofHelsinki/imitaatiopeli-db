INSERT INTO GAME_CONFIGURATION
(
    AI_PROMPT,
    GAME_NAME,
    THEME_DESCRIPTION,
    LANGUAGE_USED,
    INSTRUCTIONS_FOR_PLAYERS,
    IS_RESEARCH_GAME,
    RESEARCH_DESCRIPTION,
    LANGUAGE_MODEL,
    MODEL_TEMPERATURE,
    AI_ANSWER_POSITION,
    ANSWER_RANDOMIZATION
)
VALUES
    (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        floor(random() * 2 + 1)::int,
        $10
    ) RETURNING *;
