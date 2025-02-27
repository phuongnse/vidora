import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({ videoId: z.string().uuid() }))
    .middleware(async ({ input }) => {
      const { userId: clerkId } = await auth();

      if (!clerkId) {
        throw new UploadThingError("Unauthorized");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId));

      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      const { id: userId } = user;
      const { videoId } = input;

      const [video] = await db
        .select({
          thumbnailKey: videos.thumbnailKey,
        })
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

      if (!video) {
        throw new UploadThingError("Bad request");
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

      return { user, ...input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const {
        user: { id: userId },
        videoId,
      } = metadata;

      const { ufsUrl, key } = file;

      await db
        .update(videos)
        .set({
          thumbnailUrl: ufsUrl,
          thumbnailKey: key,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

      return { uploadedBy: userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
