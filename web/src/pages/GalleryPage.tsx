import { Link, useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

export default function GalleryPage() {
  const navigate = useNavigate();

  const onNew = () => {
    const id = nanoid();
    navigate(`/inscription/${id}`);
  };

  // Placeholder static grid (Dexie integration later)
  const mock = Array.from({ length: 12 }).map((_, i) => ({
    id: `mock-${i}`,
    createdAt: Date.now() - i * 1000,
  }));

  return (
    <div className="min-h-dvh px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inscriptions</h1>
        <button
          onClick={onNew}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          New Inscription
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {mock.map((item) => (
          <Link
            key={item.id}
            to={`/inscription/${item.id}`}
            className="aspect-square rounded-xl border flex items-center justify-center text-xs hover:shadow-sm"
            title="Open inscription"
          >
            <span className="opacity-60">Thumbnail</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
