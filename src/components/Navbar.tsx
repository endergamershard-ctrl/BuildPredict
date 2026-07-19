export function Navbar({
  onOpenSettings,
}: {
  onOpenSettings?: () => void;
}) {
  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="font-mono text-lg tracking-[0.18em] text-accent">
            BUILDPREDICT
          </div>
          <span className="badge hidden sm:inline-flex">sys.builder</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <span className="hidden md:inline">OpenDB catalog · FPS + workloads</span>
          {onOpenSettings ? (
            <button type="button" className="btn-ghost" onClick={onOpenSettings}>
              Settings
            </button>
          ) : null}
          <a
            href="https://github.com/buildcores/buildcores-open-db"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent"
          >
            OpenDB
          </a>
        </nav>
      </div>
    </header>
  );
}
