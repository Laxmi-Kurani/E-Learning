-- Run this as a MySQL root/admin to create the LMS database and a dedicated user.
-- Replace 'lms_user' and 'StrongPassword' with your chosen values.

CREATE DATABASE IF NOT EXISTS lms;
CREATE USER IF NOT EXISTS 'lms_user'@'localhost' IDENTIFIED BY 'StrongPassword';
GRANT ALL PRIVILEGES ON lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;

-- Optionally drop the user (for testing):
-- DROP USER 'lms_user'@'localhost';
