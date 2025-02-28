import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

interface InputType {
  videoId: string;
  userId: string;
  prompt: string;
}

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { videoId, userId, prompt } = input;

  const video = await context.run("get-video", async () => {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    return video;
  });

  if (!video) {
    throw new Error("Bad request.");
  }

  const { body } = await context.call<{ data: { url: string }[] }>(
    "generate-thumbnail",
    {
      url: "https://api.openai.com/v1/images/generations",
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: {
        prompt,
        n: 1,
        model: "dall-e-3",
        size: "1792x1024",
      },
    }
  );

  const [data] = body.data;
  const { url: thumbnailUrl } = data;

  if (!thumbnailUrl) {
    throw new Error("Bad request.");
  }

  const utApi = new UTApi();

  await context.run("cleanup-thumbnail", async () => {
    const { thumbnailKey } = video;

    if (!thumbnailKey) {
      return;
    }

    utApi.deleteFiles(thumbnailKey);

    await db
      .update(videos)
      .set({
        thumbnailKey: null,
        thumbnailUrl: null,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
  });

  const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
    const { data } = await utApi.uploadFilesFromUrl(thumbnailUrl);

    if (!data) {
      throw new Error("Internal server error");
    }

    return data;
  });

  await context.run("update-video", async () => {
    const { ufsUrl, key } = uploadedThumbnail;

    await db
      .update(videos)
      .set({
        thumbnailUrl: ufsUrl,
        thumbnailKey: key,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
  });
});
