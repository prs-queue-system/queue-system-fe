/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo } from "react";
import { createPlayer, fetchPlayers, checkEmailExists } from "../services/api";

type Player = { id: number; name: string };

export default function Player(){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [instagram, setInstagram] = useState("");
    const [players, setPlayers] = useState<Player[]>([]);
    const [createError, setCreateError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showPlayerList, setShowPlayerList] = useState(true);
    const playersPerPage = 10;
    const handleCreate = async () => {
        if (!name.trim() || !email.trim()) return;
        setCreateError('');
        try {
            await createPlayer(name, email);
            setName("");
            setEmail("");
            setPhone("");
            setInstagram("");
            await loadPlayers();
        } catch (err: any) {
            setCreateError(err.message);
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

    const filteredPlayers = useMemo(() => {
        return players.filter(player => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [players, searchTerm]);

    const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
    const startIndex = (currentPage - 1) * playersPerPage;
    const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + playersPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const checkEmail = async () => {
            if (!email.trim() || !email.includes('@')) {
                setEmailError('');
                return;
            }
            
            setCheckingEmail(true);
            try {
                const exists = await checkEmailExists(email);
                setEmailError(exists ? 'Este e-mail já está em uso' : '');
            } catch {
                setEmailError('');
            } finally {
                setCheckingEmail(false);
            }
        };

        const timeoutId = setTimeout(checkEmail, 500);
        return () => clearTimeout(timeoutId);
    }, [email]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white', margin: 0 }}>Lista de Jogadores</h2>
                <div 
                    onClick={() => setShowPlayerList(!showPlayerList)}
                    style={{
                        width: '50px',
                        height: '24px',
                        borderRadius: '12px',
                        background: showPlayerList ? '#dc2626' : '#666',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.3s ease'
                    }}
                >
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: showPlayerList ? '28px' : '2px',
                        transition: 'left 0.3s ease'
                    }} />
                </div>
            </div>
            
            {showPlayerList && (
                <>
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Buscar jogadores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                width: '300px',
                                border: '2px solid #333',
                                borderRadius: '8px',
                                background: '#000',
                                color: 'white'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '1rem', color: 'white' }}>
                        Mostrando {paginatedPlayers.length} de {filteredPlayers.length} jogadores
                    </div>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: '1rem',
                        marginBottom: '1rem'
                    }}>
                        {paginatedPlayers.map(player => (
                            <div key={player.id} style={{ 
                                color: 'white', 
                                padding: '1rem',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>#{player.id}</div>
                                <div>{player.name}</div>
                            </div>
                        ))}
                    </div>
                    
                    {totalPages > 1 && (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: currentPage === 1 ? '#666' : '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Anterior
                            </button>
                            
                            <span style={{ color: 'white' }}>
                                Página {currentPage} de {totalPages}
                            </span>
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: currentPage === totalPages ? '#666' : '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </>
            )}

            <h2 style={{ color: 'white', marginTop: '2rem' }}>Criar Jogador</h2>
            
            {createError && (
                <div style={{
                    background: '#4d1a1a',
                    border: '1px solid #dc2626',
                    color: '#dc2626',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    {createError}
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '1rem', alignItems: 'start', marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Nome do jogador *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        border: '2px solid #333',
                        borderRadius: '8px',
                        background: '#000',
                        color: 'white',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                />
                <div style={{ position: 'relative', minHeight: '60px' }}>
                    <input
                        type="email"
                        placeholder="E-mail *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '0.5rem',
                            border: `2px solid ${emailError ? '#dc2626' : '#333'}`,
                            borderRadius: '8px',
                            background: '#000',
                            color: 'white',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                    {checkingEmail && <small style={{ color: '#666', position: 'absolute', top: '100%', left: 0, fontSize: '0.8rem', marginTop: '2px' }}>Verificando...</small>}
                    {emailError && <small style={{ color: '#dc2626', position: 'absolute', top: '100%', left: 0, fontSize: '0.8rem', marginTop: '2px' }}>{emailError}</small>}
                </div>
                <input
                    type="tel"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        border: '2px solid #333',
                        borderRadius: '8px',
                        background: '#000',
                        color: 'white',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                />
                <input
                    type="text"
                    placeholder="@instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        border: '2px solid #333',
                        borderRadius: '8px',
                        background: '#000',
                        color: 'white',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                />
                <button 
                    onClick={handleCreate}
                    disabled={!name.trim() || !email.trim() || !!emailError || checkingEmail}
                    style={{
                        padding: '0.5rem 1rem',
                        background: (!name.trim() || !email.trim() || !!emailError || checkingEmail) ? '#666' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (!name.trim() || !email.trim() || !!emailError || checkingEmail) ? 'not-allowed' : 'pointer'
                    }}
                >
                    Criar
                </button>
            </div>
        </div>
    );
}