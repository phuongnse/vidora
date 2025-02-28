import { workflow } from "@/lib/workflow";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const generateThumbnail = protectedProcedure
  .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
  .mutation(async ({ ctx, input }) => {
    const { id: videoId, prompt } = input;

    const {
      user: { id: userId },
    } = ctx;

    const { workflowRunId } = await workflow.trigger({
      url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
      body: {
        videoId,
        userId,
        prompt,
      },
    });

    if (!workflowRunId) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    return workflowRunId;
  });
