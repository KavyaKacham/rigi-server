-- Rigital Ecosystem — database schema
-- Run this once against your MySQL database before starting the server:
--   mysql -u root -p rigital_ecosystem < schema.sql
CREATE DATABASE IF NOT EXISTS rigital_ecosystem;
 USE rigital_ecosystem;
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150)  NOT NULL,
  email         VARCHAR(190)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Add more tables here as the app grows, e.g.:
--
-- CREATE TABLE IF NOT EXISTS businesses (
--   id          INT AUTO_INCREMENT PRIMARY KEY,
--   owner_id    INT NOT NULL,
--   name        VARCHAR(200) NOT NULL,
--   created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (owner_id) REFERENCES users(id)
-- );
