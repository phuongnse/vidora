import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/modules/categories/server/categories-router";
import { studioRouter } from "@/modules/studio/server/studio-router";
import { videosRouter } from "@/modules/videos/server/videos-router";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
});

export type AppRouter = typeof appRouter;
