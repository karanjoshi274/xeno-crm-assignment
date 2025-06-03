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
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/google`, {
        token: credential
      });
      const { token, user } = res.data;
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-8 max-w-md w-full shadow-xl text-center">
        <h2 className="text-white text-3xl font-bold mb-6">Xeno CRM - Login</h2>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleLogin} onError={handleError} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
