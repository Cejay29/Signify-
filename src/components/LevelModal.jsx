import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LevelModal({ level, onClose, onSaved }) {
  const [title, setTitle] = useState(level?.title || "");
  const [description, setDescription] = useState(level?.description || "");
  const [order, setOrder] = useState(level?.order || "");

  async function handleSubmit(e) {
    e.preventDefault();

    const data = { title, description, order: Number(order) || null };

    if (level?.id) {
      await supabase.from("levels").update(data).eq("id", level.id);
    } else {
      await supabase.from("levels").insert(data);
    }

    onClose();
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-4">
          {level ? "Edit Level" : "Add Level"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border rounded p-2"
            value={title}
            placeholder="Level title"
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full border rounded p-2"
            rows="2"
            value={description}
            placeholder="Description"
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="w-full border rounded p-2"
            value={order}
            placeholder="Order number"
            onChange={(e) => setOrder(e.target.value)}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>

            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
