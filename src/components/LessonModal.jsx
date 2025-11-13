import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LessonModal({ levelId, lesson, onClose, onSaved }) {
  const [title, setTitle] = useState(lesson?.title || "");
  const [content, setContent] = useState(lesson?.content || "");
  const [xpReward, setXpReward] = useState(lesson?.xp_reward || 0);
  const [gemReward, setGemReward] = useState(lesson?.gem_reward || 0);

  async function handleSubmit(e) {
    e.preventDefault();

    // If editing lesson → keep order
    if (lesson?.id) {
      await supabase
        .from("lesson")
        .update({
          title,
          content,
          xp_reward: xpReward,
          gem_reward: gemReward,
        })
        .eq("id", lesson.id);
    } else {
      // Insert → auto order
      const { data: lastLesson } = await supabase
        .from("lesson")
        .select("order")
        .eq("level_id", levelId)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = lastLesson?.order ? lastLesson.order + 1 : 1;

      await supabase.from("lesson").insert({
        title,
        content,
        xp_reward: xpReward,
        gem_reward: gemReward,
        level_id: levelId,
        order: nextOrder,
      });
    }

    onClose();
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[28rem]">
        <h3 className="text-xl font-bold mb-4">
          {lesson ? "Edit Lesson" : "Add Lesson"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border rounded p-2"
            value={title}
            placeholder="Lesson title"
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full border rounded p-2"
            rows="3"
            value={content}
            placeholder="Lesson content"
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            className="w-full border rounded p-2"
            value={xpReward}
            type="number"
            placeholder="XP Reward"
            onChange={(e) => setXpReward(Number(e.target.value))}
          />

          <input
            className="w-full border rounded p-2"
            value={gemReward}
            type="number"
            placeholder="Gem Reward"
            onChange={(e) => setGemReward(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
