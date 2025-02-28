import { createTRPCRouter } from "@/trpc/init";
import { create } from "./procedures/create";

export const viewsRouter = createTRPCRouter({
  create,
});
