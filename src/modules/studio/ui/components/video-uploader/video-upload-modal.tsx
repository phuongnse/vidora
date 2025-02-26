"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { VideoUploader } from ".";
import { useRouter } from "next/navigation";

export const VideoUploadModal = () => {
  const utils = trpc.useUtils();
  const router = useRouter();

  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
    },
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  const { isPending } = create;

  const onSuccess = () => {
    if (!create.data) {
      return;
    }

    create.reset();
    router.push(`/studio/videos/${create.data.video.id}`);
  };

  return (
    <>
      <ResponsiveModal
        open={!!create.data}
        title="Upload a video"
        onOpenChange={() => {
          create.reset();
        }}
      >
        {!create.data ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <VideoUploader endpoint={create.data.url} onSuccess={onSuccess} />
        )}
      </ResponsiveModal>
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() => create.mutate()}
      >
        {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Create
      </Button>
    </>
  );
};
