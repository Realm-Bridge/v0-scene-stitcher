import { Search, Move, Merge, CheckCircle2 } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Select Scenes",
    description:
      "Browse all scenes in your world with a searchable, filterable list. Select the 2 or more scenes that were originally split from a single map. Scene dimensions, thumbnails, and video background indicators help you identify the right pieces.",
    icon: Search,
  },
  {
    number: "02",
    title: "Arrange on Canvas",
    description:
      "Drag scene thumbnails onto an interactive layout canvas to define how they fit together. Zoom in up to 400% to inspect fine detail. Independent snap controls on X and Y axes help align edges precisely, with visual snap guides for confirmation.",
    icon: Move,
  },
  {
    number: "03",
    title: "Merge",
    description:
      "Click merge to create a brand new scene. Each source scene's original background file (including 4K MP4 videos) is placed as a Tile at the correct position. All walls, lights, tokens, tiles, drawings, notes, sounds, and regions are carried over with offset coordinates.",
    icon: Merge,
  },
  {
    number: "04",
    title: "Done",
    description:
      "The merged scene opens automatically. Your original scenes remain completely untouched. Background files are referenced in-place with zero quality loss and no storage duplication.",
    icon: CheckCircle2,
  },
]

export function Workflow() {
  return (
    <section id="how-it-works" className="border-b border-border py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            A streamlined four-step workflow to reassemble split maps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-accent/50"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">
                    Step {step.number}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
