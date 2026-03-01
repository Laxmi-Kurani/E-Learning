-- Add isActive column to existing user table
-- Run this against your LMS database if the column is missing (e.g. after upgrading schema).

ALTER TABLE `user`
ADD COLUMN `isActive` BOOLEAN DEFAULT TRUE;

-- Optionally, initialize values for existing records if needed:
-- UPDATE `user` SET isActive = TRUE;
