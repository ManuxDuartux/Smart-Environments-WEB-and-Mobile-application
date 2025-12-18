import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EnvironmentUserListPage.css';

const EnvironmentUserListPage = () => {
  const [users, setUsers] = useState([]);
  const [guestPercentage, setGuestPercentage] = useState(20);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');

  const navigate = useNavigate();

  const fetchEnvironments = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/environment/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEnvironments(data);
      if (data.length > 0) setSelectedEnvironment(data[0].id_ambiente);
    } catch (error) {
      console.error('Erro ao buscar ambientes:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!selectedEnvironment) return;
    try {
      const response = await fetch(`http://localhost:3001/api/user-environment/users/${selectedEnvironment}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar utilizadores:', error);
    }
  }, [selectedEnvironment]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSliderChange = async (userId, newValue) => {
    try {
      setUsers(prev =>
        prev.map(user =>
          user.id_utilizador === userId
            ? { ...user, percentagem: Number(newValue) }
            : user
        )
      );

      await fetch('http://localhost:3001/api/user-environment/update-incidence', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          id_utilizador: userId,
          id_ambiente: selectedEnvironment,
          percentagem_inc: Number(newValue)
        })
      });
    } catch (error) {
      console.error('Erro ao atualizar percentagem dinamicamente:', error);
    }
  };

  return (
    <div className="environment-user-list-container">
      <h1 className="header-title">Environment User List</h1>

      <label style={{ color: 'white', fontWeight: 'bold' }}>Choose Environment:</label>
      <select
        value={selectedEnvironment}
        onChange={(e) => setSelectedEnvironment(e.target.value)}
        className="environment-select"
      >
        {environments.map(env => (
          <option key={env.id_ambiente} value={env.id_ambiente}>{env.nome}</option>
        ))}
      </select>

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Function</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id_utilizador}>
              <td>
                {user.nome} {user.isOwner ? <span className="owner-label">(owner)</span> : null}
                <br />
                <small>{user.email}</small>
              </td>
              <td>{user.funcao || '-'}</td>
              <td>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={user.percentagem}
                  className="slider-range"
                  onChange={(e) => handleSliderChange(user.id_utilizador, e.target.value)}
                />
                <span style={{ marginLeft: '10px' }}>{user.percentagem}%</span>
              </td>
            </tr>
          ))}
          <tr>
            <td><strong>Guest</strong></td>
            <td>-</td>
            <td>
              <input
                type="range"
                min="0"
                max="100"
                value={guestPercentage}
                className="slider-range"
                onChange={(e) => setGuestPercentage(Number(e.target.value))}
              />
              <span style={{ marginLeft: '10px' }}>{guestPercentage}%</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="simulation-button-wrapper">
        <button
          className="simulation-button"
          onClick={() =>
            navigate('/start-simulation', {
              state: { guestPercentage }
            })
          }
        >
          Go To Simulation
        </button>
      </div>
    </div>
  );
};

export default EnvironmentUserListPage;
