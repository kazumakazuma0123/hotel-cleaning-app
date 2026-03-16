"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRoomStore } from "@/store/useRoomStore";
import { supabase } from "@/lib/supabase";

type Booking = {
  room_id: string;
  check_in_datetime: string;
};

export default function Home() {
  const rooms = useRoomStore((state) => state.rooms);
  const [roomBookingInfo, setRoomBookingInfo] = useState<Record<string, { 
    checkIn: string, 
    lastUsage: string,
    guests: number | null,
    nights: number | null
  }>>({});

  const today = new Date();
  const dateString = `${today.getMonth() + 1}月${today.getDate()}日`;

  // Fetch bookings info
  useEffect(() => {
    async function fetchInfo() {
      // Get the next upcoming confirmed booking for each room
      const { data, error } = await supabase
        .from("bookings")
        .select("room_id, check_in_datetime, guest_count, total_nights")
        .eq("status", "confirmed")
        .gte("check_in_datetime", new Date().toISOString())
        .order("check_in_datetime", { ascending: true });

      if (error) {
        console.error("Failed to fetch bookings:", error.message);
        return;
      }

      // Also get the most recent past booking to determine "recent usage"
      const { data: pastData } = await supabase
        .from("bookings")
        .select("room_id, check_in_datetime")
        .eq("status", "confirmed")
        .lt("check_in_datetime", new Date().toISOString())
        .order("check_in_datetime", { ascending: false });

      const infoMap: Record<string, { checkIn: string, lastUsage: string, guests: number | null, nights: number | null }> = {};
      
      // Set upcoming info
      data?.forEach((b: any) => {
        if (!infoMap[b.room_id]) {
          const date = new Date(b.check_in_datetime);
          infoMap[b.room_id] = { 
            checkIn: date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
            lastUsage: "",
            guests: b.guest_count,
            nights: b.total_nights
          };
        }
      });

      // Set last usage date
      pastData?.forEach((b: any) => {
        const roomInfo = infoMap[b.room_id] || { checkIn: "", lastUsage: "", guests: null, nights: null };
        if (!roomInfo.lastUsage) {
          const date = new Date(b.check_in_datetime);
          roomInfo.lastUsage = `${date.getMonth() + 1}/${date.getDate()}`;
          infoMap[b.room_id] = roomInfo;
        }
      });

      setRoomBookingInfo(infoMap);
    }

    fetchInfo();

    const channel = supabase
      .channel("bookings-all-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchInfo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statusConfig: Record<string, { label: string; bg: string }> = {
    "before-cleaning": { label: "清掃前", bg: "bg-[#595959] text-white" },
    "cleaning": { label: "清掃中", bg: "bg-[#2f667c] text-white" },
    "cleaned": { label: "清掃済み", bg: "bg-[#316c39] text-white" },
    "inspected": { label: "確認済み", bg: "bg-[#aa8d65] text-white" },
    "occupied": { label: "利用中", bg: "bg-[#501a61] text-white" },
  };

  const statusOrder = ["before-cleaning", "cleaning", "cleaned", "inspected", "occupied"];

  return (
    <div className="p-4 pb-24 min-h-screen bg-[#f7f7f7] pt-14">
      {/* Date & Greeting */}
      <div className="flex flex-col items-center mt-2 mb-10">
        <p className="text-[#333] tracking-wider mb-2 font-medium text-[16px]">{dateString}</p>
        <h1 className="text-[22px] font-medium text-black tracking-[0.2em] mb-4">おはようございます</h1>
      </div>

      {/* Room Cards List */}
      <div className="flex flex-col gap-5 px-1 pb-10 max-w-[500px] mx-auto">
        {rooms.map((room) => (
          <Link href={`/tasks/${room.id}`} key={room.id} className="block active:scale-[0.98] transition-transform">
            <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden px-4 py-5">
              
              {/* Segmented Status Bar */}
              <div className="flex w-full bg-[#f0f0f0] rounded-lg overflow-hidden gap-[1px]">
                {statusOrder.map((statusKey) => {
                  const isActive = room.status === statusKey;
                  const config = statusConfig[statusKey];
                  return (
                    <div 
                      key={statusKey} 
                      className={`flex-1 py-1.5 text-center text-[11px] font-semibold transition-colors ${
                        isActive 
                          ? config.bg 
                          : "bg-[#e5e5e5] text-[#a3a3a3]"
                      }`}
                    >
                      {statusConfig[statusKey].label}
                    </div>
                  );
                })}
              </div>

              {/* Room Info */}
              <div className="mt-6 mb-2 text-center flex flex-col items-center">
                <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest uppercase">
                  Last: {roomBookingInfo[room.id]?.lastUsage || "---"}
                </div>
                <h2 className="text-[40px] font-light text-[#111111] tracking-tight leading-none mb-3">
                  Room {room.id}
                </h2>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center text-[#aaaaaa] text-[12px] font-semibold uppercase tracking-wider">
                    <span>IN {roomBookingInfo[room.id]?.checkIn || room.checkIn || "15:00"}</span>
                    <span className="mx-1.5 font-normal text-gray-300">/</span>
                    <span>OUT {room.checkOut || "11:00"}</span>
                  </div>
                  {(roomBookingInfo[room.id]?.guests || roomBookingInfo[room.id]?.nights) && (
                    <div className="flex items-center gap-3 text-[11px] font-bold text-[#888888] bg-[#f0f0f0] px-3 py-0.5 rounded-full mt-1">
                      {roomBookingInfo[room.id]?.guests && (
                        <span>👤 {roomBookingInfo[room.id]?.guests}名</span>
                      )}
                      {roomBookingInfo[room.id]?.nights && (
                        <span>🌙 {roomBookingInfo[room.id]?.nights}泊</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
