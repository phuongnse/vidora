import { ReactNode } from "react";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layout";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <HomeLayout>{children}</HomeLayout>;
}
