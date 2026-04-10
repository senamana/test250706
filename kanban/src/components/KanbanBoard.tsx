"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Link from "next/link";
import { getSupabase, Task, TaskStatus } from "@/lib/supabase";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { AddTaskModal } from "./AddTaskModal";

const COLUMNS: { id: TaskStatus; title: string; emoji: string; color: string }[] = [
  { id: "todo", title: "TODO", emoji: "📋", color: "bg-gray-100" },
  { id: "in_progress", title: "進行中", emoji: "🔄", color: "bg-blue-50" },
  { id: "done", title: "完了", emoji: "✅", color: "bg-green-50" },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("tasks")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setError("タスクの読み込みに失敗しました: " + error.message);
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();

    const sb = getSupabase();
    // リアルタイム更新
    const channel = sb
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [fetchTasks]);

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // ドロップ先がカラムIDの場合
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    if (isOverColumn && activeTask.status !== overId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overId as TaskStatus } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let newStatus = activeTask.status;
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    if (isOverColumn) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    // 同じカラム内の並び替え
    const columnTasks = tasks.filter((t) => t.status === newStatus);
    const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
    const newIndex = isOverColumn
      ? columnTasks.length
      : columnTasks.findIndex((t) => t.id === overId);

    let reordered = columnTasks;
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = arrayMove(columnTasks, oldIndex, newIndex);
    }

    // position を更新
    const updates = reordered.map((t, i) => ({
      id: t.id,
      status: newStatus,
      position: i,
    }));

    setTasks((prev) => {
      const merged = prev
        .map((t) => {
          const update = updates.find((u) => u.id === t.id);
          if (update) return { ...t, status: update.status, position: update.position };
          if (t.id === activeId) return { ...t, status: newStatus };
          return t;
        })
        .filter(Boolean);
      return merged as Task[];
    });

    const sb = getSupabase();
    // Supabase に保存
    for (const u of updates) {
      await sb
        .from("tasks")
        .update({ status: u.status, position: u.position })
        .eq("id", u.id);
    }
    if (!updates.find((u) => u.id === activeId)) {
      await sb
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", activeId);
    }
  };

  const handleAddTask = async (title: string, description: string) => {
    const { data, error } = await getSupabase()
      .from("tasks")
      .insert({ title, description, status: "todo", position: 0 })
      .select()
      .single();

    if (error) {
      setError("タスクの追加に失敗しました");
      return;
    }
    setTasks((prev) => [data as Task, ...prev]);
  };

  const handleDeleteTask = async (id: string) => {
    await getSupabase().from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">AI秘書 カンバン</h1>
            <p className="text-xs text-gray-400">{tasks.length} タスク</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/memos"
              className="text-sm text-indigo-500 hover:text-indigo-700 font-medium px-3 py-2"
            >
              メモ
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
            >
              + 追加
            </button>
          </div>
        </div>
      </header>

      {/* エラー */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        </div>
      )}

      {/* カンバンボード */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                emoji={col.emoji}
                color={col.color}
                tasks={getTasksByStatus(col.id)}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} onDelete={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* モーダル */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  );
}
