CREATE TABLE IF NOT EXISTS LANGUAGE_MODEL (
                                              model_id SERIAL,
                                              name VARCHAR(255),
                                              url VARCHAR(255),
                                              PRIMARY KEY(model_id)
);


CREATE TABLE IF NOT EXISTS GAME_CONFIGURATION (
                                                  config_id SERIAL,
                                                  ai_prompt VARCHAR,
                                                  model_temperature FLOAT DEFAULT 0.7,
                                                  game_name VARCHAR(255),
                                                  theme_description VARCHAR(255),
                                                  max_duration_minutes integer,
                                                  max_questions integer,
                                                  language_model INTEGER REFERENCES LANGUAGE_MODEL(model_id),
                                                  answer_randomization BOOLEAN DEFAULT FALSE,
                                                  background_info BOOLEAN,
                                                  language_used VARCHAR(255),
                                                  instructions_for_players VARCHAR(4000),
                                                  is_research_game BOOLEAN,
                                                  research_description VARCHAR(4000),
                                                  ai_answer_position integer,
                                                  PRIMARY KEY(config_id)
);

CREATE TABLE IF NOT EXISTS PLAYER (
                                      player_id SERIAL,
                                      is_pretender BOOLEAN,
                                      created_at TIMESTAMP,
                                      PRIMARY KEY(player_id),
                                      nickname VARCHAR(100) NOT NULL,
                                      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      session_token VARCHAR(255) UNIQUE,
                                      is_research_allowed BOOLEAN
);

CREATE TABLE IF NOT EXISTS GAME (
                                    game_id SERIAL,
                                    config_id INTEGER REFERENCES GAME_CONFIGURATION(config_id),
                                    start_time TIMESTAMPTZ,
                                    end_time TIMESTAMPTZ,
                                    game_code VARCHAR(255) UNIQUE NOT NULL,
                                    duration_minutes integer,
                                    PRIMARY KEY(game_id)
);

CREATE TABLE IF NOT EXISTS GAME_ORGANIZER (
                                                  id SERIAL,
                                                  user_id VARCHAR(255),
                                                  created_at TIMESTAMP,
                                                  PRIMARY KEY(id)
);

/*CREATE TABLE IF NOT EXISTS BACKGROUND_INFO (
    id SERIAL,
    player_id integer,
    age integer,
    gender VARCHAR(255),
    location VARCHAR(255),
    relevant_background VARCHAR(255),
    theme VARCHAR(255),
    is_location_mandatory BOOLEAN,
    is_age_mandatory BOOLEAN,
    is_background_info_mandatory BOOLEAN,
    is_gender_mandatory BOOLEAN,
    created TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS CUSTOM_BACKGROUND_INFO (
    background_info_id SERIAL,
    custom_fields VARCHAR(255),
    info_id INTEGER REFERENCES BACKGROUND_INFO(id),
    config_id INTEGER REFERENCES GAME_CONFIGURATION(config_id),
    PRIMARY KEY(background_info_id)
);*/

CREATE TABLE IF NOT EXISTS QUESTION (
                                        question_id SERIAL,
                                        game_id integer REFERENCES GAME(game_id),
                                        question_text VARCHAR(255),
                                        created TIMESTAMP,
                                        judge_id INTEGER REFERENCES PLAYER(player_id),
                                        PRIMARY KEY(question_id)
);

CREATE TABLE IF NOT EXISTS ANSWER (
                                      answer_id SERIAL,
                                      question_id INTEGER REFERENCES QUESTION(question_id),
                                      player_id integer,
                                      answer_text VARCHAR(500),
                                      answer_order integer,
                                      created TIMESTAMP,
                                      is_pretender BOOLEAN,
                                      game_id integer REFERENCES GAME(game_id),
                                      PRIMARY KEY(answer_id)
);

CREATE TABLE IF NOT EXISTS JUDGE_GUESS (
                                           quess_id SERIAL,
                                           question_id INTEGER REFERENCES QUESTION(question_id),
                                           confidence integer,
                                           was_correct BOOLEAN,
                                           created TIMESTAMP,
                                           judge_id INTEGER REFERENCES PLAYER(player_id),
                                           answer_id INTEGER REFERENCES ANSWER(answer_id),
                                           argument VARCHAR(500),
                                           PRIMARY KEY(quess_id)
);

CREATE TABLE IF NOT EXISTS GAME_SUMMARY (
                                            summary_id SERIAL,
                                            game_id INTEGER REFERENCES GAME(game_id),
                                            total_questions integer,
                                            correct_questions integer,
                                            accuracy_percent float,
                                            final_guess integer,
                                            final_guess_correct BOOLEAN,
                                            PRIMARY KEY(summary_id)
);

CREATE TABLE IF NOT EXISTS GAME_PLAYERS (
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES GAME(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES PLAYER(player_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PLAYER_COMBINATION (
  game_id INTEGER REFERENCES GAME(game_id),
  judge_id INTEGER REFERENCES PLAYER(player_id),
  player_id INTEGER REFERENCES PLAYER(player_id)
);

CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON game_players(player_id);

INSERT INTO PLAYER (nickname, is_pretender, created_at)
SELECT 'ai_player', TRUE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM PLAYER WHERE nickname = 'ai_player'
);

CREATE TABLE IF NOT EXISTS JUDGE_FINAL_GUESS (
    final_guess_id SERIAL,
    game_id INTEGER REFERENCES GAME(game_id),
    judge_id INTEGER REFERENCES PLAYER(player_id),
    confidence INTEGER,
    was_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    argument VARCHAR(500),
    PRIMARY KEY(final_guess_id),
    UNIQUE(game_id, judge_id)
);

CREATE TABLE IF NOT EXISTS PROMPT_SUFFIX_TEMPLATE (
    language_code VARCHAR(10) PRIMARY KEY,
    suffix_template TEXT NOT NULL
);

INSERT INTO PROMPT_SUFFIX_TEMPLATE (language_code, suffix_template) VALUES
    ('fi', 'vastauksen tulisi olla noin {length} merkkiä pitkä eikä ylittää koskaan 500 merkkiä. Vastaa suomen kielellä.'),
    ('en', 'the answer should be around {length} characters and never exceed 500 characters. Answer in English language.'),
    ('swe', 'svaret bör vara cirka {length} tecken långt och får aldrig överstiga 50 tecken. Svara på svenska.')
    ON CONFLICT (language_code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_final_judge_guess_game_id ON judge_final_guess(game_id);
CREATE INDEX IF NOT EXISTS idx_final_judge_guess_judge_id ON judge_final_guess(judge_id);

