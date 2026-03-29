import React, { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import './login-register.css';
import Alert from '@mui/material/Alert/Alert';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setMsg('');
    setError('');
    try {
      const res = await api.post('/reset-password', { token, newPassword });
      setMsg(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  }

  if (!token) return <div className="signin">Invalid Token</div>;

  return (
    <div className='signin'>
      <NavLink to='/' className='logo'>
        <img src='images/logo-dark.png' alt='logo' />
      </NavLink>

      <div className='form-details'>
        <h3>Reset your password</h3>
        <p style={{ fontSize: '13px', marginTop: '10px' }}>
          Choose a new password for your account.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor='newPassword'>New Password</label>
          <input
            type='password'
            id='newPassword'
            placeholder='At least 6 characters'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <label htmlFor='confirmPassword'>Confirm New Password</label>
          <input
            type='password'
            id='confirmPassword'
            placeholder='Confirm New Password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type='submit' id='submit'>Save changes and sign in</button>
        </form>
        {msg && <Alert severity="success" style={{ marginTop: '20px' }}>{msg}</Alert>}
        {error && <Alert severity="error" style={{ marginTop: '20px' }}>{error}</Alert>}
      </div>
    </div>
  );
};

export default ResetPassword;
