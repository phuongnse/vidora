import { db } from "@/db";
import { users, videos, views } from "@/db/schema";
import { baseProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";

export const getOne = baseProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input }) => {
    const { id } = input;

    const [video] = await db
      .select({
        ...getTableColumns(videos),
        user: {
          ...getTableColumns(users),
        },
        views: db.$count(views, eq(views.videoId, id)),
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.id, id));

    if (!video) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return video;
  });
