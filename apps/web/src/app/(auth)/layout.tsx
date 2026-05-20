/**
 * Layout for authentication pages.
 * Centers content vertically and horizontally with a subtle gradient background.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-brand-950">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
