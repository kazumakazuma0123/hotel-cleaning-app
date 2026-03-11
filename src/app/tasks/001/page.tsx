"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, AlertCircle } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";

type CheckItem = {
    id: string;
    label: string;
    checked: boolean;
};

export default function RoomChecklist() {
    const router = useRouter();
    const updateRoomStatus = useRoomStore((state) => state.updateRoomStatus);
    
    const [items, setItems] = useState<CheckItem[]>([
        { id: "c1", label: "窓を開けて換気を行い、ゴミをすべて回収した", checked: true },
        { id: "c2", label: "ベッドのシーツ・枕カバーをピンと張って交換した", checked: true },
        { id: "c3", label: "水回り（バス・トイレ）を清掃し、水滴を拭き取った", checked: false },
        { id: "c4", label: "タオル類と新しいアメニティを規定位置に配置した", checked: false },
        { id: "c5", label: "デスクやテレビ台を拭き掃除した", checked: false },
        { id: "c6", label: "部屋全体に掃除機をかけた（奥から手前へ）", checked: false },
    ]);

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const completedCount = items.filter(i => i.checked).length;
    const progressPercent = Math.round((completedCount / items.length) * 100);
    const [showSuccess, setShowSuccess] = useState(false);

    const isAllDone = completedCount === items.length;

    const handleComplete = () => {
        setShowSuccess(true);
        // Wait 1.5 seconds to show the success message, then update and navigate
        setTimeout(() => {
            updateRoomStatus("001", "cleaned");
            router.push("/");
        }, 1500);
    };

    return (
        <div className="bg-[#fdfdfd] min-h-screen pb-32">
            {/* Top App Bar */}
            <div className="bg-[#fdfdfd] sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
                <Link href="/tasks" className="flex items-center text-black active:opacity-50 transition-opacity -ml-2">
                    <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
                </Link>
                <span className="font-bold text-black text-lg tracking-tight">
                    Room 001
                </span>
                <div className="w-8"></div> {/* Spacer for center alignment */}
            </div>

            <div className="px-6 pt-4">
                
                 {/* Progress Stats */}
                 <div className="mb-10 flex items-end justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-400 tracking-wider mb-1">PROGRESS</p>
                        <p className="text-5xl font-bold tracking-tighter text-black">
                            {completedCount} <span className="text-xl font-medium text-gray-400">/ {items.length}</span>
                        </p>
                    </div>
                 </div>

                {/* Info Alert Bento */}
                <div className="bg-[#f2f2f2] rounded-[28px] p-6 mb-10 flex gap-4 items-start">
                    <div className="bg-black text-white p-2 rounded-full shrink-0">
                         <AlertCircle className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="font-bold text-black text-lg tracking-tight mb-1">Early In</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">13:00にお客様が到着予定です。優先して完了させてください。</p>
                    </div>
                </div>

                {/* Checklist */}
                <div className="space-y-4 mb-12">
                    <h3 className="font-bold text-black text-sm tracking-wider uppercase mb-4">Checklist</h3>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`p-5 rounded-[24px] flex gap-4 items-center cursor-pointer transition-all active:scale-[0.98] ${item.checked
                                ? "bg-[#f2f2f2]"
                                : "bg-white border border-gray-200"
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${item.checked ? "bg-black" : "border-2 border-gray-300"
                                }`}>
                                {item.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-base font-medium leading-snug ${item.checked ? "text-gray-400 line-through" : "text-black"}`}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Complete Button */}
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-6 z-50">
                    <button
                        disabled={!isAllDone}
                        onClick={handleComplete}
                        className={`w-full font-bold py-4 rounded-[24px] transition-all flex justify-center items-center gap-2 text-lg tracking-tight ${isAllDone
                            ? "bg-[#8fa996] text-white active:bg-[#7a9381]"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Report Complete
                    </button>
                    {!isAllDone && (
                        <p className="text-center text-xs font-medium text-gray-400 mt-3 tracking-wide">Complete all items to proceed</p>
                    )}
                </div>

                {/* Success Message Overlay */}
                {showSuccess && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6 transition-opacity">
                        <div className="bg-white rounded-[32px] p-8 w-full max-w-[320px] text-center shadow-2xl">
                            <div className="w-16 h-16 bg-[#e8efe9] rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-8 h-8 text-[#6d8a74]" strokeWidth={3} />
                            </div>
                            <h3 className="text-xl font-bold text-black mb-3 tracking-tight">お疲れ様でした。</h3>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                ステータスを清掃済みに<br />変更しました
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
