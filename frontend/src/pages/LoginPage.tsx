/**
 * Login page for user authentication.
 * Simple basis login form with username and password.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import S3Logo from '../components/S3Logo';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login fejlede. Tjek dit brugernavn og kodeord.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px'
      }}>
        <ThemeToggle />
      </div>

      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <S3Logo height={80} />
          </div>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginTop: '8px'
          }}>
            Log ind for at fortsætte
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Brugernavn
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Indtast brugernavn"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Kodeord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Indtast kodeord"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {isLoading ? 'Logger ind...' : 'Log ind'}
          </Button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'var(--bg-primary)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <strong>Test brugere:</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li>Admin: <code style={{ color: 'var(--text-primary)' }}>admin / admin123</code></li>
            <li>Sagsbehandler: <code style={{ color: 'var(--text-primary)' }}>sagsbehandler / sag123</code></li>
            <li>Læser: <code style={{ color: 'var(--text-primary)' }}>laaser / laeser123</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
