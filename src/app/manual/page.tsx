import Link from "next/link";
import { BookOpen, Building2 } from "lucide-react";

export default function ManualIndex() {
    return (
        <div className="p-6 safe-top pb-24 min-h-screen bg-[#fdfdfd]">
            <header className="mb-10 pt-4">
                <p className="text-sm font-medium text-gray-400 mb-1 tracking-wider">GUIDELINES</p>
                <h1 className="text-3xl font-bold tracking-tight text-black leading-tight">
                    Rules
                </h1>
                <p className="text-sm font-medium text-gray-500 mt-2">部屋タイプ別の清掃手順を確認します。</p>
            </header>

            {/* Room Types */}
            <section className="mb-10">
                <h2 className="text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Room Types</h2>
                <div className="flex flex-col gap-4">
                    <Link href="/manual/villa" className="bg-[#f2f2f2] p-6 rounded-[32px] flex items-center justify-between active:bg-gray-200 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="bg-white text-black p-4 rounded-2xl">
                                <BookOpen className="w-6 h-6" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-black tracking-tight mb-1">Villa</h3>
                                <p className="text-sm font-medium text-gray-500">ヴィラ（001・002・005）の清掃手順</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/manual/main" className="bg-[#f2f2f2] p-6 rounded-[32px] flex items-center justify-between active:bg-gray-200 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="bg-white text-black p-4 rounded-2xl">
                                <Building2 className="w-6 h-6" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-black tracking-tight mb-1">本館</h3>
                                <p className="text-sm font-medium text-gray-500">本館（101・102・201・202・203）の清掃手順</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>
        </div>
    );
}
