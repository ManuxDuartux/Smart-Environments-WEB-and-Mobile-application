// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

axios.defaults.baseURL = 'http://localhost:3001'; 

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        // Enviar dados para o backend e obter o token
        const response = await axios.post('/api/auth/login', formData);
        
        // Armazenar o token no localStorage após o login
        const { token, user } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', user?.role || 'user'); 

        // Redirecionar com base no tipo de utilizador
        if (user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/create');
        }
    } catch (err) {
        alert('Erro ao fazer login: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="login-button">Login</button>
          <a href="http://localhost:3001/api/auth/google">
  <button className="google-login-button">Login com Google</button>
</a>

        </form>
        <div className="forgot-password-link">
          <p>Forgot about password? <a href="/forgot-password">Reset here</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
