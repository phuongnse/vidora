"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer } from "../components/video-player";
import { VideoBanner } from "../components/video-banner";
import { VideoTopRow } from "../components/video-top-row";

interface VideoSectionProps {
  id: string;
}

const VideoSectionSuspense = ({ id }: VideoSectionProps) => {
  const [video] = trpc.videos.getOne.useSuspenseQuery({ id });
  const { muxStatus, muxPlaybackId, thumbnailUrl } = video;
  return (
    <>
      <div
        className={cn(
          "aspect-video bg-black rounded-xl overflow-hidden relative",
          muxStatus !== "ready" && "rounded-b-none"
        )}
      >
        <VideoPlayer
          autoPlay
          playbackId={muxPlaybackId}
          thumbnailUrl={thumbnailUrl}
          onPlay={() => {}}
        />
      </div>
      <VideoBanner status={muxStatus} />
      <VideoTopRow video={video} />
    </>
  );
};

export const VideoSection = ({ id }: VideoSectionProps) => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <VideoSectionSuspense id={id} />
      </ErrorBoundary>
    </Suspense>
  );
};
