-- ═══════════════════════════════════════════════════════
--  Sync Everyone — Database Schema
--  Run this once in your Hostinger MySQL panel (phpMyAdmin)
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS sync_everyone
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sync_everyone;

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(12)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  handle      VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  bio         TEXT,
  avatar_url  VARCHAR(500),
  color       VARCHAR(10)  DEFAULT '#e8a045',
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ── FOLLOWS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id VARCHAR(12) NOT NULL,
  following_id VARCHAR(12) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── POSTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          VARCHAR(12)  PRIMARY KEY,
  user_id     VARCHAR(12)  NOT NULL,
  caption     TEXT,
  image_url   VARCHAR(500),
  emoji       VARCHAR(10)  DEFAULT '✨',
  tags        VARCHAR(500),
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── LIKES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  user_id   VARCHAR(12) NOT NULL,
  post_id   VARCHAR(12) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- ── COMMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         VARCHAR(12) PRIMARY KEY,
  post_id    VARCHAR(12) NOT NULL,
  user_id    VARCHAR(12) NOT NULL,
  text       TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── CONVERSATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id         VARCHAR(12)  PRIMARY KEY,
  type       ENUM('direct','group') DEFAULT 'direct',
  name       VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── CONVERSATION MEMBERS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id VARCHAR(12) NOT NULL,
  user_id         VARCHAR(12) NOT NULL,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id) ON DELETE CASCADE
);

-- ── MESSAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              VARCHAR(12) PRIMARY KEY,
  conversation_id VARCHAR(12) NOT NULL,
  user_id         VARCHAR(12) NOT NULL,
  text            TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id) ON DELETE CASCADE
);

-- ── INDEXES for performance ───────────────────────────────
CREATE INDEX idx_posts_user    ON posts(user_id);
CREATE INDEX idx_messages_conv ON messages(conversation_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
