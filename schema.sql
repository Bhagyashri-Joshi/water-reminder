CREATE DATABASE IF NOT EXISTS aquatrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aquatrack;

CREATE TABLE IF NOT EXISTS user_settings (
  id TINYINT PRIMARY KEY,
  daily_goal_ml INT NOT NULL DEFAULT 2000,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_goal_positive CHECK (daily_goal_ml > 0)
);

CREATE TABLE IF NOT EXISTS daily_summaries (
  summary_date DATE PRIMARY KEY,
  goal_ml INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_summary_goal_positive CHECK (goal_ml > 0)
);

CREATE TABLE IF NOT EXISTS water_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  amount_ml INT NOT NULL,
  logged_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_water_logs_logged_at (logged_at),
  CONSTRAINT chk_amount_positive CHECK (amount_ml > 0)
);

INSERT INTO user_settings (id, daily_goal_ml)
VALUES (1, 2000)
ON DUPLICATE KEY UPDATE id = id;
