"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/lib/supabase";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  emoji: string;
  color: string;
  tasks: Task[];
  onDelete: (id: string) => void;
}

export function KanbanColumn({
  id,
  title,
  emoji,
  color,
  tasks,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col rounded-xl p-3 min-h-[200px] transition-colors ${color} ${
        isOver ? "ring-2 ring-indigo-400" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <h2 className="font-semibold text-gray-700 text-sm">{title}</h2>
        <span className="ml-auto bg-white text-gray-500 text-xs rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-xs text-gray-400">ここにドロップ</p>
          </div>
        )}
      </div>
    </div>
  );
}
