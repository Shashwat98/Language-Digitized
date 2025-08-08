import { Link, useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { useEffect } from "react";
import { useInscriptionStore } from "../state/useInscriptionStore";

export default function GalleryPage() {
  const navigate = useNavigate();
  const { inscriptions, list, loading } = useInscriptionStore();

  useEffect(() => {
    list();
  }, [list]);

  const onNew = () => {
    const id = nanoid();
    navigate(`/inscription/${id}`);
  };

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

      {loading && <div className="text-sm opacity-60">Loading…</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {inscriptions.map((item) => (
          <Link
            key={item.id}
            to={`/inscription/${item.id}`}
            className="aspect-square rounded-xl border flex items-center justify-center text-xs hover:shadow-sm"
            title={item.title || "Open inscription"}
          >
            {item.thumbPng ? (
              <img
                src={URL.createObjectURL(item.thumbPng)}
                alt={item.title || "Thumbnail"}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="opacity-60">No thumbnail</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
