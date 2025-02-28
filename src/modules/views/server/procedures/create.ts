import { db } from "@/db";
import { views } from "@/db/schema";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const create = protectedProcedure
  .input(z.object({ videoId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const {
      user: { id: userId },
    } = ctx;

    const { videoId } = input;

    const [view] = await db
      .select()
      .from(views)
      .where(and(eq(views.videoId, videoId), eq(views.userId, userId)));

    if (view) {
      throw new TRPCError({ code: "CONFLICT" });
    }

    await db.insert(views).values({ userId, videoId });
  });
