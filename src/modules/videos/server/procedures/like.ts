import { db } from "@/db";
import { reactions } from "@/db/schema";
import { protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const like = protectedProcedure
  .input(z.object({ videoId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const {
      user: { id: userId },
    } = ctx;

    const { videoId } = input;

    await db
      .insert(reactions)
      .values({ userId, videoId, type: "like" })
      .onConflictDoUpdate({
        target: [reactions.userId, reactions.videoId],
        set: {
          type: "like",
        },
      });
  });
