import { useEffect, useState, useCallback } from "react";
import { createPlayer, fetchPlayers } from "../services/api";

type Player = { id: number; name: string };

export default function Player(){
    const [name, setName] = useState("");
    const [players, setPlayers] = useState<Player[]>([]);
    const handleCreate = async () => {
        if (!name.trim()) return;
        try {
            await createPlayer(name);
            setName("");
            await loadPlayers();
        } catch (error) {
            console.error('Error creating player:', error);
        }
    };
    const loadPlayers = useCallback(async () => {
        try {
            const playersList = await fetchPlayers();
            setPlayers(playersList);
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }, []);

    useEffect(() => {
        loadPlayers();
    }, [loadPlayers]);

    return (
        <div>
            <h2>Lista de Jogadores</h2>
            <ul>
                {players.map(player => (
                    <li key={player.id}>{player.id} - {player.name}</li>
                ))}
            </ul>

            <h2>Criar Jogador</h2>
            <input
                type="text"
                placeholder="Nome do jogador"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button onClick={handleCreate}>Criar</button>
        </div>
    );
}