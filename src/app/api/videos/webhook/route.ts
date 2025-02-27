import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetDeletedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
} from "@mux/mux-node/resources/webhooks.mjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const SECRET = process.env.MUX_WEBHOOK_SECRET;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

export const POST = async (request: Request) => {
  if (!SECRET) {
    throw new Error("MUX_WEBHOOK_SECRET is not set.");
  }

  const headersPayload = await headers();
  const muxSignature = headersPayload.get("mux-signature");

  if (!muxSignature) {
    return new Response("Missing mux signature.", { status: 401 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature,
    },
    SECRET
  );

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];
      const { upload_id: uploadId } = data;

      if (!uploadId) {
        return new Response("Missing upload id.", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
          updatedAt: new Date(),
        })
        .where(eq(videos.muxUploadId, uploadId));

      break;
    }
    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];
      const { upload_id: uploadId } = data;

      if (!uploadId) {
        return new Response("Missing upload id.", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          updatedAt: new Date(),
        })
        .where(eq(videos.muxUploadId, uploadId));

      break;
    }
    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];
      const { upload_id: uploadId, status, duration } = data;

      if (!uploadId) {
        return new Response("Missing upload id.", { status: 400 });
      }

      const playbackId = data.playback_ids?.[0].id;

      if (!playbackId) {
        return new Response("Missing playback id.", { status: 400 });
      }

      const utApi = new UTApi();

      const [uploadedThumbnail, uploadedPreview] =
        await utApi.uploadFilesFromUrl([
          `https://image.mux.com/${playbackId}/thumbnail.jpg`,
          `https://image.mux.com/${playbackId}/animated.gif`,
        ]);

      const { data: uploadedThumbnailData } = uploadedThumbnail;

      if (!uploadedThumbnailData) {
        return new Response("Failed to upload video thumbnail.", {
          status: 500,
        });
      }

      const { data: uploadedPreviewData } = uploadedPreview;

      if (!uploadedPreviewData) {
        return new Response("Failed to upload video preview.", { status: 500 });
      }

      const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadedThumbnailData;
      const { key: previewKey, ufsUrl: previewUrl } = uploadedPreviewData;

      await db
        .update(videos)
        .set({
          muxPlaybackId: playbackId,
          muxStatus: status,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration: duration ? Math.round(duration * 1000) : 0,
          updatedAt: new Date(),
        })
        .where(eq(videos.muxUploadId, uploadId));

      break;
    }
    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];
      const { upload_id: uploadId } = data;

      if (!uploadId) {
        return new Response("Missing upload id.", { status: 400 });
      }

      await db.delete(videos).where(eq(videos.muxUploadId, uploadId));
      break;
    }
    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string;
      };

      const { asset_id: assetId } = data;

      if (!assetId) {
        return new Response("Missing asset id.", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxTrackId: data.id,
          muxTrackStatus: data.status,
          updatedAt: new Date(),
        })
        .where(eq(videos.muxAssetId, assetId));

      break;
    }
  }

  return new Response("Webhook received.", { status: 200 });
};
