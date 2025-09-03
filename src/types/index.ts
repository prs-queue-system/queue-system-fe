export type Player = {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  phone?: string;
  instagram?: string;
  inQueue?: boolean;
  sellerId?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type QueueItem = {
  id: number;
  player: Player;
};

export type SimulatorQueue = {
  simulatorId: number;
  simulatorName: string;
  queue: QueueItem[];
};

export type TimePattern = {
  id: number;
  name: string;
  timeMinutes: number;
  price: number;
};

export type Simulator = {
  id: number;
  name: string;
  Queue?: QueueItem[];
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  instagram?: string;
  sellerId?: number;
  createdAt?: string;
  updatedAt?: string;
};