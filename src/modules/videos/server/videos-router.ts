import { createTRPCRouter } from "@/trpc/init";
import { create } from "./procedures/create";
import { update } from "./procedures/update";
import { remove } from "./procedures/remove";
import { restoreThumbnail } from "./procedures/restore-thumbnail";
import { generateTitle } from "./procedures/generate-title";
import { generateDescription } from "./procedures/generate-description";
import { generateThumbnail } from "./procedures/generate-thumbnail";
import { getOne } from "./procedures/get-one";
import { view } from "./procedures/view";
import { like } from "./procedures/like";
import { dislike } from "./procedures/dislike";

export const videosRouter = createTRPCRouter({
  create,
  update,
  remove,
  restoreThumbnail,
  generateTitle,
  generateDescription,
  generateThumbnail,
  getOne,
  view,
  like,
  dislike,
});
