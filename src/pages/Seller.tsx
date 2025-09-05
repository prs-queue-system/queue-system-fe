/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchPlayers,
  fetchAllQueues,
  createQueue,
  removePlayer,
  getQueueStatus,
  processNext,
  confirmTurn,
  getSellerQRCode,
  fetchTimePatterns,
  createPlayer,
  movePlayer,
} from "../services/api";
import type { Player, SimulatorQueue } from "../types";
import "../styles/pages/Seller.css";
import F1Car from "../components/F1Car";

type QueueStatus = {
  isActive: boolean;
  currentPlayer?: Player;
  timeRemaining?: number;
};
type ActiveQueueItem = {
  id: number;
  player: Player;
  status: string;
  timeLeft: number;
  position: number;
};
type User = { id: number; name: string; role: string };
type QRCodeData = { qrCode: string; registerUrl: string };

const formatTime = (timeLeft: number): string => {
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function Seller() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [queues, setQueues] = useState<SimulatorQueue[]>([]);
  const [timePatterns, setTimePatterns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [queueStatuses, setQueueStatuses] = useState<
    Record<number, QueueStatus>
  >({});
  const [activeItems, setActiveItems] = useState<
    Record<number, ActiveQueueItem[]>
  >({});
  const [user, setUser] = useState<User | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "" });
  const [registerLoading, setRegisterLoading] = useState(false);

  const loadQueues = useCallback(async () => {
    try {
      const queuesData = await fetchAllQueues();
      setQueues(queuesData || []);

      const statuses: Record<number, QueueStatus> = {};
      const activeItemsMap: Record<number, ActiveQueueItem[]> = {};
      const statusPromises = (queuesData || []).map(async (queue) => {
        try {
          const status = await getQueueStatus(queue.simulatorId);
          return { queue, status };
        } catch {
          return { queue, status: null };
        }
      });

      const results = await Promise.allSettled(statusPromises);

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          const { queue, status } = result.value;
          if (status) {
            if (Array.isArray(status.data)) {
              activeItemsMap[queue.simulatorId] = status.data;
              const currentItem = status.data.find(
                (item: ActiveQueueItem) =>
                  item.status === "ACTIVE" || item.status === "CONFIRMED"
              );
              statuses[queue.simulatorId] = {
                isActive: !!currentItem,
                currentPlayer: currentItem ? currentItem.player : undefined,
              };
            } else {
              statuses[queue.simulatorId] = status.data;
            }
          } else {
            statuses[queue.simulatorId] = { isActive: false };
            activeItemsMap[queue.simulatorId] = [];
          }
        }
      });
      setQueueStatuses(statuses);
      setActiveItems(activeItemsMap);
    } catch (error) {
      console.error("Error loading queues:", error);
    }
  }, []);

  const loadPlayers = useCallback(async () => {
    try {
      const playersData = await fetchPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }, []);

  const loadTimePatterns = useCallback(async () => {
    try {
      const patterns = await fetchTimePatterns();
      setTimePatterns(patterns || []);
    } catch (error) {
      console.error("Error loading time patterns:", error);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== "SELLER") {
          window.location.href = "/login";
          return;
        }
        setUser(parsedUser);
      } catch {
        window.location.href = "/login";
        return;
      }
    } else {
      window.location.href = "/login";
      return;
    }

    const loadData = async () => {
      try {
        await Promise.all([loadPlayers(), loadQueues(), loadTimePatterns()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // WebSocket connection with retry
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let queueInterval: number | null = null;
    let playerInterval: number | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          if (queueInterval) {
            clearInterval(queueInterval);
            queueInterval = null;
          }
          if (playerInterval) {
            clearInterval(playerInterval);
            playerInterval = null;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'QUEUE_UPDATE' || data.type === 'TIMED_QUEUE_UPDATE') {
              loadQueues();
            }
            if (data.type === 'PLAYER_UPDATE') {
              loadPlayers();
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
          }
        };
        
        ws.onerror = () => {
          console.log('WebSocket error, falling back to polling');
          if (!queueInterval) {
            queueInterval = setInterval(loadQueues, 3000);
          }
          if (!playerInterval) {
            playerInterval = setInterval(loadPlayers, 5000);
          }
        };
        
        ws.onclose = () => {
          if (reconnectAttempts < 3) {
            setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, Math.pow(2, reconnectAttempts) * 1000);
          } else {
            if (!queueInterval) {
              queueInterval = setInterval(loadQueues, 3000);
            }
            if (!playerInterval) {
              playerInterval = setInterval(loadPlayers, 5000);
            }
          }
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        if (!queueInterval) {
          queueInterval = setInterval(loadQueues, 3000);
        }
        if (!playerInterval) {
          playerInterval = setInterval(loadPlayers, 5000);
        }
      }
    };
    
    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (queueInterval) clearInterval(queueInterval);
      if (playerInterval) clearInterval(playerInterval);
    };
  }, [loadQueues, loadPlayers, loadTimePatterns]);

  // Timer to update time remaining every second
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveItems(prevActiveItems => {
        const updatedActiveItems = { ...prevActiveItems };
        let hasChanges = false;

        Object.keys(updatedActiveItems).forEach((simulatorId: string) => {
          const items = updatedActiveItems[parseInt(simulatorId)];
          if (items && items.length > 0) {
            const updatedItems = items.map((item: ActiveQueueItem) => {
              if ((item.status === 'ACTIVE' || item.status === 'CONFIRMED') && item.timeLeft > 0) {
                hasChanges = true;
                return { ...item, timeLeft: Math.max(0, item.timeLeft - 1000) };
              }
              return item;
            });
            updatedActiveItems[parseInt(simulatorId)] = updatedItems;
          }
        });

        return hasChanges ? updatedActiveItems : prevActiveItems;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return players.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const handleAddToQueue = async (simulatorId: number) => {
    if (!selectedPlayer || !selectedPattern) return;

    try {
      await createQueue(
        selectedPlayer.id,
        simulatorId,
        selectedPattern.timeMinutes,
        selectedPattern.price
      );
      setSelectedPlayer(null);
      setSearchTerm("");
      setSelectedPattern(null);
      await Promise.all([loadQueues(), loadPlayers()]);
    } catch (error) {
      console.error(
        "Error adding player to queue:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlayer(id);
      await loadQueues();
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  const handleConfirmTurn = async (queueId: number) => {
    try {
      await confirmTurn(queueId);
      await loadQueues();
    } catch (error) {
      console.error("Error confirming turn:", error);
    }
  };

  const handleMissedTurn = async (simulatorId: number) => {
    try {
      await processNext(simulatorId);
      await loadQueues();
    } catch (error) {
      console.error("Error handling missed turn:", error);
    }
  };

  const [movingPlayer, setMovingPlayer] = useState<number | null>(null);

  const handleMovePlayer = async (queueId: number, direction: 'up' | 'down') => {
    if (movingPlayer) return;
    setMovingPlayer(queueId);
    
    try {
      const simulatorId = Object.keys(activeItems).find(id => 
        activeItems[parseInt(id)]?.some(item => item.id === queueId)
      );
      
      if (!simulatorId) return;
      
      const queueItems = activeItems[parseInt(simulatorId)] || [];
      const waitingPlayers = queueItems
        .filter(item => item.status === 'WAITING')
        .sort((a, b) => a.position - b.position);
      
      const currentIndex = waitingPlayers.findIndex(item => item.id === queueId);
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= waitingPlayers.length) return;
      
      const targetPlayer = waitingPlayers[newIndex];
      
      await movePlayer(queueId, targetPlayer.position);
      await loadQueues();
    } catch (error) {
      console.error("Error moving player:", error);
    } finally {
      setMovingPlayer(null);
    }
  };

  const handleShowQRCode = async () => {
    if (!user) return;

    setLoadingQR(true);
    try {
      const qrData = await getSellerQRCode(user.id);
      setQRCodeData(qrData);
      setShowQRCode(true);
    } catch (error) {
      console.error("Error loading QR Code:", error);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.email.trim()) return;

    setRegisterLoading(true);
    try {
      const newPlayer = await createPlayer(
        registerForm.name,
        registerForm.email,
        registerForm.phone,
        user?.id
      );
      setSelectedPlayer(newPlayer);
      setRegisterForm({ name: "", email: "", phone: "" });
      setShowRegisterForm(false);
      await loadPlayers();
    } catch (error) {
      console.error("Error registering player:", error);
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="seller-container">
      <div className="seller-header">
        <div
          style={{
            width: "300px",
            height: "82px",
            backgroundImage:
              'url("https://loja.prsim.com.br/wp-content/uploads/2025/04/prs-preto-branco-vermelho-300x82.png")',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ></div>
        <h1 style={{ flex: 1 }}>Sistema de Vendas - Filas</h1>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ color: "white" }}>Olá, {user.name}</span>
            <button
              onClick={handleShowQRCode}
              disabled={loadingQR}
              style={{
                padding: "0.5rem",
                background: "#333",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
              title="Meu QR Code"
            >
              {loadingQR ? "..." : "📱"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              style={{
                padding: "0.5rem 1rem",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Sair
            </button>
          </div>
        )}
      </div>

      <div className="search-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Buscar Jogador</h2>
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            style={{
              padding: "0.5rem 1rem",
              background: "#333",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {showRegisterForm ? "Cancelar" : "Cadastrar Novo"}
          </button>
        </div>

        {showRegisterForm && (
          <form onSubmit={handleRegisterPlayer} style={{ marginBottom: "1rem", padding: "1rem", background: "#1a1a1a", borderRadius: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "white" }}>Nome *</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    padding: "0.5rem",
                    border: "2px solid #333",
                    borderRadius: "6px",
                    background: "#000",
                    color: "white",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "white" }}>Email *</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    padding: "0.5rem",
                    border: "2px solid #333",
                    borderRadius: "6px",
                    background: "#000",
                    color: "white",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "white" }}>Telefone</label>
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    padding: "0.5rem",
                    border: "2px solid #333",
                    borderRadius: "6px",
                    background: "#000",
                    color: "white",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={registerLoading || !registerForm.name.trim() || !registerForm.email.trim()}
                style={{
                  padding: "0.5rem 1rem",
                  background: registerLoading || !registerForm.name.trim() || !registerForm.email.trim() ? "#666" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: registerLoading || !registerForm.name.trim() || !registerForm.email.trim() ? "not-allowed" : "pointer"
                }}
              >
                {registerLoading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        )}

        <input
          type="text"
          placeholder="Digite o nome do jogador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {searchTerm && (
          <div className="players-grid">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <p>ID: {player.id}</p>
                </div>
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className={`select-button ${
                    selectedPlayer?.id === player.id ? "selected" : ""
                  }`}
                >
                  {selectedPlayer?.id === player.id
                    ? "Selecionado"
                    : "Selecionar"}
                </button>
              </div>
            ))}
            {filteredPlayers.length === 0 && (
              <p className="no-results">Nenhum jogador encontrado</p>
            )}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div className="selected-player">
          <h3>Jogador Selecionado: {selectedPlayer.name}</h3>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1rem",
              alignItems: "end",
              justifyContent: "center",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "white",
                }}
              >
                Padrão de Tempo
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                {timePatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                    style={{
                      padding: "0.75rem 1rem",
                      border: `2px solid ${selectedPattern?.id === pattern.id ? "#dc2626" : "#333"}`,
                      borderRadius: "6px",
                      background: selectedPattern?.id === pattern.id ? "#dc2626" : "#000",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {pattern.name}<br/>
                    <small>{pattern.timeMinutes}min - R$ {pattern.price.toFixed(2)}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="queues-section">
        <h2>Filas Disponíveis</h2>
        <div className="queues-grid">
          {queues.map((sim) => {
            const status = queueStatuses[sim.simulatorId];
            return (
              <div key={sim.simulatorId} className="queue-card" style={{ position: "relative" }}>
                {(() => {
                  const currentItem = activeItems[sim.simulatorId]?.find(
                    (item) => item.status === "ACTIVE" || item.status === "CONFIRMED"
                  );
                  return currentItem && currentItem.status === "CONFIRMED" ? <F1Car isActive={true} /> : null;
                })()}
                <h3
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {sim.simulatorName}
                  {activeItems[sim.simulatorId]?.find(
                    (item) =>
                      item.status === "ACTIVE" || item.status === "CONFIRMED"
                  )?.status === "CONFIRMED" ? (
                    <span style={{ color: "#4caf50", fontSize: "0.9rem" }}>
                      jogando
                    </span>
                  ) : activeItems[sim.simulatorId]?.find(
                      (item) =>
                        item.status === "ACTIVE" || item.status === "CONFIRMED"
                    )?.status === "ACTIVE" ? (
                    <span style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                      aguardando
                    </span>
                  ) : null}
                </h3>

                {status?.isActive && (
                  <div className="timed-status">
                    {(() => {
                      const currentItem = activeItems[sim.simulatorId]?.find(
                        (item) =>
                          item.status === "ACTIVE" ||
                          item.status === "CONFIRMED"
                      );
                      if (!currentItem) return null;

                      if (currentItem.status === "ACTIVE") {
                        const timeDisplay = currentItem.timeLeft
                          ? ` - ${formatTime(currentItem.timeLeft)}`
                          : "";
                        return (
                          <p>
                            Aguardando pelo jogador:{" "}
                            {status.currentPlayer?.name}
                            {timeDisplay}
                          </p>
                        );
                      }

                      return (
                        <p>
                          Jogador atual: {status.currentPlayer?.name}
                          {currentItem.timeLeft
                            ? ` - ${formatTime(currentItem.timeLeft)}`
                            : ""}
                        </p>
                      );
                    })()}
                  </div>
                )}

                <div className="queue-controls">
                  <button
                    onClick={() => handleAddToQueue(sim.simulatorId)}
                    disabled={!selectedPlayer || !selectedPattern}
                    style={{
                      width: "100%",
                      padding: "1rem 2rem",
                      background: !selectedPlayer || !selectedPattern ? "#666" : "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      cursor: !selectedPlayer || !selectedPattern ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Adicionar à Fila
                  </button>
                </div>

                <div className="queue-list">
                  {(() => {
                    const currentItem = activeItems[sim.simulatorId]?.find(
                      (item) => item.status === "ACTIVE" || item.status === "CONFIRMED"
                    );
                    const queueItems = (sim.queue || []).slice();
                    
                    // Find current player either from activeItems or queueStatuses
                    const currentPlayerId = currentItem?.player?.id || status?.currentPlayer?.id;
                    const currentPlayerInQueue = currentPlayerId ? queueItems.find(q => q.player?.id === currentPlayerId) : null;
                    const nextPlayers = queueItems.filter(q => q.player?.id !== currentPlayerId);

                    return (
                      <>
                        {currentPlayerInQueue && (
                          <>
                            <div style={{ color: "white", fontSize: "0.9rem", marginBottom: "0.5rem", fontWeight: "bold" }}>Jogando</div>
                            <div style={{
                              background: "rgba(220, 38, 38, 0.3)",
                              border: "1px solid #dc2626",
                              borderRadius: "6px",
                              padding: "0.75rem",
                              marginBottom: "1rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}>
                              <span style={{ color: "white" }}>{currentPlayerInQueue?.player?.name || currentItem?.player?.name || status?.currentPlayer?.name || "Sem nome"}</span>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => handleRemove(currentPlayerInQueue.id)} className="remove-button">Remover</button>
                                {currentItem && currentItem.status === "ACTIVE" && (
                                  <button onClick={() => handleConfirmTurn(currentItem.id)} className="confirm-button">Confirmar</button>
                                )}
                                <button onClick={() => handleMissedTurn(sim.simulatorId)} className="missed-button">Próximo jogador</button>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {nextPlayers.length > 0 && (
                          <>
                            <div style={{ color: "white", fontSize: "0.9rem", marginBottom: "0.5rem", fontWeight: "bold" }}>Próximo</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                              {nextPlayers.map((q, index) => (
                                <li key={q.id} style={{
                                  background: "#1a1a1a",
                                  border: "1px solid #333",
                                  borderRadius: "6px",
                                  padding: "0.75rem",
                                  marginBottom: "0.5rem",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center"
                                }}>
                                  <span style={{ color: "white" }}>{index + 1}. {q.player?.name ?? "Sem nome"}</span>
                                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    {nextPlayers.length >= 2 && (
                                      <>
                                        <button 
                                          onClick={() => handleMovePlayer(q.id, 'up')}
                                          disabled={index === 0}
                                          style={{
                                            padding: "0.25rem 0.5rem",
                                            background: index === 0 ? "#666" : "#333",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: index === 0 ? "not-allowed" : "pointer",
                                            fontSize: "0.8rem"
                                          }}
                                          title="Subir posição"
                                        >
                                          ↑
                                        </button>
                                        <button 
                                          onClick={() => handleMovePlayer(q.id, 'down')}
                                          disabled={index === nextPlayers.length - 1}
                                          style={{
                                            padding: "0.25rem 0.5rem",
                                            background: index === nextPlayers.length - 1 ? "#666" : "#333",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: index === nextPlayers.length - 1 ? "not-allowed" : "pointer",
                                            fontSize: "0.8rem"
                                          }}
                                          title="Descer posição"
                                        >
                                          ↓
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => handleRemove(q.id)} className="remove-button">Remover</button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        
                        {(!sim.queue || sim.queue.length === 0) && (
                          <div style={{ color: "#666", textAlign: "center", padding: "2rem" }}>Fila vazia</div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showQRCode && qrCodeData && (
        <div className="qr-popup-overlay" onClick={() => setShowQRCode(false)}>
          <div className="qr-popup" onClick={(e) => e.stopPropagation()}>
            <div className="qr-header">
              <h3>Meu QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div className="qr-content">
              <p>
                Compartilhe este QR Code para que clientes se cadastrem como
                seus indicados:
              </p>
              <div className="qr-image">
                <img src={qrCodeData.qrCode} alt="QR Code" />
              </div>
              <div className="qr-url">
                <p>URL: {qrCodeData.registerUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
