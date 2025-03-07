import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { AuthButton } from "@/modules/auth/ui/components/auth-button";
import { VideoUploadModal } from "./video-uploader/video-upload-modal";

export const StudioNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center px-2 py-5 z-50 border-b shadow-md">
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center flex-shrink-0">
          <SidebarTrigger />
          <Link href="/studio">
            <div className="flex items-center p-4 gap-1">
              <p className="text-xl font-semibold tracking-tight">Studio</p>
            </div>
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex flex-shrink-0 items-center gap-4">
          <VideoUploadModal />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
