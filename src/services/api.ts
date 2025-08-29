// src/services/api.ts
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

export async function fetchAllQueues(): Promise<SimulatorQueue[]> {
  try {
    const res = await fetch("http://localhost:3000/simulators");
    if (!res.ok) throw new Error("Erro ao buscar todas as filas");
    const simulators = await res.json();
    
    return simulators.map((sim: { id: number; name: string; Queue?: QueueItem[] }) => ({
      simulatorId: sim.id,
      simulatorName: sim.name,
      queue: sim.Queue || []
    }));
  } catch {
    throw new Error("Erro ao buscar todas as filas");
  }
}

export async function fetchPlayers(): Promise<Player[]> {
  try {
    const res = await fetch("http://localhost:3000/players");
    if (!res.ok) throw new Error("Erro ao buscar jogadores");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar jogadores");
  }
}

export async function createPlayer(name: string): Promise<Player> {
  try {
    const res = await fetch("http://localhost:3000/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Erro ao criar jogador");
    return res.json();
  } catch {
    throw new Error("Erro ao criar jogador");
  }
}