import { db } from "@/db";
import { videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const [video] = await db
      .insert(videos)
      .values({
        userId: ctx.user.id,
        title: "Untitled",
      })
      .returning();

    return {
      video,
    };
  }),
});
