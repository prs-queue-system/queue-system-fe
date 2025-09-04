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
  skillLevel?: 'gamer' | 'racer' | 'pro';
  difficulty?: 'gamer' | 'racer' | 'pro';
  gameMode?: 'practice' | 'race' | 'hotlap';
};

export type QueueItem = {
  id: number;
  player: Player;
  assignedPcId?: number;
};

export type SimulatorQueue = {
  simulatorId: number;
  simulatorName: string;
  queue: QueueItem[];
  pcIp?: string;
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

// AC Launcher Integration Types
export type PCStatus = {
  id: number;
  pcId: string;
  pcName: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentPlayer?: Player;
  sessionStartTime?: string;
};

export type RaceSession = {
  id: number;
  playerId: number;
  pcId: number;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'aborted';
  player?: Player;
};

export type LapTime = {
  id: number;
  sessionId: number;
  lapNumber: number;
  lapTime: number;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  timestamp: string;
};

// AC Launcher Communication Types
export type ACLauncherMessage = {
  type: 'setplayer' | 'setcar' | 'settrack' | 'setdiff' | 'start' | 'ping' | 'isacactive';
  data?: any;
};

export type ACGameState = {
  acactive: boolean;
  acstopped: boolean;
  acsoftstopped: boolean;
};

export type ACPlayerData = {
  name: string;
  carId?: string;
  trackId?: string;
  difficulty: 'gamer' | 'racer' | 'pro';
  gameMode?: 'practice' | 'race' | 'hotlap';
};