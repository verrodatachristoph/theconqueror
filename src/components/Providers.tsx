"use client";

import { MotionConfig } from "framer-motion";
import { ToastProvider } from "@/components/toast";

/** App-wide client providers: reduced-motion respect + toasts. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
