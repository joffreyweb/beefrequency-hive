import ElixirLibraryManager from "@/components/admin/ElixirLibraryManager";

export default function ElixirLibraryPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Bibliothèque élixirs
      </h1>
      <ElixirLibraryManager />
    </div>
  );
}
