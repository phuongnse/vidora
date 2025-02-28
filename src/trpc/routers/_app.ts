import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/modules/categories/server/categories-router";
import { studioRouter } from "@/modules/studio/server/studio-router";
import { videosRouter } from "@/modules/videos/server/videos-router";
import { viewsRouter } from "@/modules/views/server/views-router";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
  views: viewsRouter,
});

export type AppRouter = typeof appRouter;
