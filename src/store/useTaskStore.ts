import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export type Task = {
    id: string;
    title: string;
    status: string;
    image_url?: string | null;
    sort_order: number;
};

interface TaskStore {
    tasks: Task[];
    hasCachedData: boolean;
    fetchTasks: () => Promise<void>;
    setTasks: (tasks: Task[]) => void;
    addTaskOptimistic: (task: Task) => void;
    removeTaskOptimistic: (id: string) => void;
    updateTaskOptimistic: (id: string, updates: Partial<Task>) => void;
    reorderTasks: (tasks: Task[]) => void;
    applyRealtimeChange: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void;
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set) => ({
            tasks: [],
            hasCachedData: false,

            fetchTasks: async () => {
                const { data, error } = await supabase
                    .from("tasks")
                    .select("id, title, status, image_url, sort_order")
                    .order("sort_order", { ascending: true });

                if (error) {
                    console.error("Failed to fetch tasks:", error.message);
                    return;
                }

                if (data) {
                    set({ tasks: data as Task[], hasCachedData: true });
                }
            },

            setTasks: (tasks) => set({ tasks, hasCachedData: true }),

            addTaskOptimistic: (task) =>
                set((state) => ({
                    tasks: [...state.tasks, task],
                })),

            removeTaskOptimistic: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                })),

            updateTaskOptimistic: (id, updates) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),

            reorderTasks: (tasks) => set({ tasks }),

            applyRealtimeChange: (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                set((state) => {
                    switch (eventType) {
                        case "INSERT":
                            if (state.tasks.some((t) => t.id === newRecord.id))
                                return state;
                            return {
                                tasks: [...state.tasks, newRecord as Task].sort(
                                    (a, b) => a.sort_order - b.sort_order
                                ),
                            };
                        case "UPDATE":
                            return {
                                tasks: state.tasks.map((t) =>
                                    t.id === newRecord.id ? { ...t, ...newRecord } : t
                                ),
                            };
                        case "DELETE":
                            return {
                                tasks: state.tasks.filter((t) => t.id !== oldRecord.id),
                            };
                        default:
                            return state;
                    }
                });
            },
        }),
        {
            name: "hotel-tasks-cache",
            partialize: (state) => ({ tasks: state.tasks, hasCachedData: state.hasCachedData }),
        }
    )
);
