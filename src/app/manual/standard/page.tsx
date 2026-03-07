import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function StandardRoomManual() {
    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Top App Bar */}
            <div className="bg-white sticky top-0 z-40 border-b border-gray-200 px-4 h-14 flex items-center shadow-sm">
                <Link href="/manual" className="flex items-center text-blue-600 active:opacity-70">
                    <ChevronLeft className="w-6 h-6 -ml-1" />
                    <span className="font-medium">戻る</span>
                </Link>
                <span className="font-bold text-gray-900 mx-auto absolute left-1/2 -translate-x-1/2">
                    スタンダード清掃
                </span>
            </div>

            <div className="p-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-bold">目安時間: 30分</span>
                    </div>
                    <p className="text-sm text-gray-600">標準的なツイン・ダブルルームの清掃手順です。シーツ交換と水回りの清掃を効率よく行うことがポイン卜です。</p>
                </div>

                {/* Steps */}
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">

                    {/* Step 1 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold border-4 border-white shadow shrink-0 z-10">
                            1
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-1">換気とゴミ回収</h3>
                            <p className="text-sm text-gray-600 mb-2">まずは窓を開けて換気を行い、室内のゴミをすべて回収します。</p>
                            <div className="bg-amber-50 rounded-lg p-3 flex gap-2 items-start mt-3">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-800">忘れ物がないか、ゴミ箱以外もよく確認してください。</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold border-4 border-white shadow shrink-0 z-10">
                            2
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-1">ベッドメイク（リネン回収・張替）</h3>
                            <p className="text-sm text-gray-600">使用済みシーツ・タオル類を回収し、新しいものに交換します。シワが寄らないようピンと張ります。</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold border-4 border-white shadow shrink-0 z-10">
                            3
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-1">水回りの清掃</h3>
                            <p className="text-sm text-gray-600 text-balance mb-3">バス・トイレ・洗面台を清掃し、水滴を完全に拭き取ります。</p>
                            <ul className="text-xs space-y-2 text-gray-700">
                                <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 鏡に指紋や水垢を残さない</li>
                                <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 排水口の髪の毛を取り除く</li>
                                <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> タオルとアメニティを規定の位置にセット</li>
                            </ul>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold border-4 border-white shadow shrink-0 z-10">
                            4
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-1">拭き掃除と掃除機がけ</h3>
                            <p className="text-sm text-gray-600">デスク、テレビ台、冷蔵庫の上などを拭き上げ、最後に手前から奥へ向かって掃除機をかけます。</p>
                        </div>
                    </div>

                </div>

                {/* Action button simulating readiness for next phase */}
                <div className="mt-10 px-4">
                    <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        清掃タスクを開始する
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">※Phase 2でチェックリスト機能と連携するボタンです</p>
                </div>

            </div>
        </div>
    );
}
