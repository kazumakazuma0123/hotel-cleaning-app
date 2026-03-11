import Link from "next/link";
import { Home, ClipboardList, Settings, BookOpen } from "lucide-react";

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-[#fdfdfd] border-t border-gray-100 pb-safe">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-black active:text-black transition-colors">
                    <Home className="w-6 h-6 mb-1" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium tracking-wide">Home</span>
                </Link>
                <Link href="/manual" className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-black active:text-black transition-colors">
                    <BookOpen className="w-6 h-6 mb-1" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium tracking-wide">Rules</span>
                </Link>
                <Link href="/tasks" className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-black active:text-black transition-colors">
                    <ClipboardList className="w-6 h-6 mb-1" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium tracking-wide">Tasks</span>
                </Link>
                <Link href="/settings" className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-black active:text-black transition-colors">
                    <Settings className="w-6 h-6 mb-1" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium tracking-wide">Settings</span>
                </Link>
            </div>
        </nav>
    );
}
