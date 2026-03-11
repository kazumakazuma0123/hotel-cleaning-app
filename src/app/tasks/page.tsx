"use client";

import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useRoomStore } from "@/store/useRoomStore";

export default function TasksIndex() {
    const rooms = useRoomStore((state) => state.rooms);

    const remainingCount = rooms.filter(r => r.status === "before-cleaning" || r.status === "cleaning" || r.status === "occupied").length;
    const doneCount = rooms.filter(r => r.status === "cleaned").length;

    // Helper to get progress visually based on status
    const getProgressStatus = (status: string) => {
        if (status === "cleaned") return 100;
        if (status === "cleaning") return 45; // Mock progress for cleaning
        return 0;
    };

    return (
        <div className="p-6 safe-top pb-24 min-h-screen bg-[#fdfdfd]">
            <header className="mb-10 pt-4">
                <p className="text-sm font-medium text-gray-400 mb-1 tracking-wider">TODAY'S</p>
                <h1 className="text-3xl font-bold tracking-tight text-black leading-tight">
                    Tasks
                </h1>
            </header>

            {/* Stats Summary Bento style */}
            <div className="flex gap-4 mb-10">
                <div className="flex-1 bg-[#f2f2f2] p-5 rounded-[28px]">
                    <p className="text-3xl font-bold text-black mb-1">{remainingCount}</p>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Remaining</p>
                </div>
                <div className="flex-1 bg-[#f2f2f2] p-5 rounded-[28px]">
                    <p className="text-3xl font-bold text-black mb-1">{doneCount}</p>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Done</p>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {rooms.map(room => {
                    const isDone = room.status === "cleaned";
                    const isWorking = room.status === "cleaning";
                    const progress = getProgressStatus(room.status);

                    if (isDone) {
                        return (
                            <Link href={`/tasks/${room.id}`} key={room.id} className="block bg-[#f9f9f9] rounded-[32px] p-6 active:bg-gray-100 transition-colors">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <span className="inline-block bg-[#e8efe9] text-[#6d8a74] text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wide">
                                            DONE
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 tracking-wider">
                                        STANDARD
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-4xl font-bold tracking-tighter text-gray-400 mb-1">Room {room.id}</h3>
                                        <p className="text-sm font-medium text-gray-400">Completed at 11:30</p>
                                    </div>
                                    <CheckCircle2 className="w-8 h-8 text-[#8fa996]" />
                                </div>
                            </Link>
                        );
                    }

                    if (isWorking) {
                        return (
                            <Link href={`/tasks/${room.id}`} key={room.id} className="block bg-[#f2f2f2] rounded-[32px] p-6 active:bg-gray-200 transition-colors">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <span className="inline-block bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wide">
                                            IN PROGRESS
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 tracking-wider">
                                        STANDARD
                                    </span>
                                </div>
                                
                                <h3 className="text-4xl font-bold tracking-tighter text-black mb-2">Room {room.id}</h3>
                                <p className="text-sm font-medium text-gray-500 mb-6">Checkout {room.checkIn ? `· Early In (${room.checkIn})` : ''}</p>

                                <div className="flex items-center justify-between mt-auto">
                                     <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                                        <span className="text-sm font-bold text-black">Working...</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-400">{progress}%</span>
                                </div>
                            </Link>
                        );
                    }

                    // To Do / Occupied
                    return (
                        <div key={room.id} className="bg-[#f2f2f2] rounded-[32px] p-6 opacity-70">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="inline-block bg-white/50 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wide uppercase">
                                        {room.status === "occupied" ? "OCCUPIED" : "TO DO"}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-gray-500 tracking-wider">
                                    STANDARD
                                </span>
                            </div>
                            
                            <h3 className="text-4xl font-bold tracking-tighter text-black mb-2">Room {room.id}</h3>
                            <p className="text-sm font-medium text-gray-500 mb-6">Checkout</p>

                            <Link href={`/tasks/${room.id}`} className="w-full text-center bg-white text-black font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                                <Circle className="w-5 h-5 text-gray-300" />
                                Start Cleaning
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
