import { useState, useEffect } from 'react';
import { register, getSellers } from '../services/api';

type UserRole = 'ADMIN' | 'SELLER';

interface UserManagementProps {
  userRole: 'MASTER' | 'ADMIN';
}

export default function UserManagement({ userRole }: UserManagementProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SELLER' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      setSuccess(`${formData.role === 'ADMIN' ? 'Administrador' : 'Vendedor'} criado com sucesso!`);
      setFormData({ name: '', email: '', password: '', role: 'SELLER' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '2rem' }}>
        Gerenciar Usuários
      </h2>
      
      {success && (
        <div style={{
          background: '#1a4d1a',
          border: '1px solid #4caf50',
          color: '#4caf50',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}
      
      {error && (
        <div style={{
          background: '#4d1a1a',
          border: '1px solid #dc2626',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
          <input
            type="text"
            name="name"
            placeholder="Nome completo *"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              padding: '0.75rem',
              border: '2px solid #333',
              borderRadius: '8px',
              background: '#000',
              color: 'white'
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
              padding: '0.75rem',
              border: '2px solid #333',
              borderRadius: '8px',
              background: '#000',
              color: 'white'
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
              padding: '0.75rem',
              border: '2px solid #333',
              borderRadius: '8px',
              background: '#000',
              color: 'white'
            }}
          />
          
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{
              padding: '0.75rem',
              border: '2px solid #333',
              borderRadius: '8px',
              background: '#000',
              color: 'white'
            }}
          >
            <option value="SELLER">Vendedor</option>
            {userRole === 'MASTER' && <option value="ADMIN">Administrador</option>}
          </select>
          
          <button
            type="submit"
            disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.password.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) ? '#666' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
}