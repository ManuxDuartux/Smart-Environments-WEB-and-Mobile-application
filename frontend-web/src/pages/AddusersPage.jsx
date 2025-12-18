import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AddusersPage.css';

const AddUsersPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [functionRole, setFunctionRole] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [percentage, setPercentage] = useState(50);
  const [environments, setEnvironments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('authToken');

        const envRes = await axios.get('http://localhost:3001/api/environment/list', {
          headers: { Authorization: `Bearer ${token}` }

        });
        setEnvironments(envRes.data);

        const usersRes = await axios.get('http://localhost:3001/api/auth/all-users', {
          headers: { Authorization: `Bearer ${token}` }

        });
        setAllUsers(usersRes.data);
      } catch (error) {
        console.error('Erro ao buscar dados iniciais:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleEmailChange = (selectedEmail) => {
    setEmail(selectedEmail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      let user = allUsers.find(u => u.email === email);

      if (!user) {
        const response = await axios.post('http://localhost:3001/api/auth/register', {
          nome: name,
          email,
          password: 'default123'
        });
        user = response.data.user;
      }

      const id_utilizador = user.id_utilizador;

      await axios.post('http://localhost:3001/api/user-environment/add', {
        id_utilizador,
        id_ambiente: selectedEnvironment,
        funcao: functionRole
      }, {
        headers: { Authorization: `Bearer ${token}` }

      });

      await axios.put('http://localhost:3001/api/user-environment/update-incidence', {
        id_utilizador,
        id_ambiente: selectedEnvironment,
        percentagem_inc: Number(percentage)
      }, {
       headers: { Authorization: `Bearer ${token}` }

      });

      alert('Utilizador adicionado e percentagem de incidência definida com sucesso!');
      setName('');
      setEmail('');
      setFunctionRole('');
      setPercentage(50);
    } catch (error) {
      console.error('Erro ao adicionar utilizador:', error);
      alert('Erro ao adicionar utilizador: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="add-users-container">
      <h2>Add Users to Environment</h2>

      <div className="form-group">
        <label>Email</label>
        <select value={email} onChange={(e) => handleEmailChange(e.target.value)}>
          <option value="">Select user email</option>
          {allUsers.map(user => (
            <option key={user.id_utilizador} value={user.email}>
              {user.email}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Function</label>
        <input type="text" value={functionRole} onChange={(e) => setFunctionRole(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Environment</label>
        <select value={selectedEnvironment} onChange={(e) => setSelectedEnvironment(e.target.value)}>
          <option value="">Select environment</option>
          {environments.map(env => (
            <option key={env.id_ambiente} value={env.id_ambiente}>
              {env.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="percentage-title">Preferences Percentage</label>
        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
        />
        <div className="slider-labels">
          <span>0%</span>
          <span>100%</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>{percentage}%</div>
      </div>

      <button className="add-button" onClick={handleSubmit}>Add User</button>

      <button
        className="add-button"
        style={{ marginTop: '15px' }}
        onClick={() => navigate('/user-list')}
      >
        Environment User List
      </button>
    </div>
  );
};

export default AddUsersPage;