import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginButton: React.FC = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setLoggingIn(true);
      await login(email, password);
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        setError('User not found');
      } else if (error.code === 'auth/wrong-password') {
        setError('Wrong password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div style={styles.userContainer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>👤</div>
          <span style={styles.userEmail}>{user.email}</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    );
  }

  if (showLoginForm) {
    return (
      <div style={styles.loginFormContainer}>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={loggingIn}
              style={{ ...styles.submitButton, opacity: loggingIn ? 0.5 : 1 }}
            >
              {loggingIn ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLoginForm(false);
                setError('');
                setEmail('');
                setPassword('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowLoginForm(true)}
      style={styles.loginButton}
    >
      🔐 Login
    </button>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  loading: {
    padding: '4px 8px',
    color: '#999',
    fontSize: '11px',
  },
  userContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  avatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontSize: '10px',
  },
  userEmail: {
    fontSize: '11px',
    color: '#666',
    fontWeight: 400,
  },
  logoutButton: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#999',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginFormContainer: {
    position: 'relative',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    position: 'absolute',
    right: 0,
    top: '8px',
    minWidth: '200px',
    zIndex: 1000,
  },
  input: {
    padding: '6px 8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '12px',
    outline: 'none',
  },
  error: {
    color: '#f44336',
    fontSize: '10px',
    marginTop: '-2px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '6px',
    marginTop: '2px',
  },
  submitButton: {
    flex: 1,
    padding: '6px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  cancelButton: {
    flex: 1,
    padding: '6px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
