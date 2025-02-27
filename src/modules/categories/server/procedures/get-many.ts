import { db } from "@/db";
import { categories } from "@/db/schema";
import { baseProcedure } from "@/trpc/init";

export const getMany = baseProcedure.query(async () => {
  const data = await db.select().from(categories);

  return data;
});
