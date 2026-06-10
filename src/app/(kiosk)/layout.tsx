export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-50">{children}</div>;
}
