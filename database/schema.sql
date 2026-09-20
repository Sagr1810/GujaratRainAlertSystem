-- Gujarat Rain Alert System — MySQL Schema
-- Run this to create the database and tables manually
-- Or let the app create them automatically via Sequelize sync

CREATE DATABASE IF NOT EXISTS gujarat_rain_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gujarat_rain_db;

-- Already handled by Sequelize sync in server.js
-- This file is for manual reference / verification

-- Show created tables after running the app once:
-- SHOW TABLES;
-- SELECT COUNT(*) FROM cities;
-- SELECT COUNT(*) FROM regions;
-- SELECT COUNT(*) FROM historical_impacts;
