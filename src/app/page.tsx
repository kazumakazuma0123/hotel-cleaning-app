"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock, User } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";

export default function Home() {
  const rooms = useRoomStore((state) => state.rooms);

  const roomStatuses = [
    {
      id: "before-cleaning",
      label: "清掃前",
      enLabel: "BEFORE",
      rooms: rooms.filter((r) => r.status === "before-cleaning").map((r) => r.id),
      color: "bg-gray-200 text-gray-600",
      dot: "bg-gray-400",
      icon: <Circle className="w-4 h-4" strokeWidth={2.5} />
    },
    {
      id: "cleaning",
      label: "清掃中",
      enLabel: "CLEANING",
      rooms: rooms.filter((r) => r.status === "cleaning").map((r) => r.id),
      color: "bg-[#e6f0fa] text-[#5b8ab5]",
      dot: "bg-[#7aa0c0]",
      icon: <Clock className="w-4 h-4" strokeWidth={2.5} />
    },
    {
      id: "cleaned",
      label: "清掃済み",
      enLabel: "CLEANED",
      rooms: rooms.filter((r) => r.status === "cleaned").map((r) => r.id),
      color: "bg-[#e8efe9] text-[#6d8a74]",
      dot: "bg-[#8fa996]",
      icon: <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
    },
    {
      id: "occupied",
      label: "利用中",
      enLabel: "OCCUPIED",
      rooms: rooms.filter((r) => r.status === "occupied").map((r) => r.id),
      color: "bg-[#fbeaea] text-[#b86b6b]",
      dot: "bg-[#c58080]",
      icon: <User className="w-4 h-4" strokeWidth={2.5} />
    }
  ];

  return (
    <div className="p-6 safe-top pb-24 min-h-screen bg-[#fdfdfd] pt-8">
      {/* Status List Bento */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Room Status</h2>
        
        <div className="flex flex-col gap-4">
          {roomStatuses.map((status) => (
            <div key={status.id} className="bg-[#f2f2f2] rounded-[28px] p-5 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${status.color}`}>
                    {status.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-black text-base tracking-tight leading-none mb-1">{status.label}</h3>
                    <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">{status.enLabel}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-white px-2.5 py-0.5 rounded-full">{status.rooms.length}</span>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                {status.rooms.map((room) => (
                  <Link 
                    key={room} 
                    href={`/tasks/${room}`} 
                    className="bg-white px-4 py-3 rounded-2xl border border-gray-100 flex justify-between items-center active:bg-gray-50 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                      <span className="font-bold text-black tracking-tight text-lg">{room}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>



    </div>
  );
}
