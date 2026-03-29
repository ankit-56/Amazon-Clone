import React, { useState } from 'react';
import './login-register.css';
import { NavLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';
import api from '../../api';
import { useEffect } from 'react';

const SignIn = () => {
  const GOOGLE_CLIENT_ID = "105499246510-ouk9rdv4kpmbpdkl5bhmar7al6a3uqi0.apps.googleusercontent.com";
  const GITHUB_CLIENT_ID = "Ov23liGSnFpYtavhvyms";

  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });
      google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", width: "100%", border_radius: 8 }
      );
    }
  }, []);

  function handleGitHubLogin() {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
  }

  async function handleGoogleResponse(resp) {
    const jwtToken = resp.credential;
    try {
      const res = await api.post('/oauth/login', {
        idToken: jwtToken
      });
      if (res.data.status) {
        document.querySelector(".success-alert").style.display = "flex";
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (e) {
      console.error(e);
      alert('Google Login verification failed on backend. Please check your Google Console Authorized Origins.');
    }
  }

  const [signInInfo, setSignInInfo] = useState({
    email: "",
    password: ""
  });

  function formUpdate(e) {
    const {name, value} = e.target;
    
    setSignInInfo(function() {
      return {
        ...signInInfo,
        [name]:value
      }
    })
  }

  const [errorMessage, setErrorMessage] = useState([]);
  const navigate = useNavigate();

  async function sendData(e) {
    e.preventDefault();
    const { email, password } = signInInfo; 

    try {
      await api.post('/login', {
        email,
        password
      });

      setSignInInfo(function() {
        return {
          ...signInInfo,
          email: "", password: ""
        }
      });

      document.querySelector(".error-alert").style.display = "none";
      document.querySelector(".success-alert").style.display = "flex";

      setTimeout(function() {
        navigate('/');
      }, 1000)

    } catch (error) {
      try {
        document.querySelector(".success-alert").style.display = "none";
        document.querySelector(".error-alert").style.display = "flex";
        const errors = error.response.data.message;
        const temp = [];
        
        for (let i = 0; i < errors.length; i++) {
          temp.push(errors[i].msg);
        }
        setErrorMessage(temp);
      } catch(err) {
        console.log(error)
      }
    }
  }


  return (
    <div className='signin'>
      <NavLink to='/' className='logo'>
        <img src='images/logo-dark.png' alt='logo' />
      </NavLink>

      <Alert variant="outlined" severity="warning" className='alert error-alert'>
        <AlertTitle className='alert-title'>There were some errors</AlertTitle>
        <ul>
          { 
            errorMessage.map(function(error, index) {
              return (
                <li key={index}> {error} </li>
              )
            })
          }
        </ul>
      </Alert>

      <Alert variant="outlined" className='alert success-alert'>Logged-in successfully!</Alert>

      <div className='form-details'>
        <h3>Sign-In</h3>
        <form method='post' action='/' onSubmit={ sendData }>
          <label htmlFor='email'>Email</label>
          <input type='email' name='email' id='email' placeholder='Email Address' onChange={ formUpdate } value={ signInInfo.email } required />
          <label htmlFor='password'>Password</label>
          <input type='password' name='password' id='password' placeholder='Password' onChange={ formUpdate } value={ signInInfo.password } required />
          <NavLink to="/forgot-password" title="Click to reset password" style={{ fontSize: '12px', alignSelf: 'flex-end', marginTop: '4px', textDecoration: 'none', color: '#0066c0' }}>Forgot your password?</NavLink>
          <button type='submit' id='submit'>Continue</button>
        </form>

        <div className="social-login">
          <p style={{ fontSize: '12px', textAlign: 'center', margin: '10px 0', color: '#777' }}>or sign in with</p>
          <div id="googleSignInDiv" style={{ marginBottom: '10px' }}></div>
          <button className="social-btn" type="button" onClick={handleGitHubLogin}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GH" /> Sign in with GitHub
          </button>
        </div>
      </div>

      <div className='new-to-amazon'>
        <p><span>New to Amazon?</span></p>
        <NavLink to='/register'>
          <button>Create your Amazon account</button>
        </NavLink>
      </div>
    </div>
  )
}

export default SignIn;