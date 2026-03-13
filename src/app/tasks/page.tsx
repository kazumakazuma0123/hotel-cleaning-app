"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Trash2, Plus, X, ImagePlus, GripVertical } from "lucide-react";
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
import { db, storage } from "@/lib/firebaseConfig";
import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    writeBatch,
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";

type Task = {
    id: string;
    title: string;
    status: string;
    image?: string;
    order: number;
};

const TASKS_COLLECTION = "tasks";

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
            {task.image && (
                <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden">
                    <img src={task.image} alt="" className="w-full h-full object-cover" />
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

    // Real-time listener for Firestore
    useEffect(() => {
        const q = query(collection(db, TASKS_COLLECTION), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: Task[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Task[];
            setTasks(tasksData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = tasks.findIndex((t) => t.id === active.id);
        const newIndex = tasks.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(tasks, oldIndex, newIndex);

        // Optimistic update
        setTasks(reordered);

        // Batch update order in Firestore
        const batch = writeBatch(db);
        reordered.forEach((task, index) => {
            const taskRef = doc(db, TASKS_COLLECTION, task.id);
            batch.update(taskRef, { order: index });
        });
        await batch.commit();
    };

    const removeTask = async (id: string) => {
        if (selectedTask?.id === id) setSelectedTask(null);
        await deleteDoc(doc(db, TASKS_COLLECTION, id));
    };

    const toggleTask = async (id: string) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const newStatus = task.status === "completed" ? "pending" : "completed";

        // Update local selectedTask if open
        if (selectedTask?.id === id) {
            setSelectedTask({ ...selectedTask, status: newStatus });
        }

        await updateDoc(doc(db, TASKS_COLLECTION, id), { status: newStatus });
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (selectedTask?.id === id) {
            setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
        }
        await updateDoc(doc(db, TASKS_COLLECTION, id), updates);
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileName = `tasks/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Show local preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            setNewTaskImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        // Keep file reference for upload
        setNewTaskImageFile(file);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || isSubmitting) return;
        setIsSubmitting(true);

        const title = newTaskTitle.trim();
        const imageFile = newTaskImageFile;
        const currentOrder = tasks.length;

        // Close form immediately (optimistic)
        setNewTaskTitle("");
        setNewTaskImage(null);
        setNewTaskImageFile(null);
        setIsAddingTask(false);
        setIsSubmitting(false);

        try {
            let imageUrl: string | undefined;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            await addDoc(collection(db, TASKS_COLLECTION), {
                title,
                status: "pending",
                order: currentOrder,
                ...(imageUrl ? { image: imageUrl } : {}),
            });
        } catch (error) {
            console.error("Failed to add task:", error);
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
                                <div className="relative mb-4 rounded-xl overflow-hidden">
                                    <img src={newTaskImage} alt="preview" className="w-full max-h-48 object-cover rounded-xl" />
                                    <button
                                        onClick={() => {
                                            setNewTaskImage(null);
                                            setNewTaskImageFile(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
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
                        {selectedTask.image && (
                            <div className="mb-6 rounded-2xl overflow-hidden">
                                <img src={selectedTask.image} alt="" className="w-full max-h-56 object-cover" />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3 mt-4">
                            <button
                                onClick={() => {
                                    toggleTask(selectedTask.id);
                                }}
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
