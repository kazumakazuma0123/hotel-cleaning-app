import { create } from "zustand";
import { persist } from "zustand/middleware";

type RoomStatus = "before-cleaning" | "cleaning" | "cleaned" | "occupied";

interface Room {
    id: string;
    status: RoomStatus;
}

interface RoomStore {
    rooms: Room[];
    updateRoomStatus: (id: string, newStatus: RoomStatus) => void;
}

export const useRoomStore = create<RoomStore>()(
    persist(
        (set) => ({
            rooms: [
                { id: "001", status: "cleaning" },
                { id: "002", status: "before-cleaning" },
                { id: "005", status: "occupied" },
            ],
            updateRoomStatus: (id, newStatus) =>
                set((state) => ({
                    rooms: state.rooms.map((room) =>
                        room.id === id ? { ...room, status: newStatus } : room
                    ),
                })),
        }),
        {
            name: "hotel-room-storage",
        }
    )
);
