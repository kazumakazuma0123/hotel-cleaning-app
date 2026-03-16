"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle2, Trash2, Plus, X, ImagePlus, GripVertical } from "lucide-react";
import Image from "next/image";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabase";

type Task = {
    id: string;
    title: string;
    status: string;
    image_url?: string | null;
    sort_order: number;
};

function SortableTaskCard({
    task,
    onToggle,
    onSelect,
}: {
    task: Task;
    onToggle: (id: string) => void;
    onSelect: (task: Task) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.85 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3 cursor-pointer ${isDragging ? "shadow-xl scale-[1.02]" : ""}`}
            onClick={() => onSelect(task)}
        >
            {/* Status Icon */}
            <div
                className="shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(task.id);
                }}
            >
                {task.status === "completed" ? (
                    <div className="w-8 h-8 rounded-full bg-[#f0f5f1] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[#6d8a74]" strokeWidth={2.5} />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center" />
                )}
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-[15px] leading-snug ${task.status === "completed" ? "text-gray-400 line-through" : "text-[#222]"}`}>
                    {task.title}
                </h3>
            </div>

            {/* Image Thumbnail */}
            {task.image_url && (
                <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden relative">
                    <Image
                        src={task.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                    />
                </div>
            )}

            {/* Drag Handle (right side) */}
            <div
                className="shrink-0 touch-none cursor-grab active:cursor-grabbing text-gray-300"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="w-5 h-5" strokeWidth={1.5} />
            </div>
        </div>
    );
}

