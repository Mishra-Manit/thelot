ALTER TABLE "shots" ADD COLUMN "frames_status" varchar(32) NOT NULL DEFAULT 'idle';
ALTER TABLE "shots" ADD COLUMN "video_status" varchar(32) NOT NULL DEFAULT 'idle';
ALTER TABLE "shots" ADD COLUMN "voice_status" varchar(32) NOT NULL DEFAULT 'idle';
ALTER TABLE "shots" ADD COLUMN "lipsync_status" varchar(32) NOT NULL DEFAULT 'idle';
ALTER TABLE "shots" ADD COLUMN "approved" boolean NOT NULL DEFAULT false;
