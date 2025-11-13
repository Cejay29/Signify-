import { supabase } from "../lib/supabaseClient";

export default function ConfirmDeleteModal({ data, onClose, onDeleted }) {
  async function handleDelete() {
    const { type, id } = data;

    if (type === "lesson") {
      await supabase.from("lesson").delete().eq("id", id);
    }

    if (type === "level") {
      await supabase.from("lesson").delete().eq("level_id", id);
      await supabase.from("levels").delete().eq("id", id);
    }

    onClose();
    onDeleted();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-80 text-center shadow-lg">
        <h2 className="text-xl font-bold mb-3">
          Delete {data.type === "level" ? "Level" : "Lesson"}?
        </h2>

        <p className="text-gray-500 mb-6 text-sm">
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
