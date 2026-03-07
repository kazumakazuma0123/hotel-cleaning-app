import { CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";

export default function TasksIndex() {
    return (
        <div className="p-4 safe-top pb-24">
            <header className="mb-6 pt-2">
                <h1 className="text-2xl font-bold text-gray-900">本日のタスク</h1>
                <p className="text-sm text-gray-500 mt-1">担当する部屋の清掃状況を管理します。</p>
            </header>

            {/* Stats Summary */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <p className="text-gray-500 text-xs font-bold mb-1">未着手</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div className="flex-1 bg-white p-3 rounded-2xl border border-blue-100 shadow-sm text-center">
                    <p className="text-blue-500 text-xs font-bold mb-1">清掃中</p>
                    <p className="text-2xl font-bold text-blue-600">1</p>
                </div>
                <div className="flex-1 bg-white p-3 rounded-2xl border border-green-100 shadow-sm text-center">
                    <p className="text-green-500 text-xs font-bold mb-1">完了</p>
                    <p className="text-2xl font-bold text-green-600">3</p>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {/* In Progress Task */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded mr-2">清掃中</span>
                            <span className="text-sm font-bold text-gray-500">スタンダード</span>
                        </div>
                        <span className="flex items-center text-xs text-blue-600 font-medium">
                            <Clock className="w-3 h-3 mr-1" /> 15分経過
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">204 号室</h3>
                    <p className="text-xs text-gray-500 mb-3">チェックアウト済 / アーリーイン希望(13:00)</p>

                    <div className="w-full bg-blue-200 rounded-full h-1.5 mb-2">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-4">
                        <span>進捗</span>
                        <span>45%</span>
                    </div>

                    <Link href="/tasks/204" className="block w-full text-center bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all">
                        チェックリストを開く
                    </Link>
                </div>

                {/* To Do Task */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden opacity-90">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gray-300"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded mr-2">未着手</span>
                            <span className="text-sm font-bold text-gray-500">スタンダード</span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">205 号室</h3>
                    <p className="text-xs text-gray-500 mb-3">チェックアウト済</p>

                    <button className="w-full text-center bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                        <Circle className="w-4 h-4 text-gray-400" />
                        清掃を開始する
                    </button>
                </div>

                {/* Done Task */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 relative overflow-hidden opacity-75">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-400"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded mr-2">完了</span>
                            <span className="text-sm font-bold text-gray-500">スイート</span>
                        </div>
                        <span className="flex items-center text-xs text-green-600 font-medium">
                            11:30 完了
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        <h3 className="text-2xl font-bold text-gray-500 line-through">301 号室</h3>
                    </div>
                </div>

            </div>
        </div>
    );
}
