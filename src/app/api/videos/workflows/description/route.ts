import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

interface InputType {
  videoId: string;
  userId: string;
}

const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`;

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { videoId, userId } = input;

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

  const transcript = await context.run("get-transcript", async () => {
    const { muxPlaybackId, muxTrackId } = video;

    const response = await fetch(
      `https://stream.mux.com/${muxPlaybackId}/text/${muxTrackId}.txt`
    );

    const transcript = response.text();

    if (!transcript) {
      throw new Error("Bad request.");
    }

    return transcript;
  });

  const { body } = await context.api.openai.call("generate-description", {
    token: process.env.OPENAI_API_KEY!,
    operation: "chat.completions.create",
    body: {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: DESCRIPTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    },
  });

  const [choice] = body.choices;

  const {
    message: { content: description },
  } = choice;

  if (!description) {
    throw new Error("Bad request.");
  }

  const updatedVideo = await context.run("update-video", async () => {
    const [updatedVideo] = await db
      .update(videos)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .returning();

    return updatedVideo;
  });

  if (!updatedVideo) {
    throw new Error("Internal server error.");
  }
});
