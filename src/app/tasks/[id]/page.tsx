"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, AlertCircle, Play, RefreshCw, CheckCircle2 } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";

type CheckItem = {
    id: string;
    label: string;
    checked: boolean;
};

export default function RoomTaskPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // In Next 15+ or React 19, `params` is a Promise, so we must unwrap it using React.use()
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    
    const room = useRoomStore((state) => state.rooms.find((r) => r.id === id));
    const updateRoomStatus = useRoomStore((state) => state.updateRoomStatus);
    
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: "", description: "" });

    const [items, setItems] = useState<CheckItem[]>([
        { id: "c1", label: "窓を開けて換気を行い、ゴミをすべて回収した", checked: false },
        { id: "c2", label: "ベッドのシーツ・枕カバーをピンと張って交換した", checked: false },
        { id: "c3", label: "水回り（バス・トイレ）を清掃し、水滴を拭き取った", checked: false },
        { id: "c4", label: "タオル類と新しいアメニティを規定位置に配置した", checked: false },
        { id: "c5", label: "デスクやテレビ台を拭き掃除した", checked: false },
        { id: "c6", label: "部屋全体に掃除機をかけた（奥から手前へ）", checked: false },
    ]);

    // Pre-check items if the task is already complete
    useEffect(() => {
        if (room?.status === "cleaned") {
             setItems(prev => prev.map(i => ({ ...i, checked: true })));
        }
    }, [room?.status]);

    if (!room) {
        return (
            <div className="bg-[#fdfdfd] min-h-screen">
                <div className="bg-[#fdfdfd] sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center text-black active:opacity-50 transition-opacity -ml-2">
                        <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
                    </Link>
                    <span className="font-bold text-black text-lg tracking-tight">Error</span>
                    <div className="w-8"></div>
                </div>
                <div className="p-6 text-center mt-20 text-gray-500 font-medium">Room not found</div>
            </div>
        );
    }

    const toggleItem = (itemId: string) => {
        setItems(items.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    };

    const completedCount = items.filter(i => i.checked).length;
    const isAllDone = completedCount === items.length;

    const handleAction = (newStatus: "before-cleaning" | "cleaning" | "cleaned", title: string, desc: string, shouldRedirect: boolean = true) => {
        setSuccessMessage({ title, description: desc });
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            updateRoomStatus(id, newStatus);
            if (shouldRedirect) {
                router.push("/");
            }
        }, 1500);
    };

    const renderHeader = () => (
        <div className="bg-[#fdfdfd] sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center text-black active:opacity-50 transition-opacity -ml-2">
                <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
            </Link>
            <span className="font-bold text-black text-lg tracking-tight">
                Room {id}
            </span>
            <div className="w-8"></div>
        </div>
    );

    const renderSuccessOverlay = () => {
        if (!showSuccess) return null;
        return (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6 transition-opacity">
                <div className="bg-white rounded-[32px] p-8 w-full max-w-[320px] text-center shadow-2xl">
                    <div className="w-16 h-16 bg-[#e8efe9] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-[#6d8a74]" strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-bold text-black mb-3 tracking-tight">{successMessage.title}</h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: successMessage.description }} />
                </div>
            </div>
        );
    };

    if (room.status === "before-cleaning") {
        return (
            <div className="bg-white min-h-screen">
                <div className="bg-white sticky top-0 z-40 h-16 flex items-center justify-between border-b border-gray-100 px-4">
                    <Link href="/" className="flex items-center text-[#111] active:opacity-50 transition-opacity w-10">
                        <ChevronLeft className="w-7 h-7" strokeWidth={1} />
                    </Link>
                    <span className="font-light text-gray-500 text-lg tracking-wider">
                        Room {id}
                    </span>
                    <div className="w-10"></div>
                </div>
                <div className="px-6 pt-28 flex flex-col items-center justify-center">
                    <div className="mb-12">
                        {/* We will use a geometric icon to match the vibe since 'Broom' isn't standard in lucide-react */}
                        <svg
                          width="100"
                          height="120"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#829c95"
                          strokeWidth="0.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mx-auto"
                        >
                          <path d="M12 2v9M9 11v1M15 11v1M9 12h6l2 9H7l2-9z" />
                          <path d="M9 15h6M8 18h8M10 12l-1 9M14 12l1 9" />
                        </svg>
                    </div>
                    <h2 className="text-[32px] font-normal text-[#222222] mb-6 tracking-widest text-center">清掃の開始</h2>
                    <p className="text-[#999999] font-light text-[14px] text-center leading-loose mb-16 tracking-widest">
                        Room {id} の清掃を開始しますか？<br />
                        開始するとステータスが「清掃中」になります。
                    </p>
                    <div className="fixed inset-x-0 bottom-0 h-32 bg-white/80 backdrop-blur-sm pointer-events-none z-10" />
                    <button
                        onClick={() => handleAction("cleaning", "作業開始", "ステータスを「清掃中」に<br />変更しました", false)}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[400px] font-normal py-4 transition-all flex justify-center items-center gap-2 text-[15px] tracking-widest text-transparent z-20"
                    >
                    {/* The design only shows the text implicitly leading to start cleaning. We'll add text below if they meant a text button, but the image cuts off. Wait, looking at the image there's NO button at the bottom visible. It might be hidden or just click the text. Wait, there's a huge blank space. Let's provide a subtle outlined button or just text to keep it functional while matching the aesthetic. The image implies "Start" is implied or cut off. Actually, let's just make the text a button. Or an invisible button covering everything? Let's use a very minimal text button. */}
                        <span className="text-[#333] border-b border-[#333] pb-1 px-4 cursor-pointer hover:opacity-70 transition-opacity">清掃を開始する</span>
                    </button>
                    {/* fallback tap area since image doesn't show button explicitly */}
                    <div 
                       onClick={() => handleAction("cleaning", "作業開始", "ステータスを「清掃中」に<br />変更しました", false)}
                       className="absolute inset-0 z-0 cursor-pointer" 
                    />
                </div>
                {renderSuccessOverlay()}
            </div>
        );
    }

    if (room.status === "occupied") {
        return (
            <div className="bg-white min-h-screen pb-32">
                <div className="bg-white sticky top-0 z-40 h-16 flex items-center justify-between border-b border-gray-100 px-4">
                    <Link href="/" className="flex items-center text-black active:opacity-50 transition-opacity w-10">
                        <ChevronLeft className="w-7 h-7" strokeWidth={1} />
                    </Link>
                    <span className="font-light text-gray-500 text-lg tracking-wider">
                        Room {id}
                    </span>
                    <div className="w-10"></div>
                </div>
                <div className="px-6 pt-24 flex flex-col items-center justify-center">
                    <div className="mb-10">
                        <RefreshCw className="w-20 h-20 text-[#ab978a] mx-auto" strokeWidth={1} />
                    </div>
                    <h2 className="text-2xl font-normal text-[#111111] mb-5 tracking-widest text-center">ステータスの変更</h2>
                    <p className="text-[#a3a3a3] font-light text-[13px] text-center leading-loose mb-16 tracking-widest">
                        お客様がチェックアウトされましたか？<br />
                        清掃前のステータスに切り替えます。
                    </p>
                    <button
                        onClick={() => handleAction("before-cleaning", "更新完了", "ステータスを「清掃前」に<br />変更しました")}
                        className="w-full max-w-[300px] font-normal py-[18px] rounded-full transition-all flex justify-center items-center gap-2 text-sm tracking-widest bg-black text-white active:bg-gray-800 shadow-xl shadow-black/10 mx-auto"
                    >
                        ステータスを清掃前に変更する
                    </button>
                </div>
                {renderSuccessOverlay()}
            </div>
        );
    }

    if (room.status === "cleaned") {
        return (
            <div className="bg-[#fdfdfd] min-h-screen pb-32">
                {renderHeader()}
                <div className="px-6 pt-12 flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="bg-[#e8efe9] text-[#6d8a74] p-4 rounded-3xl mb-8">
                        <CheckCircle2 className="w-12 h-12 mx-auto" strokeWidth={2} />
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-4 tracking-tight text-center">清掃完了</h2>
                    <p className="text-gray-500 font-medium text-center leading-relaxed mb-12">
                        Room {id} は清掃済みです。<br />
                        お疲れ様でした。
                    </p>
                </div>
            </div>
        );
    }

    // "cleaning" status -> show Checklist
    return (
        <div className="bg-[#fdfdfd] min-h-screen pb-32">
            {renderHeader()}
            <div className="px-6 pt-4">
                 <div className="mb-10 flex items-end justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-400 tracking-wider mb-1">PROGRESS</p>
                        <p className="text-5xl font-bold tracking-tighter text-black">
                            {completedCount} <span className="text-xl font-medium text-gray-400">/ {items.length}</span>
                        </p>
                    </div>
                 </div>

                {room.checkIn && (
                    <div className="bg-[#f2f2f2] rounded-[28px] p-6 mb-10 flex gap-4 items-start">
                        <div className="bg-black text-white p-2 rounded-full shrink-0">
                             <AlertCircle className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="font-bold text-black text-lg tracking-tight mb-1">Early In</p>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{room.checkIn}にお客様が到着予定です。優先して完了させてください。</p>
                        </div>
                    </div>
                )}

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

                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-6 z-50">
                    <button
                        disabled={!isAllDone}
                        onClick={() => handleAction("cleaned", "お疲れ様でした", "ステータスを清掃済みに<br />変更しました")}
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

                {renderSuccessOverlay()}
            </div>
        </div>
    );
}
