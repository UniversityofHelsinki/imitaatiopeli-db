CREATE TABLE IF NOT EXISTS LANGUAGE_MODEL (
                                              model_id SERIAL,
                                              name VARCHAR(255),
                                              url VARCHAR(255),
                                              PRIMARY KEY(model_id)
);


CREATE TABLE IF NOT EXISTS GAME_CONFIGURATION (
                                                  config_id SERIAL,
                                                  ai_prompt VARCHAR,
                                                  model_temperature integer,
                                                  game_name VARCHAR(255),
                                                  theme_description VARCHAR(255),
                                                  max_duration_minutes integer,
                                                  max_questions integer,
                                                  language_model INTEGER REFERENCES LANGUAGE_MODEL(model_id),
                                                  answer_randomization BOOLEAN,
                                                  background_info BOOLEAN,
                                                  language_used VARCHAR(255),
                                                  instructions_for_players VARCHAR(4000),
                                                  is_research_game BOOLEAN,
                                                  research_description VARCHAR(4000),
                                                  PRIMARY KEY(config_id)
);

CREATE TABLE IF NOT EXISTS PLAYER (
                                      player_id SERIAL,
                                      game_id integer,
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
                                    judge_id INTEGER REFERENCES PLAYER(player_id),
                                    human_id INTEGER REFERENCES PLAYER(player_id),
                                    ai_id INTEGER REFERENCES PLAYER(player_id),
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
                                        PRIMARY KEY(question_id)
);

CREATE TABLE IF NOT EXISTS ANSWER (
                                      answer_id SERIAL,
                                      question_id INTEGER REFERENCES QUESTION(question_id),
                                      player_id integer,
                                      answer_text VARCHAR(255),
                                      answer_order integer,
                                      created TIMESTAMP,
                                      PRIMARY KEY(answer_id)
);

CREATE TABLE IF NOT EXISTS JUDGE_GUESS (
                                           quess_id SERIAL,
                                           question_id INTEGER REFERENCES QUESTION(question_id),
                                           chosen_answer_order integer,
                                           confidence_procent integer,
                                           was_correct BOOLEAN,
                                           created TIMESTAMP,
                                           PRIMARY KEY(quess_id)
);

CREATE TABLE IF NOT EXISTS GAME_SUMMARY (
                                            summary_id SERIAL,
                                            game_id INTEGER REFERENCES GAME(game_id),
                                            total_questions integer,
                                            correct_questions integer,
                                            accurary_percent float,
                                            final_guess integer,
                                            final_guess_correct BOOLEAN,
                                            PRIMARY KEY(summary_id)
);

CREATE TABLE IF NOT EXISTS game_players (
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
