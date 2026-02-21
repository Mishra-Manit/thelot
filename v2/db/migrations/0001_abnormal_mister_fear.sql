ALTER TABLE "shots" ADD COLUMN "sound_cues" text;--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN "video_clip_title" varchar(255);--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN "start_frame_prompt" text;--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN "end_frame_prompt" text;--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN "video_prompt" text;