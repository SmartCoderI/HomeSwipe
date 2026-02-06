import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginButton: React.FC = () => {
  const { user, isAuthenticated, login, register, logout, loading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [registering, setRegistering] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setRegistering(true);
      await register(username, email, password);
      setShowRegisterForm(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.message === 'Username already taken') {
        setError('Username already taken');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const resetForms = () => {
    setShowLoginForm(false);
    setShowRegisterForm(false);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div style={styles.userContainer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>👤</div>
          <span style={styles.userEmail}>{user.displayName || user.email}</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    );
  }

  if (showRegisterForm) {
    return (
      <div style={styles.loginFormContainer}>
        <form onSubmit={handleRegister} style={styles.registerForm}>
          <div style={styles.formTitle}>Create Account</div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={registering}
              style={{ ...styles.submitButton, opacity: registering ? 0.5 : 1 }}
            >
              {registering ? 'Creating...' : 'Register'}
            </button>
            <button
              type="button"
              onClick={resetForms}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
          <div style={styles.switchLink}>
            Already have an account?{' '}
            <span
              onClick={() => {
                setShowRegisterForm(false);
                setShowLoginForm(true);
                setError('');
              }}
              style={styles.linkText}
            >
              Login
            </span>
          </div>
        </form>
      </div>
    );
  }

  if (showLoginForm) {
    return (
      <div style={styles.loginFormContainer}>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <div style={styles.formTitle}>Sign In</div>
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
              onClick={resetForms}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
          <div style={styles.switchLink}>
            Don't have an account?{' '}
            <span
              onClick={() => {
                setShowLoginForm(false);
                setShowRegisterForm(true);
                setError('');
              }}
              style={styles.linkText}
            >
              Register
            </span>
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
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #e0e0e0',
    position: 'fixed',
    right: '24px',
    top: '48px',
    width: '220px',
    zIndex: 9999,
  },
  registerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #e0e0e0',
    position: 'fixed',
    right: '24px',
    top: '48px',
    width: '220px',
    zIndex: 9999,
  },
  formTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px',
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
  switchLink: {
    fontSize: '10px',
    color: '#666',
    textAlign: 'center',
    marginTop: '4px',
  },
  linkText: {
    color: '#4285f4',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