export default function TasksIndex() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskImage, setNewTaskImage] = useState<string | null>(null);
    const [newTaskImageFile, setNewTaskImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    // Initial fetch
    const fetchTasks = useCallback(async () => {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {
            console.error("Failed to fetch tasks:", error.message);
        } else {
            setTasks(data as Task[]);
        }
        setLoading(false);
    }, []);

    // Incremental update handler
    const handleRealtimeChange = useCallback((payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        setTasks((currentTasks) => {
            switch (eventType) {
                case "INSERT":
                    // Avoid duplicate if we just created it locally
                    if (currentTasks.some(t => t.id === newRecord.id)) return currentTasks;
                    return [...currentTasks, newRecord as Task].sort((a, b) => a.sort_order - b.sort_order);
                case "UPDATE":
                    return currentTasks.map((t) => (t.id === newRecord.id ? { ...t, ...newRecord } : t));
                case "DELETE":
                    return currentTasks.filter((t) => t.id !== oldRecord.id);
                default:
                    return currentTasks;
            }
        });
    }, []);

    useEffect(() => {
        fetchTasks();

        const channel = supabase
            .channel("tasks-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks" },
                (payload) => {
                    handleRealtimeChange(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTasks, handleRealtimeChange]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = tasks.findIndex((t) => t.id === active.id);
        const newIndex = tasks.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(tasks, oldIndex, newIndex);

        // Optimistic update
        setTasks(reordered);

        // Optimized batch update using upsert
        const updates = reordered.map((task, index) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            image_url: task.image_url,
            sort_order: index,
        }));

        const { error } = await supabase.from("tasks").upsert(updates);
        if (error) {
            console.error("Failed to update sort order:", error.message);
            // Revert on error
            fetchTasks();
        }
    };

    const removeTask = async (id: string) => {
        if (selectedTask?.id === id) setSelectedTask(null);
        // Optimistic update
        setTasks((prev) => prev.filter((t) => t.id !== id));
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) {
            console.error("Failed to delete task:", error.message);
            fetchTasks();
        }
    };

    const toggleTask = async (id: string) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const newStatus = task.status === "completed" ? "pending" : "completed";

        if (selectedTask?.id === id) {
            setSelectedTask({ ...selectedTask, status: newStatus });
        }
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
        const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
        if (error) {
            console.error("Failed to toggle task:", error.message);
            fetchTasks();
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (selectedTask?.id === id) {
            setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
        }
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );
        const { error } = await supabase.from("tasks").update(updates).eq("id", id);
        if (error) {
            console.error("Failed to update task:", error.message);
            fetchTasks();
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const fileName = `${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
            .from("task-images")
            .upload(fileName, file);

        if (error) {
            console.error("Image upload failed:", error.message);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from("task-images")
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setNewTaskImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        setNewTaskImageFile(file);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl: string | null = null;
            if (newTaskImageFile) {
                imageUrl = await uploadImage(newTaskImageFile);
            }

            const { data, error } = await supabase.from("tasks").insert({
                title: newTaskTitle.trim(),
                status: "pending",
                sort_order: tasks.length,
                image_url: imageUrl,
            }).select().single();

            if (error) {
                console.error("Failed to add task:", error.message);
                alert("タスクの保存に失敗しました: " + error.message);
                return;
            }

            // The real-time subscription will handle the UI update if it works correctly,
            // but for a better UX with current setup, we can also update locally or rely on the hook.
            // Since we use handleRealtimeChange, it will be added when the postgres event arrives.
            
            setNewTaskTitle("");
            setNewTaskImage(null);
            setNewTaskImageFile(null);
            setIsAddingTask(false);
        } catch (err) {
            console.error("Error:", err);
            alert("タスクの保存に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAddForm = () => {
        setIsAddingTask(false);
        setNewTaskTitle("");
        setNewTaskImage(null);
        setNewTaskImageFile(null);
    };

    return (
        <div className="p-5 pb-24 min-h-screen bg-[#f7f7f7] pt-14">
            <header className="mb-8 pt-2">
                <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wider uppercase">Today&apos;s To Do</p>
                <h1 className="text-[28px] font-bold tracking-tight text-[#111]">
                    タスク一覧
                </h1>
            </header>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-[#111] rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                            {tasks.map((task) => (
                                <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    onToggle={toggleTask}
                                    onSelect={setSelectedTask}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {/* Add Task Card / Input */}
                    {isAddingTask ? (
                        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="タスクを入力"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-gray-300 transition-all mb-4"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddTask();
                                    if (e.key === "Escape") resetAddForm();
                                }}
                            />

                            {/* Image Preview */}
                            {newTaskImage && (
                                <div className="relative mb-4 rounded-xl overflow-hidden aspect-video">
                                    <Image src={newTaskImage} alt="preview" fill className="object-cover" />
                                    <button
                                        onClick={() => {
                                            setNewTaskImage(null);
                                            setNewTaskImageFile(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                                    >
                                        <X className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 bg-gray-100 rounded-xl text-gray-500 active:bg-gray-200 transition-colors"
                                >
                                    <ImagePlus className="w-5 h-5" strokeWidth={2} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={resetAddForm}
                                        className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl active:bg-gray-200 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleAddTask}
                                        disabled={!newTaskTitle.trim() || isSubmitting}
                                        className="px-4 py-2 text-sm font-bold text-white bg-[#111] rounded-xl active:bg-gray-800 disabled:opacity-50 disabled:active:bg-[#111] transition-colors"
                                    >
                                        {isSubmitting ? "保存中..." : "追加"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsAddingTask(true)}
                            className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-4 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer hover:bg-white"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-gray-500" strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-[15px] text-gray-500 tracking-wide">
                                タスクを追加
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Task Details Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 transition-opacity"
                    onClick={() => setSelectedTask(null)}
                >
                    <div
                        className="bg-white rounded-[28px] w-full max-w-md p-6 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 pr-4">
                                <input
                                    type="text"
                                    value={selectedTask.title}
                                    onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                                    className="w-full text-xl font-bold text-[#111] leading-tight bg-transparent border-b border-transparent focus:border-gray-300 outline-none transition-colors py-1"
                                />
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-[#111] active:bg-gray-200 transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Image */}
                        {selectedTask.image_url && (
                            <div className="mb-6 rounded-2xl overflow-hidden relative aspect-video">
                                <Image
                                    src={selectedTask.image_url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3 mt-4">
                            <button
                                onClick={() => toggleTask(selectedTask.id)}
                                className={`w-full py-[18px] rounded-[20px] font-bold text-[15px] flex items-center justify-center gap-2 transition-colors ${selectedTask.status === "completed" ? "bg-gray-100 text-gray-500 active:bg-gray-200" : "bg-[#111] text-white active:bg-gray-800"}`}
                            >
                                {selectedTask.status === "completed" ? (
                                    "未完了に戻す"
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        完了にする
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => removeTask(selectedTask.id)}
                                className="w-full py-[18px] bg-red-50 text-red-500 rounded-[20px] font-bold text-[15px] flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                                タスクを消去
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
