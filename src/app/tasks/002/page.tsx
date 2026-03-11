"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Play } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";

export default function Room002Page() {
    const router = useRouter();
    const updateRoomStatus = useRoomStore((state) => state.updateRoomStatus);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleStartCleaning = () => {
        setShowSuccess(true);
        // Wait 1.5 seconds to show the success message, then update and navigate
        setTimeout(() => {
            updateRoomStatus("002", "cleaning");
            router.push("/");
        }, 1500);
    };

    return (
        <div className="bg-[#fdfdfd] min-h-screen pb-32">
            {/* Top App Bar */}
            <div className="bg-[#fdfdfd] sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center text-black active:opacity-50 transition-opacity -ml-2">
                    <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
                </Link>
                <span className="font-bold text-black text-lg tracking-tight">
                    Room 002
                </span>
                <div className="w-8"></div> {/* Spacer for center alignment */}
            </div>

            <div className="px-6 pt-12 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-gray-200 text-gray-600 p-4 rounded-3xl mb-8">
                    <Play className="w-12 h-12 mx-auto" strokeWidth={2} fill="currentColor" />
                </div>
                
                <h2 className="text-2xl font-bold text-black mb-4 tracking-tight text-center">清掃の開始</h2>
                <p className="text-gray-500 font-medium text-center leading-relaxed mb-12">
                    Room 002 の清掃を開始しますか？<br />
                    開始するとステータスが「清掃中」になります。
                </p>

                <button
                    onClick={handleStartCleaning}
                    className="w-full max-w-sm font-bold py-4 rounded-[24px] transition-all flex justify-center items-center gap-2 text-lg tracking-tight bg-[#5b8ab5] text-white active:bg-[#4a7298] shadow-xl shadow-[#5b8ab5]/20"
                >
                    <Play className="w-5 h-5" fill="currentColor" />
                    清掃開始
                </button>

                {/* Success Message Overlay */}
                {showSuccess && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6 transition-opacity">
                        <div className="bg-white rounded-[32px] p-8 w-full max-w-[320px] text-center shadow-2xl">
                            <div className="w-16 h-16 bg-[#e6f0fa] rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-8 h-8 text-[#5b8ab5]" strokeWidth={3} />
                            </div>
                            <h3 className="text-xl font-bold text-black mb-3 tracking-tight">作業開始</h3>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                ステータスを「清掃中」に<br />変更しました
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
