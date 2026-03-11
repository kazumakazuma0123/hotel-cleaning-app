import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

export default function TasksIndex() {
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
                    <p className="text-3xl font-bold text-black mb-1">2</p>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Remaining</p>
                </div>
                <div className="flex-1 bg-[#f2f2f2] p-5 rounded-[28px]">
                    <p className="text-3xl font-bold text-black mb-1">1</p>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Done</p>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                
                {/* In Progress Task */}
                <Link href="/tasks/001" className="block bg-[#f2f2f2] rounded-[32px] p-6 active:bg-gray-200 transition-colors">
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
                    
                    <h3 className="text-4xl font-bold tracking-tighter text-black mb-2">Room 001</h3>
                    <p className="text-sm font-medium text-gray-500 mb-6">Checkout · Early In (13:00)</p>

                    <div className="flex items-center justify-between mt-auto">
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                            <span className="text-sm font-bold text-black">Working...</span>
                        </div>
                        <span className="text-sm font-bold text-gray-400">45%</span>
                    </div>
                </Link>

                {/* To Do Task */}
                <div className="bg-[#f2f2f2] rounded-[32px] p-6 opacity-70">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="inline-block bg-white/50 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wide">
                                TO DO
                            </span>
                        </div>
                        <span className="text-xs font-bold text-gray-500 tracking-wider">
                            STANDARD
                        </span>
                    </div>
                    
                    <h3 className="text-4xl font-bold tracking-tighter text-black mb-2">Room 002</h3>
                    <p className="text-sm font-medium text-gray-500 mb-6">Checkout</p>

                    <button className="w-full text-center bg-white text-black font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                        <Circle className="w-5 h-5 text-gray-300" />
                        Start Cleaning
                    </button>
                </div>

                {/* Done Task */}
                <div className="bg-[#f9f9f9] rounded-[32px] p-6">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="inline-block bg-[#e8efe9] text-[#6d8a74] text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wide">
                                DONE
                            </span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 tracking-wider">
                            SUITE
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-4xl font-bold tracking-tighter text-gray-400 mb-1">Room 005</h3>
                            <p className="text-sm font-medium text-gray-400">Completed at 11:30</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-[#8fa996]" />
                    </div>
                </div>

            </div>
        </div>
    );
}
