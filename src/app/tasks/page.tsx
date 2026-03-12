"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Circle, ChevronRight, Trash2, Plus, X, ImagePlus } from "lucide-react";
import Link from "next/link";

type Task = {
    id: number;
    title: string;
    time: string;
    status: string;
    image?: string;
};

export default function TasksIndex() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, title: "1階ロビーの清掃とゴミ回収", time: "10:00 - 11:00", status: "completed" },
        { id: 2, title: "各フロアの消耗品（リネン等）の補充", time: "11:00 - 12:00", status: "pending" },
        { id: 3, title: "共有トイレの点検と清掃", time: "13:00 - 14:00", status: "pending" },
    ]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskImage, setNewTaskImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const removeTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
        if (selectedTask?.id === id) setSelectedTask(null);
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(task => 
            task.id === id 
                ? { ...task, status: task.status === "completed" ? "pending" : "completed" } 
                : task
        ));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setNewTaskImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        
        const newTask: Task = {
            id: Date.now(),
            title: newTaskTitle.trim(),
            time: "時間未定",
            status: "pending",
            ...(newTaskImage ? { image: newTaskImage } : {})
        };
        
        setTasks([...tasks, newTask]);
        setNewTaskTitle("");
        setNewTaskImage(null);
        setIsAddingTask(false);
    };

    const resetAddForm = () => {
        setIsAddingTask(false);
        setNewTaskTitle("");
        setNewTaskImage(null);
    };

    return (
        <div className="p-5 pb-24 min-h-screen bg-[#f7f7f7] pt-14">
            <header className="mb-8 pt-2">
                <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wider uppercase">Today&apos;s To Do</p>
                <h1 className="text-[28px] font-bold tracking-tight text-[#111]">
                    タスク一覧
                </h1>
            </header>

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform flex items-center gap-4 cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                    >
                        {/* Status Icon Area - Click to toggle completion */}
                        <div 
                            className="shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleTask(task.id);
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
                            <h3 className={`font-semibold text-[15px] leading-snug mb-1.5 ${task.status === "completed" ? "text-gray-400 line-through" : "text-[#222]"}`}>
                                {task.title}
                            </h3>
                            <p className="text-xs font-semibold text-gray-400 tracking-wide">
                                {task.time}
                            </p>
                        </div>

                        {/* Image Thumbnail */}
                        {task.image && (
                            <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden">
                                <img src={task.image} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        
                        {/* Action Area (Chevron) */}
                        <div className="shrink-0">
                            <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2} />
                        </div>
                    </div>
                ))}

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
                                if (e.key === 'Enter') handleAddTask();
                                if (e.key === 'Escape') resetAddForm();
                            }}
                        />

                        {/* Image Preview */}
                        {newTaskImage && (
                            <div className="relative mb-4 rounded-xl overflow-hidden">
                                <img src={newTaskImage} alt="preview" className="w-full max-h-48 object-cover rounded-xl" />
                                <button 
                                    onClick={() => setNewTaskImage(null)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            {/* Image Upload Button */}
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
                                    disabled={!newTaskTitle.trim()}
                                    className="px-4 py-2 text-sm font-bold text-white bg-[#111] rounded-xl active:bg-gray-800 disabled:opacity-50 disabled:active:bg-[#111] transition-colors"
                                >
                                    追加
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
                            <div className="pr-4">
                                <h2 className="text-xl font-bold text-[#111] mb-2 leading-tight">
                                    {selectedTask.title}
                                </h2>
                                <p className="text-sm font-semibold text-gray-500 tracking-wide">
                                    {selectedTask.time}
                                </p>
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
                                    setSelectedTask({ ...selectedTask, status: selectedTask.status === "completed" ? "pending" : "completed" });
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
