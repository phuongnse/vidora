import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { VideosGetOneOutput } from "../../types";
import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface VideoReactionsProps {
  id: string;
  likes: number;
  dislikes: number;
  userReaction: VideosGetOneOutput["userReaction"];
}

export const VideoReactions = ({
  id,
  likes,
  dislikes,
  userReaction,
}: VideoReactionsProps) => {
  const utils = trpc.useUtils();
  const clerk = useClerk();

  const like = trpc.videos.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id });
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      } else {
        toast.error("Something went wrong.");
      }
    },
  });

  const dislike = trpc.videos.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id });
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      } else {
        toast.error("Something went wrong.");
      }
    },
  });

  return (
    <div className="flex items-center flex-none">
      <Button
        variant="secondary"
        className="rounded-l-full rounded-r-none gap-2 pr-4"
        disabled={like.isPending || dislike.isPending}
        onClick={() => {
          like.mutate({ videoId: id });
        }}
      >
        <ThumbsUpIcon
          className={cn("size-5", userReaction === "like" && "fill-black")}
        />
        {likes}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        variant="secondary"
        className="rounded-l-none rounded-r-full pl-3"
        disabled={dislike.isPending || like.isPending}
        onClick={() => {
          dislike.mutate({ videoId: id });
        }}
      >
        <ThumbsDownIcon
          className={cn("size-5", userReaction === "dislike" && "fill-black")}
        />
        {dislikes}
      </Button>
    </div>
  );
};
