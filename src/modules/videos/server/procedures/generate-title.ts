import { workflow } from "@/lib/workflow";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const generateTitle = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const { id: videoId } = input;

    const {
      user: { id: userId },
    } = ctx;

    const { workflowRunId } = await workflow.trigger({
      url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
      body: {
        videoId,
        userId,
      },
    });

    if (!workflowRunId) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    return workflowRunId;
  });
