import { Pencil, Trash2, Plus } from "lucide-react";

export default function LevelList({
  levels,
  onEditLevel,
  onAddLesson,
  onEditLesson,
  onDelete,
}) {
  return (
    <div className="space-y-6">
      {levels.map((level) => {
        const lessons = (level.lesson || []).sort((a, b) => a.order - b.order);

        return (
          <div key={level.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-indigo-600">
                  {level.title}
                </h3>
                <p className="text-gray-500 text-sm">
                  {level.description || ""}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onAddLesson(level.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-600"
                >
                  <Plus className="w-4 h-4" /> Add Lesson
                </button>

                <button
                  onClick={() =>
                    onEditLevel({
                      id: level.id,
                      title: level.title,
                      description: level.description,
                      order: level.order,
                    })
                  }
                  className="text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>

                <button
                  onClick={() => onDelete("level", level.id)}
                  className="text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>

            {/* lessons table */}
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3">Lesson Title</th>
                  <th className="py-2 px-3">XP</th>
                  <th className="py-2 px-3">Gems</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {lessons.length ? (
                  lessons.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-2 px-3">{l.title}</td>
                      <td className="py-2 px-3">{l.xp_reward}</td>
                      <td className="py-2 px-3">{l.gem_reward}</td>

                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onEditLesson(level.id, l)}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => onDelete("lesson", l.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-3 text-gray-500">
                      No lessons yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
