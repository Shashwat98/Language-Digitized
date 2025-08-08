import { useParams, Link } from "react-router-dom";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm opacity-80 hover:opacity-100">← Back</Link>
          <h1 className="text-lg font-semibold">Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-1.5 text-sm">Import Image</button>
          <button className="rounded border px-3 py-1.5 text-sm">Save</button>
          <button className="rounded border px-3 py-1.5 text-sm">Export</button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[16rem_1fr]">
        {/* Left toolbar / layers */}
        <aside className="border-r p-3 space-y-3">
          <section>
            <h2 className="text-sm font-medium mb-2">Tools</h2>
            <div className="flex flex-wrap gap-2">
              <button className="rounded border px-2 py-1 text-sm">Pen</button>
              <button className="rounded border px-2 py-1 text-sm">Eraser</button>
              <button className="rounded border px-2 py-1 text-sm">Undo</button>
              <button className="rounded border px-2 py-1 text-sm">Redo</button>
              <button className="rounded border px-2 py-1 text-sm">Zoom +</button>
              <button className="rounded border px-2 py-1 text-sm">Zoom −</button>
            </div>
          </section>
          <section>
            <h2 className="text-sm font-medium mb-2">Layers</h2>
            <div className="space-y-1 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Image</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Vector</span>
              </label>
            </div>
          </section>
          <section>
            <h2 className="text-sm font-medium mb-2">Info</h2>
            <div className="text-xs opacity-70">ID: {id}</div>
          </section>
        </aside>

        {/* Canvas stage placeholder (Konva later) */}
        <section className="relative bg-[conic-gradient(at_top_left,_#fafafa,_#f6f6f6)]">
          <div className="absolute inset-4 rounded-xl border-dashed border flex items-center justify-center">
            <span className="text-sm opacity-60">
              Canvas goes here (Konva). Image import & crop next.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
