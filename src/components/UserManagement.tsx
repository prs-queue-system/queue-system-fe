import { useState, useMemo, useEffect, useCallback } from "react";
import { register, fetchUsers } from "../services/api";

type UserRole = "ADMIN" | "SELLER";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  instagram?: string;
  inQueue: boolean;
  sellerId?: number;
  simulatorId?: number;
}

interface UserManagementProps {
  userRole: "MASTER" | "ADMIN";
}

export default function UserManagement({ userRole }: UserManagementProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SELLER" as UserRole,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const userData = await fetchUsers();
      setUsers(userData);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();

    // WebSocket connection with retry
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected for user management');
          reconnectAttempts = 0;
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PLAYER_UPDATE') {
              loadUsers();
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
          }
        };
        
        ws.onerror = () => {
          console.log('WebSocket error, falling back to polling');
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              if (!document.hidden) loadUsers();
            }, 5000);
          }
        };
        
        ws.onclose = () => {
          if (reconnectAttempts < 3) {
            setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, Math.pow(2, reconnectAttempts) * 1000);
          } else if (!pollInterval) {
            pollInterval = setInterval(() => {
              if (!document.hidden) loadUsers();
            }, 5000);
          }
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            if (!document.hidden) loadUsers();
          }, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    )
      return;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      setSuccess(
        `${
          formData.role === "ADMIN" ? "Administrador" : "Vendedor"
        } criado com sucesso!`
      );
      setFormData({ name: "", email: "", password: "", role: "SELLER" });
      // Reload users after successful creation
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = useMemo(
    () =>
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim(),
    [formData]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MASTER': return 'Master';
      case 'ADMIN': return 'Administrador';
      case 'SELLER': return 'Vendedor';
      case 'PLAYER': return 'Jogador';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MASTER': return '#dc2626';
      case 'ADMIN': return '#ea580c';
      case 'SELLER': return '#0891b2';
      case 'PLAYER': return '#16a34a';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <h2 style={{ color: "white", marginBottom: "2rem" }}>
        Gerenciar Usuários
      </h2>

      {success && (
        <div
          style={{
            background: "#1a4d1a",
            border: "1px solid #4caf50",
            color: "#4caf50",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#4d1a1a",
            border: "1px solid #dc2626",
            color: "#dc2626",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "white", marginBottom: "1rem" }}>Criar Novo Usuário</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr) auto",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Nome completo *"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              padding: "0.75rem",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#000",
              color: "white",
            }}
          />

          <input
            type="email"
            name="email"
            placeholder="E-mail *"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              padding: "0.75rem",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#000",
              color: "white",
            }}
          />

          <input
            type="password"
            name="password"
            placeholder="Senha *"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              padding: "0.75rem",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#000",
              color: "white",
            }}
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{
              padding: "0.75rem",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#000",
              color: "white",
            }}
          >
            <option value="SELLER">Vendedor</option>
            {userRole === "MASTER" && (
              <option value="ADMIN">Administrador</option>
            )}
          </select>

          <button
            type="submit"
            disabled={loading || isFormInvalid}
            style={{
              padding: "0.75rem 1.5rem",
              background: isFormInvalid ? "#666" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isFormInvalid ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>

      {/* Users List */}
      <div>
        <h3 style={{ color: "white", marginBottom: "1rem" }}>
          Lista de Usuários ({users.length})
        </h3>
        
        {loadingUsers ? (
          <div style={{ color: "white", textAlign: "center", padding: "2rem" }}>
            Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", padding: "2rem" }}>
            Nenhum usuário encontrado
          </div>
        ) : (
          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr",
                gap: "1rem",
                padding: "1rem",
                background: "#222",
                borderBottom: "1px solid #333",
                fontWeight: "bold",
                color: "#ccc",
                fontSize: "0.9rem",
              }}
            >
              <div>Nome</div>
              <div>Email</div>
              <div>Função</div>
              <div>Status</div>
              <div>Criado em</div>
              <div>Atualizado em</div>
            </div>

            {/* Table Body */}
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr",
                  gap: "1rem",
                  padding: "1rem",
                  borderBottom: "1px solid #333",
                  color: "white",
                  fontSize: "0.9rem",
                }}
              >
                <div style={{ fontWeight: "500" }}>{user.name}</div>
                <div style={{ color: "#ccc" }}>{user.email}</div>
                <div>
                  <span
                    style={{
                      background: getRoleColor(user.role),
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                    }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      background: user.inQueue ? "#16a34a" : "#6b7280",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {user.inQueue ? "Na fila" : "Livre"}
                  </span>
                </div>
                <div style={{ color: "#ccc" }}>{formatDate(user.createdAt)}</div>
                <div style={{ color: "#ccc" }}>{formatDate(user.updatedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
