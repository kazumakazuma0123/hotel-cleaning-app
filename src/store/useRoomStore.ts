import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type RoomStatus = "before-cleaning" | "cleaning" | "cleaned" | "inspected" | "occupied";

interface Room {
    id: string;
    status: RoomStatus;
    checkIn?: string;
    checkOut?: string;
    checked_items?: string[];
}

interface RoomStore {
    rooms: Room[];
    fetchRooms: () => Promise<void>;
    updateRoomStatus: (id: string, newStatus: RoomStatus, checkedItems?: string[]) => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
    rooms: [],
    
    fetchRooms: async () => {
        const { data, error } = await supabase
            .from("rooms")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("Failed to fetch rooms:", error.message);
            return;
        }

        if (data) {
            set({ rooms: data as Room[] });
        }
    },

    updateRoomStatus: async (id, newStatus, checkedItems) => {
        // Optimistic update
        const prevRooms = get().rooms;
        set((state) => ({
            rooms: state.rooms.map((room) =>
                room.id === id ? { ...room, status: newStatus, checked_items: checkedItems || room.checked_items } : room
            ),
        }));

        const updates: { status: RoomStatus; checked_items?: string[] } = { status: newStatus };
        if (checkedItems !== undefined) {
            updates.checked_items = checkedItems;
        }

        const { error } = await supabase
            .from("rooms")
            .upsert({ id, ...updates })
            .select();

        if (error) {
            console.error("Failed to update room status:", error.message);
            // Revert on error
            set({ rooms: prevRooms });
        }
    },
}));

