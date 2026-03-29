import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TEPUY — Admin",
  description: "Panel de administración de residentes TEPUY.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
