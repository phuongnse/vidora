import { db } from "@/db";
import { reactions, users, videos, views } from "@/db/schema";
import { baseProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { z } from "zod";

export const getOne = baseProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    const { clerkId } = ctx;
    const { id: videoId } = input;

    const [user] = await db
      .select()
      .from(users)
      .where(inArray(users.clerkId, clerkId ? [clerkId] : []));

    const { id: userId } = user;

    const userReactions = db.$with("user_reactions").as(
      db
        .select({
          videoId: reactions.videoId,
          type: reactions.type,
        })
        .from(reactions)
        .where(inArray(reactions.userId, userId ? [userId] : []))
    );

    const [video] = await db
      .with(userReactions)
      .select({
        ...getTableColumns(videos),
        user: {
          ...getTableColumns(users),
        },
        views: db.$count(views, eq(views.videoId, videoId)),
        likes: db.$count(
          reactions,
          and(eq(reactions.videoId, videoId), eq(reactions.type, "like"))
        ),
        dislikes: db.$count(
          reactions,
          and(eq(reactions.videoId, videoId), eq(reactions.type, "dislike"))
        ),
        userReaction: userReactions.type,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .leftJoin(userReactions, eq(userReactions.videoId, videos.id))
      .where(eq(videos.id, videoId));

    if (!video) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return video;
  });
