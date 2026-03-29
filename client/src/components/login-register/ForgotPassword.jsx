import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api';
import './login-register.css';
import Alert from '@mui/material/Alert/Alert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const res = await api.post('/forgot-password', { email });
      setMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  }

  return (
    <div className='signin'>
      <NavLink to='/' className='logo'>
        <img src='images/logo-dark.png' alt='logo' />
      </NavLink>

      <div className='form-details'>
        <h3>Password assistance</h3>
        <p style={{ fontSize: '13px', marginTop: '10px' }}>
          Enter the email address associated with your account.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor='email'>Email</label>
          <input
            type='email'
            id='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type='submit' id='submit'>Continue</button>
        </form>
        {msg && <Alert severity="success" style={{ marginTop: '20px' }}>{msg}</Alert>}
        {error && <Alert severity="error" style={{ marginTop: '20px' }}>{error}</Alert>}
      </div>
    </div>
  );
};

export default ForgotPassword;
