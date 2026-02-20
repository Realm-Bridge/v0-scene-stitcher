import { PuzzlePieceIcon } from "./icons"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
          <span className="text-xs font-medium tracking-wider uppercase text-primary">Foundry VTT v13+ Module</span>
        </div>

        <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Scene Stitcher
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Merge split map scenes back into a single unified scene. Preserves all walls, lights, tokens,
          and embedded objects with correctly offset coordinates. Supports 4K video backgrounds with zero quality loss.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#installation"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            How It Works
          </a>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="relative rounded-lg border border-border bg-card p-1 shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-chart-4/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
              <span className="ml-2 text-xs text-muted-foreground">Scene Stitcher</span>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-b-md bg-background">
              <WorkflowDiagram />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WorkflowDiagram() {
  return (
    <div className="flex h-full items-center justify-center gap-3 p-6 sm:gap-6 sm:p-10">
      {/* Scene A */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-20 items-center justify-center rounded border border-border bg-secondary text-xs font-medium text-muted-foreground sm:h-24 sm:w-28 sm:text-sm">
          Scene A
        </div>
      </div>

      {/* Plus */}
      <div className="text-lg font-bold text-muted-foreground sm:text-2xl">+</div>

      {/* Scene B */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-20 items-center justify-center rounded border border-border bg-secondary text-xs font-medium text-muted-foreground sm:h-24 sm:w-28 sm:text-sm">
          Scene B
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center text-primary">
        <svg width="32" height="16" viewBox="0 0 32 16" fill="none" className="sm:w-10">
          <path d="M0 8H28M28 8L22 2M28 8L22 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Merged */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-24 items-center justify-center rounded border-2 border-primary bg-primary/10 text-xs font-bold text-primary sm:h-24 sm:w-40 sm:text-sm">
          <PuzzlePieceIcon className="mr-1.5 h-4 w-4" />
          Merged
        </div>
      </div>
    </div>
  )
}
