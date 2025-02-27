import { createTRPCRouter } from "@/trpc/init";
import { getMany } from "./procedures/get-many";
import { getOne } from "./procedures/get-one";

export const studioRouter = createTRPCRouter({
  getMany,
  getOne,
});
