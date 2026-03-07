"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, AlertCircle } from "lucide-react";

type CheckItem = {
    id: string;
    label: string;
    checked: boolean;
};

export default function RoomChecklist() {
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
    const isAllDone = completedCount === items.length;

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Top App Bar */}
            <div className="bg-white sticky top-0 z-40 border-b border-gray-200 px-4 h-14 flex items-center shadow-sm">
                <Link href="/tasks" className="flex items-center text-blue-600 active:opacity-70">
                    <ChevronLeft className="w-6 h-6 -ml-1" />
                    <span className="font-medium">タスク一覧</span>
                </Link>
                <span className="font-bold text-gray-900 mx-auto absolute left-1/2 -translate-x-1/2">
                    204号室 清掃
                </span>
            </div>

            <div className="p-4">
                {/* Progress Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 sticky top-16 z-30">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="font-bold text-gray-900">進捗状況</h2>
                        <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                        {completedCount} / {items.length} 完了
                    </p>
                </div>

                {/* Info Alert */}
                <div className="bg-amber-50 rounded-xl p-4 flex gap-3 items-start mb-6 border border-amber-100">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-900 mb-1">アーリーインあり</p>
                        <p className="text-xs text-amber-800">13:00にお客様が到着予定です。優先して完了させてください。</p>
                    </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-500 text-sm px-1 mb-2">チェック項目</h3>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`p-4 rounded-xl border flex gap-4 items-start cursor-pointer transition-all active:scale-[0.99] ${item.checked
                                    ? "bg-blue-50 border-blue-200 shadow-inner"
                                    : "bg-white border-gray-200 shadow-sm hover:border-blue-300"
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${item.checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                                }`}>
                                {item.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-sm ${item.checked ? "text-gray-500 line-through" : "text-gray-900 font-medium"}`}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Complete Button */}
                <div className="mt-8">
                    <button
                        disabled={!isAllDone}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${isAllDone
                                ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        完了を報告する
                    </button>
                    {!isAllDone && (
                        <p className="text-center text-xs text-gray-400 mt-3">すべての項目にチェックを入れると完了できます</p>
                    )}
                </div>

            </div>
        </div>
    );
}
