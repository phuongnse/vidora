import { createTRPCRouter } from "@/trpc/init";
import { getMany } from "./procedures/get-many";

export const categoriesRouter = createTRPCRouter({
  getMany,
});
