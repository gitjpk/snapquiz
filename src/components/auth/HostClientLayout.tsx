"use client";

import { ReactNode } from "react";
import { SessionExpiryProvider } from "@/lib/auth/sessionExpiry";

interface HostClientLayoutProps {
  children: ReactNode;
}

export function HostClientLayout({ children }: HostClientLayoutProps) {
  return <SessionExpiryProvider>{children}</SessionExpiryProvider>;
}
