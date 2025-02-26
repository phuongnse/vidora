import { db } from "@/db";
import { videos, videoUpdateSchema } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const {
      user: { id: userId },
    } = ctx;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
      },
      cors_origin: "*",
    });

    const [video] = await db
      .insert(videos)
      .values({
        userId: userId,
        title: "Untitled",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning();

    return {
      url: upload.url,
      video,
    };
  }),
  update: protectedProcedure
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
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const {
        user: { id: userId },
      } = ctx;

      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, id), eq(videos.userId, userId)))
        .returning();

      if (!removedVideo) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return removedVideo;
    }),
  restoreThumbnail: protectedProcedure
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
        throw new TRPCError({ code: "NOT_FOUND" });
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
        })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return updatedVideo;
    }),
});
