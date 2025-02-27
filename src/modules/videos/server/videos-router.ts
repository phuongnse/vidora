import { createTRPCRouter } from "@/trpc/init";
import { create } from "./procedures/create";
import { update } from "./procedures/update";
import { remove } from "./procedures/remove";
import { restoreThumbnail } from "./procedures/restore-thumbnail";
import { generateTitle } from "./procedures/generate-title";
import { generateDescription } from "./procedures/generate-description";

export const videosRouter = createTRPCRouter({
  create,
  update,
  remove,
  restoreThumbnail,
  generateTitle,
  generateDescription,
});
