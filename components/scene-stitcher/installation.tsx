export function Installation() {
  return (
    <section id="installation" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance font-serif text-3xl font-bold uppercase tracking-widest text-foreground sm:text-4xl">
            Installation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-primary">
            Install Scene Stitcher like any other Foundry VTT module.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-8">
          {/* Method 1 */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground">Manual Installation</h3>
            </div>
            <ol className="ml-11 list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                Download or clone the{" "}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-accent">
                  scene-stitcher
                </code>{" "}
                folder from this project.
              </li>
              <li>
                Place it in your Foundry VTT{" "}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-accent">
                  Data/modules/
                </code>{" "}
                directory.
              </li>
              <li>
                Restart Foundry VTT or refresh the browser.
              </li>
              <li>
                Go to <strong className="text-foreground">Settings &rarr; Manage Modules</strong> and enable{" "}
                <strong className="text-foreground">Scene Stitcher</strong>.
              </li>
            </ol>
          </div>

          {/* Method 2 */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground">Using the Module</h3>
            </div>
            <ol className="ml-11 list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                Open the <strong className="text-foreground">Scene Controls</strong> toolbar on the left side of the Foundry canvas.
              </li>
              <li>
                Click the{" "}
                <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-accent">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/></svg>
                  Scene Stitcher
                </span>{" "}
                button.
              </li>
              <li>
                Select 2 or more scenes, arrange them on the layout canvas, then click{" "}
                <strong className="text-foreground">Merge Scenes</strong>.
              </li>
            </ol>
          </div>

          {/* Compatibility info */}
          <div className="rounded-lg border border-border bg-secondary/50 p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Compatibility
            </h3>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Foundry VTT:</span>
                <span className="font-medium text-foreground">v13+</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Game System:</span>
                <span className="font-medium text-foreground">D&D 5e</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Permissions:</span>
                <span className="font-medium text-foreground">GM only</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Dependencies:</span>
                <span className="font-medium text-foreground">None</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
