import { DriftClient } from "@drift-labs/sdk-browser";
import { create } from "zustand";

interface AddressState {
  address: string;
  setAddress: (newAddress: string) => void;
}

export const useAddressStore = create<AddressState>((set) => ({
  address: "",
  setAddress: (newAddress: string) => set({ address: newAddress }),
}));

interface DriftStore {
  client: DriftClient | null;
  setDriftClient: (client: DriftClient) => void;
}

export const useDriftStore = create<DriftStore>((set) => ({
  client: null,
  setDriftClient: (client) => set({ client }),
}));
