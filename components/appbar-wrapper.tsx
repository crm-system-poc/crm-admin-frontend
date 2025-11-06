"use client";

import { usePathname } from "next/navigation";
import { AppBar } from "@/components/appbar";

export function AppBarWrapper() {
  const pathname = usePathname();

  // Pages where AppBar should NOT appear
  const hideOnRoutes = ["/login", "/signup"];

  if (hideOnRoutes.includes(pathname)) {
    return null; // 👈 Do not render AppBar
  }

  return <AppBar />;
}
