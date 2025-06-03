// client/src/components/LoginPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      // Send Google ID token to backend
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/google`, {
        token: credential
      });
      const { token, user } = res.data;
      // Store JWT token
      localStorage.setItem('token', token);
      localStorage.setItem('userName', user.name);
      navigate('/create-campaign');
    } catch (err) {
      console.error('Login failed', err);
      alert('Login failed');
    }
  };

  const handleError = () => {
    console.error('Login Failed');
    alert('Google Login Failed');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Xeno CRM - Login</h2>
      <GoogleLogin onSuccess={handleLogin} onError={handleError} />
    </div>
  );
};

export default LoginPage;
