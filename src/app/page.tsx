import Link from "next/link";
import { BookOpen, CheckSquare, Clock, AlertTriangle, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="p-4 safe-top pb-24">
      {/* Header */}
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">お疲れ様です。本日の清掃状況です。</p>
      </header>

      {/* Quick Stats Banner */}
      <div className="bg-blue-600 text-white rounded-2xl p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="w-5 h-5" /> 本日の担当タスク
          </h2>
          <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">未完了</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-bold">4 <span className="text-base font-normal opacity-80">/ 12 部屋</span></p>
          </div>
          <Link href="/tasks" className="text-sm bg-white text-blue-600 px-3 py-1.5 rounded-full font-medium hover:bg-blue-50 transition-colors">
            確認する
          </Link>
        </div>
      </div>

      {/* Main Menu Grid */}
      <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">クイックアクセス</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/manual/standard" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 active:bg-gray-50 transition-colors">
          <div className="bg-green-100 text-green-600 p-3 rounded-full">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-medium text-gray-800 text-sm">スタンダード<br />清掃手順</span>
        </Link>
        <Link href="/manual/suite" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 active:bg-gray-50 transition-colors">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-medium text-gray-800 text-sm">スイート<br />清掃手順</span>
        </Link>
      </div>

      {/* Recent Alerts / Notices */}
      <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">お知らせ・連絡事項</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-50 flex items-start gap-3">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-full mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">アメニティの配置変更について</h3>
            <p className="text-xs text-gray-500 line-clamp-2">本日より全室のシャンプー類が新しいパッケージに変更されます。配置方法はマニュアルをご確認ください。</p>
            <span className="text-[10px] text-gray-400 mt-2 block">1時間前</span>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <div className="bg-gray-100 text-gray-500 p-2 rounded-full mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">【共有】本日のレイトチェックアウト</h3>
            <p className="text-xs text-gray-500">302号室は13:00チェックアウトに変更となりました。清掃の順番に気を付けてください。</p>
            <span className="text-[10px] text-gray-400 mt-2 block">今朝 08:30</span>
          </div>
        </div>
        <Link href="/notices" className="block w-full text-center text-xs font-medium text-blue-600 bg-gray-50 py-3 flex justify-center items-center gap-1 active:bg-gray-100 transition-colors">
          すべてのお知らせを見る <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

    </div>
  );
}
