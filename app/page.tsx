import { Hero } from "@/components/scene-stitcher/hero"
import { Workflow } from "@/components/scene-stitcher/workflow"
import { Features } from "@/components/scene-stitcher/features"
import { EmbeddedTypes } from "@/components/scene-stitcher/embedded-types"
import { Installation } from "@/components/scene-stitcher/installation"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
            </svg>
            <span className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">Scene Stitcher</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-accent">
              How It Works
            </a>
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-accent">
              Features
            </a>
            <a href="#embedded-types" className="text-sm text-muted-foreground transition-colors hover:text-accent">
              Documents
            </a>
            <a href="#installation" className="text-sm text-muted-foreground transition-colors hover:text-accent">
              Install
            </a>
          </div>
        </nav>
      </header>

      <Hero />
      <Workflow />
      <Features />
      <EmbeddedTypes />
      <Installation />

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Scene Stitcher is a system-agnostic Foundry VTT v13+ module. Not affiliated with Foundry Gaming, LLC.
          </p>
        </div>
      </footer>
    </main>
  )
}
