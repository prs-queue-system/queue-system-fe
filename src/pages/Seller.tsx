import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchPlayers, fetchAllQueues, createQueue, removePlayer, startTimedQueue, getQueueStatus, processNext, confirmTurn, handleMissed, type Player, type SimulatorQueue } from '../services/api';
import './Seller.css';

type QueueStatus = { isActive: boolean; currentPlayer?: { id: number; name: string }; timeRemaining?: number };
type ActiveQueueItem = { id: number; player: { id: number; name: string }; status: string; timeLeft: number };

export default function Seller() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [queues, setQueues] = useState<SimulatorQueue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [queueStatuses, setQueueStatuses] = useState<Record<number, QueueStatus>>({});
  const [activeItems, setActiveItems] = useState<Record<number, ActiveQueueItem[]>>({});
  const [user, setUser] = useState<any>(null);

  const loadQueues = useCallback(async () => {
    try {
      const queuesData = await fetchAllQueues();
      setQueues(queuesData || []);
      
      const statuses: Record<number, QueueStatus> = {};
      const activeItemsMap: Record<number, ActiveQueueItem[]> = {};
      for (const queue of queuesData || []) {
        try {
          const status = await getQueueStatus(queue.simulatorId);
          if (Array.isArray(status.data)) {
            activeItemsMap[queue.simulatorId] = status.data;
            const currentItem = status.data.find((item: ActiveQueueItem) => item.status === 'ACTIVE' || item.status === 'CONFIRMED');
            statuses[queue.simulatorId] = { 
              isActive: !!currentItem,
              currentPlayer: currentItem ? currentItem.player : undefined
            };
          } else {
            statuses[queue.simulatorId] = status.data;
          }
        } catch {
          statuses[queue.simulatorId] = { isActive: false };
          activeItemsMap[queue.simulatorId] = [];
        }
      }
      setQueueStatuses(statuses);
      setActiveItems(activeItemsMap);
    } catch (error) {
      console.error('Error loading queues:', error);
    }
  }, []);

  const loadPlayers = useCallback(async () => {
    try {
      const playersData = await fetchPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'SELLER') {
        window.location.href = '/login';
        return;
      }
      setUser(parsedUser);
    } else {
      window.location.href = '/login';
      return;
    }

    const loadData = async () => {
      try {
        await Promise.all([loadPlayers(), loadQueues()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const queueInterval = setInterval(loadQueues, 1000);
    const playerInterval = setInterval(loadPlayers, 5000);
    return () => {
      clearInterval(queueInterval);
      clearInterval(playerInterval);
    };
  }, [loadQueues, loadPlayers]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return players.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const handleAddToQueue = async (simulatorId: number) => {
    if (!selectedPlayer) return;
    
    try {
      await createQueue(selectedPlayer.id, simulatorId);
      setSelectedPlayer(null);
      setSearchTerm('');
      await Promise.all([loadQueues(), loadPlayers()]); // Reload both queues and players
    } catch (error) {
      console.error('Error adding player to queue:', error);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlayer(id);
      await loadQueues();
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  const handleStartTimed = async (simulatorId: number) => {
    try {
      await startTimedQueue(simulatorId);
      await loadQueues();
    } catch (error) {
      console.error('Error starting timed queue:', error);
    }
  };

  const handleProcessNext = async (simulatorId: number) => {
    try {
      await processNext(simulatorId);
      await loadQueues();
    } catch (error) {
      console.error('Error processing next:', error);
    }
  };

  const handleConfirmTurn = async (queueId: number) => {
    try {
      await confirmTurn(queueId);
      await loadQueues();
    } catch (error) {
      console.error('Error confirming turn:', error);
    }
  };

  const handleMissedTurn = async (queueId: number) => {
    try {
      await handleMissed(queueId);
      await loadQueues();
    } catch (error) {
      console.error('Error handling missed turn:', error);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="seller-container">
      <div className="seller-header">
        <div style={{
          width: '300px',
          height: '82px',
          backgroundImage: 'url("https://loja.prsim.com.br/wp-content/uploads/2025/04/prs-preto-branco-vermelho-300x82.png")',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        </div>
        <h1 style={{ flex: 1 }}>Sistema de Vendas - Filas</h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'white' }}>Olá, {user.name}</span>
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Sair
            </button>
          </div>
        )}
      </div>

      <div className="search-section">
        <h2>Buscar Jogador</h2>
        <input
          type="text"
          placeholder="Digite o nome do jogador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {searchTerm && (
          <div className="players-grid">
            {filteredPlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <p>ID: {player.id}</p>
                </div>
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className={`select-button ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                >
                  {selectedPlayer?.id === player.id ? 'Selecionado' : 'Selecionar'}
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
        </div>
      )}

      <div className="queues-section">
        <h2>Filas Disponíveis</h2>
        <div className="queues-grid">
          {queues.map(sim => {
            const status = queueStatuses[sim.simulatorId];
            return (
              <div key={sim.simulatorId} className="queue-card">
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {sim.simulatorName}
                  {(() => {
                    const currentItem = activeItems[sim.simulatorId]?.find(item => item.status === 'ACTIVE' || item.status === 'CONFIRMED');
                    if (!currentItem) return null;
                    
                    if (currentItem.status === 'CONFIRMED') {
                      return <span style={{ color: '#4caf50', fontSize: '0.9rem' }}>jogando</span>;
                    }
                    
                    if (currentItem.status === 'ACTIVE') {
                      return <span style={{ color: '#dc2626', fontSize: '0.9rem' }}>aguardando</span>;
                    }
                    
                    return null;
                  })()
                  }
                </h3>
                
                {status?.isActive && (
                  <div className="timed-status">
                    {(() => {
                      const currentItem = activeItems[sim.simulatorId]?.find(item => item.status === 'ACTIVE' || item.status === 'CONFIRMED');
                      if (!currentItem) return null;
                      
                      if (currentItem.status === 'ACTIVE') {
                        const timeDisplay = currentItem.timeLeft ? ` - ${Math.floor(currentItem.timeLeft / 60000)}:${String(Math.floor((currentItem.timeLeft % 60000) / 1000)).padStart(2, '0')}` : '';
                        return <p>Aguardando pelo jogador: {status.currentPlayer?.name}{timeDisplay}</p>;
                      }
                      
                      return (
                        <p>Jogador atual: {status.currentPlayer?.name}
                          {currentItem.timeLeft ? ` - ${Math.floor(currentItem.timeLeft / 60000)}:${String(Math.floor((currentItem.timeLeft % 60000) / 1000)).padStart(2, '0')}` : ''}
                        </p>
                      );
                    })()
                    }
                  </div>
                )}
                
                <div className="queue-controls">
                  <button
                    onClick={() => handleAddToQueue(sim.simulatorId)}
                    disabled={!selectedPlayer}
                    className="add-button"
                  >
                    Adicionar à Fila
                  </button>
                  
                  <button
                    onClick={() => handleStartTimed(sim.simulatorId)}
                    disabled={status?.isActive}
                    className="timed-button"
                  >
                    Iniciar Fila Temporizada
                  </button>
                  
                  <button
                    onClick={() => handleProcessNext(sim.simulatorId)}
                    disabled={!status?.isActive}
                    className="next-button"
                  >
                    Próximo Jogador
                  </button>
                </div>
                
                <ul className="queue-list">
                  {(sim.queue || []).slice().reverse().map(q => (
                    <li key={q.id} className="queue-item">
                      <span>{q.player?.name ?? "Sem nome"}</span>
                      <div className="item-controls">
                        <button
                          onClick={() => handleRemove(q.id)}
                          className="remove-button"
                        >
                          Remover
                        </button>
                        {(() => {
                          const currentItem = activeItems[sim.simulatorId]?.find(item => (item.status === 'ACTIVE' || item.status === 'CONFIRMED') && item.player.name === q.player?.name);
                          if (!currentItem) return null;
                          
                          return (
                            <>
                              {currentItem.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleConfirmTurn(currentItem.id)}
                                  className="confirm-button"
                                >
                                  Confirmar
                                </button>
                              )}
                              <button
                                onClick={() => handleMissedTurn(currentItem.id)}
                                className="missed-button"
                              >
                                Perdeu Turno
                              </button>
                            </>
                          );
                        })()
                        }
                      </div>
                    </li>
                  ))}
                  {(!sim.queue || sim.queue.length === 0) && (
                    <li className="empty-queue">Fila vazia</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}