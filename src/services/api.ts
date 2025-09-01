/* eslint-disable @typescript-eslint/no-explicit-any */

// Types
export type Player = {
  id: number;
  name: string;
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

// Player API
export async function fetchPlayers(): Promise<Player[]> {
  try {
    const res = await fetch("http://localhost:3000/players");
    if (!res.ok) throw new Error("Erro ao buscar jogadores");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar jogadores");
  }
}

export async function createPlayer(name: string, email: string): Promise<Player> {
  const token = localStorage.getItem('authToken');
  const res = await fetch("http://localhost:3000/players", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name, email }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Erro ao criar jogador");
  }
  
  return res.json();
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const res = await fetch(`http://localhost:3000/players?email=${encodeURIComponent(email)}`);
  if (!res.ok) return false;
  const players = await res.json();
  return players.some((player: any) => player.email === email);
}

// Simulator API
export async function fetchSimulators() {
  const res = await fetch("http://localhost:3000/simulators");
  if (!res.ok) throw new Error("Erro ao buscar simuladores");
  return res.json();
}

export async function createSimulator(name: string) {
  const res = await fetch("http://localhost:3000/simulators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Erro ao criar simulador");
  return res.json();
}

export async function deleteSimulator(id: number) {
  const res = await fetch(`http://localhost:3000/simulators/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao deletar simulador");
}

// Queue API
export async function fetchQueue(simulatorId: number): Promise<QueueItem[]> {
  try {
    const res = await fetch(`http://localhost:3000/queue/${simulatorId}`);
    if (!res.ok) throw new Error("Erro ao buscar fila");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar fila");
  }
}

export async function createQueue(playerId: number, simulatorId: number): Promise<QueueItem> {
  try {
    const res = await fetch("http://localhost:3000/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, simulatorId }),
    });
    if (!res.ok) throw new Error("Erro ao criar queue");
    return res.json();
  } catch {
    throw new Error("Erro ao criar queue");
  }
}

export async function removePlayer(id: number) {
  const res = await fetch(`http://localhost:3000/queue/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao remover jogador");
}

export async function fetchAllQueues(): Promise<SimulatorQueue[]> {
  try {
    const res = await fetch("http://localhost:3000/simulators");
    if (!res.ok) throw new Error("Erro ao buscar todas as filas");
    const simulators = await res.json();
    
    return simulators.map((sim: { id: number; name: string; Queue?: any[] }) => ({
      simulatorId: sim.id,
      simulatorName: sim.name,
      queue: (sim.Queue || []).map((q: any) => ({
        id: q.id,
        player: q.Player
      }))
    }));
  } catch {
    throw new Error("Erro ao buscar todas as filas");
  }
}

// Timed Queue API
export async function startTimedQueue(simulatorId: number) {
  const res = await fetch(`http://localhost:3000/timed-queue/${simulatorId}/start`, { method: "POST" });
  if (!res.ok) throw new Error("Erro ao iniciar fila temporizada");
  return res.json();
}

export async function getQueueStatus(simulatorId: number) {
  const res = await fetch(`http://localhost:3000/timed-queue/${simulatorId}/status`);
  if (!res.ok) throw new Error("Erro ao buscar status da fila");
  return res.json();
}

export async function processNext(simulatorId: number) {
  const res = await fetch(`http://localhost:3000/timed-queue/${simulatorId}/next`, { method: "POST" });
  if (!res.ok) throw new Error("Erro ao processar próximo jogador");
  return res.json();
}

export async function confirmTurn(queueId: number) {
  const res = await fetch(`http://localhost:3000/timed-queue/${queueId}/confirm`, { method: "POST" });
  if (!res.ok) throw new Error("Erro ao confirmar turno");
  return res.json();
}

export async function handleMissed(queueId: number) {
  const res = await fetch(`http://localhost:3000/timed-queue/${queueId}/missed`, { method: "POST" });
  if (!res.ok) throw new Error("Erro ao processar turno perdido");
  return res.json();
}

// Auth API
export async function login(email: string, password: string) {
  const res = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Erro ao fazer login");
  }
  
  return res.json();
}

export async function register(name: string, email: string, password: string, role?: string, sellerId?: number) {
  const res = await fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role, sellerId }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Erro ao registrar usuário");
  }
  
  return res.json();
}

export async function getProfile() {
  const token = localStorage.getItem('authToken');
  const res = await fetch("http://localhost:3000/auth/profile", {
    headers: { "Authorization": `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error("Erro ao buscar perfil");
  return res.json();
}

export async function getSellers() {
  const res = await fetch("http://localhost:3000/auth/sellers");
  if (!res.ok) throw new Error("Erro ao buscar vendedores");
  return res.json();
}

