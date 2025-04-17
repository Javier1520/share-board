import { create } from "zustand";
import { User, Room } from "./types";

interface AppState {
  user: User | null;
  currentRoom: Room | null;
  setUser: (user: User | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;
  isErasing: boolean;
  setIsErasing: (isErasing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentRoom: null,
  drawingColor: "#000000",
  isErasing: false,
  setUser: (user) => set({ user }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setDrawingColor: (color) => set({ drawingColor: color }),
  setIsErasing: (isErasing) => set({ isErasing }),
}));
