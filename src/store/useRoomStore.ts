import { create } from "zustand";
import { persist } from "zustand/middleware";

type RoomStatus = "before-cleaning" | "cleaning" | "cleaned" | "inspected" | "occupied";

interface Room {
    id: string;
    status: RoomStatus;
    checkIn?: string;
    checkOut?: string;
}

interface RoomStore {
    rooms: Room[];
    updateRoomStatus: (id: string, newStatus: RoomStatus) => void;
}

export const useRoomStore = create<RoomStore>()(
    persist(
        (set) => ({
            rooms: [
                { id: "001", status: "occupied", checkIn: "14:00", checkOut: "10:00" },
                { id: "002", status: "cleaning", checkIn: "15:00", checkOut: "11:00" },
            ],
            updateRoomStatus: (id, newStatus) =>
                set((state) => ({
                    rooms: state.rooms.map((room) =>
                        room.id === id ? { ...room, status: newStatus } : room
                    ),
                })),
        }),
        {
            name: "hotel-rooms-storage-v5",
        }
    )
);
