/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApiConfig } from "./config";
import { sanitizeInput, validateId } from "../utils/validation";
import type { Player, QueueItem, SimulatorQueue } from "../types";

export type { Player, QueueItem, SimulatorQueue } from "../types";

// Player API
export async function fetchPlayers(): Promise<Player[]> {
  try {
    const res = await fetch(`${ApiConfig.getBaseUrl()}/players`);
    if (!res.ok) throw new Error("Erro ao buscar jogadores");
    const data = await res.json();
    return data.map((player: any) => ({
      id: player.id,
      name: player.name,
      email: player.email,
      role: player.role || "PLAYER",
      phone: player.phone,
      instagram: player.instagram,
      inQueue: player.inQueue,
      sellerId: player.sellerId,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    }));
  } catch {
    throw new Error("Erro ao buscar jogadores");
  }
}

export async function createPlayer(
  name: string,
  email: string,
  phone?: string,
  sellerId?: number
): Promise<Player> {
  try {
    const token = localStorage.getItem("authToken");

    // Sanitize inputs to prevent XSS
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = phone ? sanitizeInput(phone) : undefined;
    const validSellerId =
      sellerId && Number.isInteger(sellerId) ? sellerId : undefined;

    const res = await fetch(`${ApiConfig.getBaseUrl()}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        sellerId: validSellerId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Erro ao criar jogador");
    }

    return res.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao criar jogador"
    );
  }
}

export async function updatePlayer(
  id: number,
  name: string,
  email: string,
  phone?: string,
  sellerId?: number
): Promise<Player> {
  try {
    const token = localStorage.getItem("authToken");

    // Validate and sanitize inputs to prevent XSS
    const validId = validateId(id);
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = phone ? sanitizeInput(phone) : undefined;
    const validSellerId =
      sellerId && Number.isInteger(sellerId) ? sellerId : undefined;

    const res = await fetch(`${ApiConfig.getBaseUrl()}/players/${validId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        sellerId: validSellerId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Erro ao atualizar jogador");
    }

    return res.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao atualizar jogador"
    );
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const sanitizedEmail = sanitizeInput(email);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/players?email=${encodeURIComponent(
        sanitizedEmail
      )}`
    );
    if (!res.ok) return false;
    const players = await res.json();
    return players.some((player: Player) => player.email === sanitizedEmail);
  } catch {
    return false;
  }
}

// Simulator API
export async function fetchSimulators(): Promise<any[]> {
  try {
    const res = await fetch(`${ApiConfig.getBaseUrl()}/simulators`);
    if (!res.ok) throw new Error("Erro ao buscar simuladores");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar simuladores");
  }
}

export async function createSimulator(name: string, pcIp?: string) {
  try {
    // Sanitize input to prevent XSS
    const sanitizedName = sanitizeInput(name);
    const sanitizedPcIp = pcIp ? sanitizeInput(pcIp) : undefined;

    const res = await fetch(`${ApiConfig.getBaseUrl()}/simulators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: sanitizedName,
        ...(sanitizedPcIp && { pcIp: sanitizedPcIp })
      }),
    });
    if (!res.ok) throw new Error("Erro ao criar simulador");
    return res.json();
  } catch {
    throw new Error("Erro ao criar simulador");
  }
}

