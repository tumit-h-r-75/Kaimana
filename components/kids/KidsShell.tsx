"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import ui from "./kidsUi.module.css";

/** Shared authenticated frame for the learning catalogue and lesson screens. */
export function KidsShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <SiteHeader />
      <main className={ui.shell}>
        <div className={ui.container}>{children}</div>
      </main>
      <SiteFooter />
    </ProtectedRoute>
  );
}
