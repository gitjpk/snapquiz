import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Quiz - SnapQuiz",
  description: "Enter a game PIN to join a live quiz",
};

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
