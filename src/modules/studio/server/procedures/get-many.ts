import { db } from "@/db";
import { videos } from "@/db/schema";
import { protectedProcedure } from "@/trpc/init";
import { and, eq, or, lt, desc } from "drizzle-orm";
import { z } from "zod";

export const getMany = protectedProcedure
  .input(
    z.object({
      cursor: z
        .object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
      limit: z.number().min(1).max(100),
    })
  )
  .query(async ({ ctx, input }) => {
    const { cursor, limit } = input;

    const data = await db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.userId, ctx.user.id),
          cursor
            ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(
                  eq(videos.updatedAt, cursor.updatedAt),
                  lt(videos.id, cursor.id)
                )
              )
            : undefined
        )
      )
      .orderBy(desc(videos.updatedAt), desc(videos.id))
      // ADD 1 TO THE LIMIT TO CHECK IF THERE IS MORE DATA
      .limit(limit + 1);

    const hasMore = data.length > limit;
    // REMOVE THE LAST ITEM IF THERE IS MORE DATA
    const items = hasMore ? data.slice(0, -1) : data;
    const lastItem = items[items.length - 1];
    const nextCursor = hasMore
      ? {
          id: lastItem.id,
          updatedAt: lastItem.updatedAt,
        }
      : null;

    return {
      items,
      nextCursor,
    };
  });
