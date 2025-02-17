import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add CLERK_SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  const eventType = evt.type;
  if (eventType === "user.created") {
    const { id, first_name, last_name, image_url } = evt.data;

    await db.insert(users).values({
      clerkId: id,
      name: `${first_name} ${last_name}`,
      imageUrl: image_url,
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    await db.delete(users).where(eq(users.clerkId, id!));
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name, image_url } = evt.data;

    await db
      .update(users)
      .set({
        name: `${first_name} ${last_name}`,
        imageUrl: image_url,
      })
      .where(eq(users.clerkId, id!));
  }

  return new Response("Webhook received", { status: 200 });
}
