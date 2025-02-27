import { db } from "@/db";
import { videoUpdateSchema, videos } from "@/db/schema";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const update = protectedProcedure
  .input(videoUpdateSchema)
  .mutation(async ({ ctx, input }) => {
    const { id } = input;

    if (!id) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const {
      user: { id: userId },
    } = ctx;

    const [updatedVideo] = await db
      .update(videos)
      .set({
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        visibility: input.visibility,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();

    if (!updatedVideo) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    return updatedVideo;
  });
