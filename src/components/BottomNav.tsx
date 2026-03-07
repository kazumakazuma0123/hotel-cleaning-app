import Link from "next/link";
import { Home, ClipboardList, Settings, BookOpen } from "lucide-react";

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
            <div className="flex justify-around items-center h-16">
                <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-blue-600 active:text-blue-700">
                    <Home className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/manual" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-blue-600 active:text-blue-700">
                    <BookOpen className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">マニュアル</span>
                </Link>
                <Link href="/tasks" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-blue-600 active:text-blue-700">
                    <ClipboardList className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">タスク</span>
                </Link>
                <Link href="/settings" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-blue-600 active:text-blue-700">
                    <Settings className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">設定</span>
                </Link>
            </div>
        </nav>
    );
}
