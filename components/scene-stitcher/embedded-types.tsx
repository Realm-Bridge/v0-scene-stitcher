const documentTypes = [
  { name: "Wall", fields: "c [x1, y1, x2, y2]", description: "Walls and doors defining room boundaries and line-of-sight" },
  { name: "AmbientLight", fields: "x, y", description: "Light sources with radius, colour, and animation" },
  { name: "AmbientSound", fields: "x, y", description: "Ambient sound emitters with radius and volume" },
  { name: "Token", fields: "x, y", description: "Character and NPC tokens with all associated data" },
  { name: "Tile", fields: "x, y", description: "Image and video tiles (existing, plus new background tiles)" },
  { name: "Drawing", fields: "x, y + shape.points", description: "Freehand drawings, shapes, and text overlays" },
  { name: "Note", fields: "x, y", description: "Map pins and journal entry links" },
  { name: "MeasuredTemplate", fields: "x, y", description: "Spell templates and area-of-effect indicators" },
  { name: "Region", fields: "shapes[].points", description: "Scene regions with behaviour triggers (v13 feature)" },
]

export function EmbeddedTypes() {
  return (
    <section id="embedded-types" className="border-b border-border py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance font-serif text-3xl font-bold uppercase tracking-widest text-foreground sm:text-4xl">
            Embedded Documents
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-primary">
            Every embedded document type in Foundry VTT v13 is handled. Coordinates are
            offset to their correct position in the merged scene.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-4 py-3 font-semibold text-foreground">Document Type</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Offset Fields</th>
                  <th className="hidden px-4 py-3 font-semibold text-foreground sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {documentTypes.map((doc, i) => (
                  <tr
                    key={doc.name}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? "bg-card" : "bg-background"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono font-medium text-accent">
                        {doc.name}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-muted-foreground">{doc.fields}</code>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {doc.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
