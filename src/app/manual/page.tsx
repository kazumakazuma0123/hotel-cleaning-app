import Link from "next/link";
import { BookOpen, MapPin, ShowerHead, Bed } from "lucide-react";

export default function ManualIndex() {
    return (
        <div className="p-4 safe-top pb-24">
            <header className="mb-6 pt-2">
                <h1 className="text-2xl font-bold text-gray-900">清掃マニュアル</h1>
                <p className="text-sm text-gray-500 mt-1">部屋タイプや箇所別の清掃手順を確認します。</p>
            </header>

            {/* Room Types */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">部屋タイプ別（基本手順）</h2>
                <div className="flex flex-col gap-3">
                    <Link href="/manual/standard" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">スタンダードルーム</h3>
                                <p className="text-xs text-gray-500">標準的な客室の清掃手順（約30分）</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/manual/suite" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">スイートルーム</h3>
                                <p className="text-xs text-gray-500">広めの客室の清掃手順（約60分）</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Areas */}
            <section>
                <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">箇所別（詳細手順）</h2>
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/manual/bathroom" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 active:bg-gray-50 transition-colors">
                        <div className="bg-cyan-100 text-cyan-600 p-3 rounded-full">
                            <ShowerHead className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">水回り・浴室</span>
                    </Link>
                    <Link href="/manual/bedding" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 active:bg-gray-50 transition-colors">
                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
                            <Bed className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">ベッドメイク</span>
                    </Link>
                    <Link href="/manual/amenities" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 active:bg-gray-50 transition-colors">
                        <div className="bg-rose-100 text-rose-600 p-3 rounded-full">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">アメニティ補充</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
