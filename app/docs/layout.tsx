import DocsSidebar from '@/components/layout/DocsSidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto flex max-w-7xl px-6">
        <DocsSidebar />
        <main className="flex-1 min-w-0 py-8 md:pl-12">{children}</main>
      </div>
    </div>
  );
}
