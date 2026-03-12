"use client";

import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function TasksIndex() {
    const sampleTasks = [
        { id: 1, title: "1階ロビーの清掃とゴミ回収", time: "10:00 - 11:00", status: "completed" },
        { id: 2, title: "各フロアの消耗品（リネン等）の補充", time: "11:00 - 12:00", status: "pending" },
        { id: 3, title: "共有トイレの点検と清掃", time: "13:00 - 14:00", status: "pending" },
    ];

    return (
        <div className="p-5 pb-24 min-h-screen bg-[#f7f7f7] pt-14">
            <header className="mb-8 pt-2">
                <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wider uppercase">Today's To Do</p>
                <h1 className="text-[28px] font-bold tracking-tight text-[#111]">
                    タスク一覧
                </h1>
            </header>

            <div className="space-y-4">
                {sampleTasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform flex items-center gap-4 cursor-pointer"
                    >
                        {/* Status Icon */}
                        <div className="shrink-0">
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
                        
                        {/* Next arrow */}
                        <div className="shrink-0">
                            <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
