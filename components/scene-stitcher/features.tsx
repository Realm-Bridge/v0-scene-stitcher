import {
  Film,
  Layers,
  MousePointerClick,
  Shield,
  Maximize2,
  Magnet,
} from "lucide-react"

const features = [
  {
    title: "Video Background Support",
    description:
      "4K MP4 and WebM video backgrounds are referenced directly as Tiles -- never re-encoded. Static images (PNG, JPG, WebP) work the same way with zero quality loss.",
    icon: Film,
  },
  {
    title: "All Embedded Objects",
    description:
      "Walls, ambient lights, ambient sounds, tokens, tiles, drawings, notes, measured templates, and regions are all carried over with correctly offset coordinates.",
    icon: Layers,
  },
  {
    title: "Drag-and-Drop Layout",
    description:
      "An interactive canvas with zoom (10% to 400%), pan, and hover previews. Position your scene pieces exactly where they need to go.",
    icon: MousePointerClick,
  },
  {
    title: "Independent Axis Snap",
    description:
      "Toggle edge-snapping on X, Y, or both axes independently. Visual snap guides show alignment before you commit. Hold Shift to temporarily disable snapping.",
    icon: Magnet,
  },
  {
    title: "Non-Destructive",
    description:
      "Original scenes are never modified or deleted. The merge always creates a brand new scene. Background files are referenced in-place with no duplication.",
    icon: Shield,
  },
  {
    title: "Smart Previews",
    description:
      "Hover over any scene thumbnail for a larger preview popup. Fit-all button auto-zooms to see the entire layout. Scene dimensions and video badges help identification.",
    icon: Maximize2,
  },
]

export function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Features
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Built for the specific challenge of reassembling split maps in Foundry VTT.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <feature.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
