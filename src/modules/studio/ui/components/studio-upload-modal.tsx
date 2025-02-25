"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { StudioUploader } from "./studio-uploader";

export const StudioUploadModal = () => {
  const utils = trpc.useUtils();
  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
    },
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  const { isPending } = create;

  return (
    <>
      <ResponsiveModal
        open={!!create.data}
        title="Upload a video"
        onOpenChange={() => {
          create.reset();
        }}
      >
        <StudioUploader />
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
