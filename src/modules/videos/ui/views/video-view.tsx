import { CommentsSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggestions-section";
import { VideoSection } from "../sections/video-section";

interface VideoViewProps {
  id: string;
}

export const VideoView = ({ id }: VideoViewProps) => {
  return (
    <div className="flex flex-col max-w-[1700px] mx-auto pt-2.5 px-4 mb-10">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <VideoSection id={id} />
          <div className="xl:hidden block mt-4">
            <SuggestionsSection />
          </div>
          <CommentsSection />
        </div>
        <div className="hidden xl:block w-full xl:w-[380px] 2xl:w-[460px] shrink-0">
          <SuggestionsSection />
        </div>
      </div>
    </div>
  );
};
