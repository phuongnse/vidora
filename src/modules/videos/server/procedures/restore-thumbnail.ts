import { db } from "@/db";
import { videos } from "@/db/schema";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const restoreThumbnail = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const { id: videoId } = input;

    const {
      user: { id: userId },
    } = ctx;

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!video) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const { muxPlaybackId } = video;

    if (!muxPlaybackId) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const { thumbnailKey } = video;

    if (thumbnailKey) {
      const utApi = new UTApi();

      await utApi.deleteFiles(thumbnailKey);

      await db
        .update(videos)
        .set({
          thumbnailUrl: null,
          thumbnailKey: null,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    }

    const utApi = new UTApi();

    const uploadedThumbnail = await utApi.uploadFilesFromUrl(
      `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg`
    );

    const { data: uploadedThumbnailData } = uploadedThumbnail;

    if (!uploadedThumbnailData) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    const { key: uploadedThumbnailKey, ufsUrl: uploadedThumbnailUrl } =
      uploadedThumbnailData;

    const [updatedVideo] = await db
      .update(videos)
      .set({
        thumbnailUrl: uploadedThumbnailUrl,
        thumbnailKey: uploadedThumbnailKey,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .returning();

    if (!updatedVideo) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    return updatedVideo;
  });
