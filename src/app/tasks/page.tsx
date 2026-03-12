"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronRight, Trash2, Plus } from "lucide-react";
import Link from "next/link";

export default function TasksIndex() {
    const [tasks, setTasks] = useState([
        { id: 1, title: "1階ロビーの清掃とゴミ回収", time: "10:00 - 11:00", status: "completed" },
        { id: 2, title: "各フロアの消耗品（リネン等）の補充", time: "11:00 - 12:00", status: "pending" },
        { id: 3, title: "共有トイレの点検と清掃", time: "13:00 - 14:00", status: "pending" },
    ]);
    const [activeDeleteId, setActiveDeleteId] = useState<number | null>(null);

    const removeTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
        setActiveDeleteId(null);
    };
    const toggleTask = (id: number) => {
        setTasks(tasks.map(task => 
            task.id === id 
                ? { ...task, status: task.status === "completed" ? "pending" : "completed" } 
                : task
        ));
    };

    return (
        <div className="p-5 pb-24 min-h-screen bg-[#f7f7f7] pt-14">
            <header className="mb-8 pt-2">
                <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wider uppercase">Today's To Do</p>
                <h1 className="text-[28px] font-bold tracking-tight text-[#111]">
                    タスク一覧
                </h1>
            </header>

            <div className="space-y-4">
                {tasks.map((task) => {
                    const isDeleteActive = activeDeleteId === task.id;

                    return (
                        <div 
                            key={task.id} 
                            className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform flex items-center gap-4 cursor-pointer"
                            onClick={() => setActiveDeleteId(isDeleteActive ? null : task.id)}
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
                            <div className="flex-1">
                                <h3 className={`font-semibold text-[15px] leading-snug mb-1.5 ${task.status === "completed" ? "text-gray-400 line-through" : "text-[#222]"}`}>
                                    {task.title}
                                </h3>
                                <p className="text-xs font-semibold text-gray-400 tracking-wide">
                                    {task.time}
                                </p>
                            </div>
                            
                            {/* Action Area (Chevron or Delete Button) */}
                            <div className="shrink-0">
                                {isDeleteActive ? (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTask(task.id);
                                        }}
                                        className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full active:bg-red-600 transition-colors shadow-sm"
                                    >
                                        タスクを消去
                                    </button>
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2} />
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Add Task Card */}
                <div 
                    className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-4 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer hover:bg-white"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-gray-500" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-[15px] text-gray-500 tracking-wide">
                        タスクを追加
                    </span>
                </div>
            </div>
        </div>
    );
}
