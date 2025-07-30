-- Manual database cleanup script
-- Run this inside MySQL container if volume reset doesn't work

USE smart_rw;

-- Remove failed migration records
DELETE FROM _prisma_migrations WHERE migration_name = '20250726120313_add_rt_model';
DELETE FROM _prisma_migrations WHERE migration_name = '20250719111850_notification_system_update';

-- Show remaining migrations
SELECT * FROM _prisma_migrations;

-- If table exists but empty, we can proceed with migrate deploy
-- If table doesn't exist, that's fine too - Prisma will create it