export async function updateSimulator(id: number, updates: { name?: string; pcIp?: string; active?: boolean }) {
  try {
    const validId = validateId(id);
    const sanitizedUpdates: any = {};
    
    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeInput(updates.name);
    }
    if (updates.pcIp !== undefined) {
      sanitizedUpdates.pcIp = updates.pcIp ? sanitizeInput(updates.pcIp) : null;
    }
    if (updates.active !== undefined) {
      sanitizedUpdates.active = updates.active;
    }

    const res = await fetch(`${ApiConfig.getBaseUrl()}/simulators/${validId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedUpdates),
    });
    if (!res.ok) throw new Error("Erro ao atualizar simulador");
    return res.json();
  } catch {
    throw new Error("Erro ao atualizar simulador");
  }
}

export async function deleteSimulator(id: number) {
  try {
    const validId = validateId(id);
    const res = await fetch(`${ApiConfig.getBaseUrl()}/simulators/${validId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar simulador");
  } catch {
    throw new Error("Erro ao deletar simulador");
  }
}

// Queue API
export async function fetchQueue(simulatorId: number): Promise<QueueItem[]> {
  try {
    const validId = validateId(simulatorId);
    const res = await fetch(`${ApiConfig.getBaseUrl()}/queue/${validId}`);
    if (!res.ok) throw new Error("Erro ao buscar fila");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar fila");
  }
}

export async function createQueue(
  playerId: number,
  simulatorId: number,
  timeMinutes?: number,
  amountPaid?: number
): Promise<QueueItem> {
  try {
    const token = localStorage.getItem("authToken");
    const validPlayerId = validateId(playerId);
    const validSimulatorId = validateId(simulatorId);
    const res = await fetch(`${ApiConfig.getBaseUrl()}/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        playerId: validPlayerId,
        simulatorId: validSimulatorId,
        timeMinutes,
        amountPaid,
      }),
    });
    if (!res.ok) throw new Error("Erro ao criar queue");
    return res.json();
  } catch {
    throw new Error("Erro ao criar queue");
  }
}

export async function removePlayer(id: number) {
  try {
    const validId = validateId(id);
    const res = await fetch(`${ApiConfig.getBaseUrl()}/queue/${validId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao remover jogador");
  } catch {
    throw new Error("Erro ao remover jogador");
  }
}

export async function fetchAllQueues(): Promise<SimulatorQueue[]> {
  try {
    const res = await fetch(`${ApiConfig.getBaseUrl()}/simulators`);
    if (!res.ok) throw new Error("Erro ao buscar todas as filas");
    const simulators = await res.json();

    return simulators.map(
      (sim: { id: number; name: string; Queue?: any[] }) => ({
        simulatorId: sim.id,
        simulatorName: sim.name,
        queue: (sim.Queue || [])
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          .map((q: any) => {
            const user = q.User || q.Player;
            return {
              id: q.id,
              player: {
                id: user?.id || q.playerId || q.userId,
                name: user?.name || "Unknown",
                email: user?.email || "",
                role: user?.role || "PLAYER",
                phone: user?.phone,
                instagram: user?.instagram,
                inQueue: user?.inQueue,
                sellerId: user?.sellerId,
                createdAt: user?.createdAt,
                updatedAt: user?.updatedAt,
              },
            };
          }),
      })
    );
  } catch {
    throw new Error("Erro ao buscar todas as filas");
  }
}

// Timed Queue API
export async function startTimedQueue(simulatorId: number) {
  try {
    const validId = validateId(simulatorId);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/timed-queue/${validId}/start`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Erro ao iniciar fila temporizada");
    return res.json();
  } catch {
    throw new Error("Erro ao iniciar fila temporizada");
  }
}

export async function getQueueStatus(simulatorId: number) {
  try {
    const validId = validateId(simulatorId);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/timed-queue/${validId}/status`
    );
    if (!res.ok) throw new Error("Erro ao buscar status da fila");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar status da fila");
  }
}

export async function processNext(simulatorId: number) {
  try {
    const validId = validateId(simulatorId);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/timed-queue/${validId}/next`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Erro ao processar próximo jogador");
    return res.json();
  } catch {
    throw new Error("Erro ao processar próximo jogador");
  }
}

export async function confirmTurn(queueId: number) {
  try {
    const validId = validateId(queueId);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/timed-queue/${validId}/confirm`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Erro ao confirmar turno");
    return res.json();
  } catch {
    throw new Error("Erro ao confirmar turno");
  }
}

export async function handleMissed(queueId: number) {
  try {
    const validId = validateId(queueId);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/timed-queue/${validId}/missed`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Erro ao processar turno perdido");
    return res.json();
  } catch {
    throw new Error("Erro ao processar turno perdido");
  }
}

// Auth API
export async function login(email: string, password: string) {
  try {
    // Sanitize inputs to prevent XSS
    const sanitizedEmail = sanitizeInput(email);

    const res = await fetch(`${ApiConfig.getBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sanitizedEmail, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Erro ao fazer login");
    }

    return res.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao fazer login"
    );
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  role?: string,
  sellerId?: number
) {
  try {
    // Sanitize inputs to prevent XSS
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const validSellerId =
      sellerId && Number.isInteger(sellerId) ? sellerId : undefined;

    const res = await fetch(`${ApiConfig.getBaseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: sanitizedName,
        email: sanitizedEmail,
        password,
        role,
        sellerId: validSellerId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Erro ao registrar usuário");
    }

    return res.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao registrar usuário"
    );
  }
}

export async function getProfile() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
    const res = await fetch(`${ApiConfig.getBaseUrl()}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Erro ao buscar perfil");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar perfil");
  }
}

export async function getSellers() {
  try {
    const res = await fetch(`${ApiConfig.getBaseUrl()}/auth/sellers`);
    if (!res.ok) throw new Error("Erro ao buscar vendedores");
    const result = await res.json();
    return result.data || result;
  } catch {
    throw new Error("Erro ao buscar vendedores");
  }
}

export async function getSellerQRCode(sellerId: number) {
  try {
    const token = localStorage.getItem("authToken");
    const validId = validateId(sellerId);
    const res = await fetch(
      `${ApiConfig.getBaseUrl()}/sellers/${validId}/qrcode`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) throw new Error("Erro ao buscar QR Code");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar QR Code");
  }
}

// Time Patterns API
export async function fetchTimePatterns() {
  try {
    const res = await fetch(`${ApiConfig.getBaseUrl()}/time-patterns`);
    if (!res.ok) throw new Error("Erro ao buscar padrões de tempo");
    return res.json();
  } catch {
    throw new Error("Erro ao buscar padrões de tempo");
  }
}

export async function createTimePattern(name: string, timeMinutes: number, price: number) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${ApiConfig.getBaseUrl()}/time-patterns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, timeMinutes, price }),
    });
    if (!res.ok) throw new Error("Erro ao criar padrão");
    return res.json();
  } catch {
    throw new Error("Erro ao criar padrão");
  }
}

export async function updateTimePattern(id: number, name: string, timeMinutes: number, price: number) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${ApiConfig.getBaseUrl()}/time-patterns/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, timeMinutes, price }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar padrão");
    return res.json();
  } catch {
    throw new Error("Erro ao atualizar padrão");
  }
}

export async function deleteTimePattern(id: number) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${ApiConfig.getBaseUrl()}/time-patterns/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erro ao deletar padrão");
  } catch {
    throw new Error("Erro ao deletar padrão");
  }
}

export async function movePlayer(queueId: number, newPosition: number) {
  try {
    const validQueueId = validateId(queueId);
    const res = await fetch(`${ApiConfig.getBaseUrl()}/queue/${validQueueId}/move`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPosition }),
    });
    if (!res.ok) throw new Error("Erro ao mover jogador");
    return res.json();
  } catch {
    throw new Error("Erro ao mover jogador");
  }
}
