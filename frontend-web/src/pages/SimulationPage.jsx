import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SimulationPage.css';
import avatarImg from '../assets/avatar.png';
import domesticImg from '../assets/Domestic space.jpg';
import businessImg from '../assets/Business space.png';
import leisureImg from '../assets/leisure space.png';

const SimulationPage = () => {
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [users, setUsers] = useState([]);
  const [insideUsers, setInsideUsers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [preferencesList, setPreferencesList] = useState([]);
  const [resultTable, setResultTable] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const initialGuestPercentage = location.state?.guestPercentage ?? 100;

  useEffect(() => {
    fetchEnvironments();
    fetchPreferenciasTipos();
  }, []);

  useEffect(() => {
    if (selectedEnvironment) {
      fetchUsers(selectedEnvironment);
      fetchSimulationHistory(selectedEnvironment);
      setInsideUsers([]);
      setGuests([]);
    }
  }, [selectedEnvironment]);

  const fetchSimulationHistory = async (envId) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`http://localhost:3001/api/simulation/history/${envId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  setHistory(data);
console.log('Histórico carregado:', data);

};


  const fetchEnvironments = async () => {
    const token = localStorage.getItem('authToken');
    const res = await fetch('http://localhost:3001/api/environment/list', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEnvironments(data);
    if (data.length > 0) setSelectedEnvironment(data[0].id_ambiente);
  };

  const fetchUsers = async (envId) => {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`http://localhost:3001/api/user-environment/users/${envId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
  };

  const fetchPreferenciasTipos = async () => {
    const res = await fetch('http://localhost:3001/api/preferencias/tipos');
    const data = await res.json();
    setPreferencesList(data);
  };

  const handleDrop = (ev) => {
    ev.preventDefault();
    const userId = ev.dataTransfer.getData('userId');
    if (userId.startsWith('guest-')) {
      const guest = guests.find(g => g.id === userId);
      if (guest && !insideUsers.some(u => u.id === guest.id)) {
        setInsideUsers(prev => [...prev, guest]);
      }
    } else {
      const user = users.find(u => u.id_utilizador.toString() === userId);
      if (user && !insideUsers.some(u => u.id_utilizador === user.id_utilizador)) {
        setInsideUsers(prev => [...prev, user]);
      }
    }
  };

  const allowDrop = (ev) => ev.preventDefault();

  const addGuest = () => {
    const id = `guest-${Date.now()}`;
    const defaultPreferences = {};
    preferencesList.forEach(pref => {
      defaultPreferences[pref.nome.toLowerCase()] = pref.valor_minimo;
    });
    setGuests(prev => [...prev, {
      id,
      nome: `Guest ${prev.length + 1}`,
      percentagem: initialGuestPercentage,
      preferencias: defaultPreferences
    }]);
  };

  const updateGuest = (id, key, value) => {
    setGuests(prev =>
      prev.map(g => g.id === id
        ? { ...g, preferencias: { ...g.preferencias, [key]: value } }
        : g
      )
    );
  };

  const updateGuestPercentage = (id, value) => {
    setGuests(prev =>
      prev.map(g => g.id === id ? { ...g, percentagem: value } : g)
    );
  };

  const startSimulation = async () => {
    const token = localStorage.getItem('authToken');
    const guestPreferencesFormatted = insideUsers
      .filter(u => u.id?.startsWith('guest-'))
      .map(g => ({
        id: g.id,
        nome: g.nome,
        preferencias: preferencesList.map(p => ({
          id_tipo_preferencia: p.id_tipo_preferencia,
          valor: g.preferencias[p.nome.toLowerCase()],
          percentagem_inc: g.percentagem
        }))
      }));

    const body = {
      id_ambiente: selectedEnvironment,
      utilizadoresSelecionados: insideUsers.filter(u => u.id_utilizador).map(u => u.id_utilizador),
      guestPreferences: guestPreferencesFormatted
    };

    const res = await fetch('http://localhost:3001/api/simulation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    const now = new Date();
    const hour = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    setResultTable(result.detalhes.map((det, i) => ({
      nome: det.nome,
      unidade: det.unidade,
      contribuidores: det.contribuidores,
      valorFinal: `${result.valoresCalculados[i].nome === "Temperature"
        ? result.valoresCalculados[i].valor_calculado.toFixed(2)
        : result.valoresCalculados[i].valor_calculado}${det.unidade || ''}`,
      formula: det.formula
    })));

    setChatMessages(prev => [...prev, `${date} ${hour}: Simulation updated.`]);
    await fetchSimulationHistory(selectedEnvironment); // <- NOVO

  };

  const getEnvironmentImage = () => {
    const selected = environments.find(e => e.id_ambiente === Number(selectedEnvironment));
    if (!selected) return '';
    switch (selected.id_tipo) {
      case 1: return domesticImg;
      case 3: return businessImg;
      case 2: return leisureImg;
      default: return '';
    }
  };

  return (
    <div className="simulation-container">
      <h1 className="header-title">Simulation</h1>
      <p className="sub-title">Choose the environment</p>

      <select className="environment-select" value={selectedEnvironment}
        onChange={(e) => setSelectedEnvironment(e.target.value)}>
        {environments.map(env => (
          <option key={env.id_ambiente} value={env.id_ambiente}>{env.nome}</option>
        ))}
      </select>

      <div className="simulation-area">
        <div className="avatars-list" onDrop={(e) => {
          e.preventDefault();
          const userId = e.dataTransfer.getData('userId');
          setInsideUsers(prev => prev.filter(u => u.id_utilizador?.toString() !== userId && u.id !== userId));
        }} onDragOver={(e) => e.preventDefault()}>
          <strong>Registered Users</strong>
          {users.map(user => (
            <div key={user.id_utilizador} className="avatar-draggable" draggable
              onDragStart={(e) => e.dataTransfer.setData('userId', user.id_utilizador)}>
              <img src={avatarImg} alt="avatar" />
              <span>{user.nome}</span>
            </div>
          ))}
          <strong style={{ marginTop: '20px' }}>Guests</strong>
          {guests.map(guest => (
            <div key={guest.id} className="avatar-draggable" draggable
              onDragStart={(e) => e.dataTransfer.setData('userId', guest.id)}>
              <img src={avatarImg} alt="avatar" />
              <span>{guest.nome}</span>
            </div>
          ))}
          <button className="add-button" onClick={addGuest}>Add Guest</button>
        </div>

        <div className="drop-area" onDrop={handleDrop} onDragOver={allowDrop}>
          <img src={getEnvironmentImage()} alt="Environment" className="environment-img" />
          <div className="dropped-users">
            {insideUsers.map(user => (
              <div key={user.id_utilizador || user.id} className="inside-user" draggable
                onDragStart={(e) => e.dataTransfer.setData('userId', user.id_utilizador || user.id)}>
                <img src={avatarImg} alt="avatar" />
                <span>{user.nome} ({user.percentagem}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="guest-sliders-row">
          {guests.map((guest, index) => (
            <div key={guest.id} className="guest-slider-set">
              <div className="avatar-draggable">
                <img src={avatarImg} alt="avatar" />
                <span>Guest {index + 1}</span>
              </div>
              <label>Percentage: {guest.percentagem}%</label>
              <input type="range" min="0" max="100" value={guest.percentagem}
                onChange={(e) => updateGuestPercentage(guest.id, parseInt(e.target.value))} />
              {preferencesList.map(pref => {
                const key = pref.nome.toLowerCase();
                return (
                  <div key={pref.id_tipo_preferencia}>
                    <label>{pref.nome}: {guest.preferencias[key]} {pref.unidades_preferencia}</label>
                    <input
  type="range"
  min={pref.valor_minimo}
  max={pref.valor_maximo}
  step={pref.nome.toLowerCase().includes('temperatura') ? 0.5 : 1}
  value={Number(guest.preferencias[key])}
  onChange={(e) =>
    updateGuest(guest.id, key, pref.nome.toLowerCase().includes('temperatura')
      ? parseFloat(e.target.value)
      : parseInt(e.target.value)
    )
  }
/>

                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <button className="simulation-button" onClick={startSimulation}>Start Simulation</button>

      {resultTable.length > 0 && (
        <div className="result-table">
          <h3>Simulation Results</h3>
          <table>
            <thead>
              <tr><th>User</th>{resultTable.map((pref, i) => <th key={i}>{pref.nome}</th>)}</tr>
              <tr><th>Unit</th>{resultTable.map((pref, i) => <th key={i}>{pref.unidade}</th>)}</tr>
            </thead>
            <tbody>
              {(() => {
                const allUsers = Array.from(new Set(
                  resultTable.flatMap(pref => pref.contribuidores.map(c => c.nome))
                ));
                return allUsers.map((user, i) => (
                  <tr key={i}>
                    <td>{user}</td>
                    {resultTable.map((pref, j) => {
                      const found = pref.contribuidores.find(c => c.nome === user);
                      return <td key={j}>{found ? `${found.valor} (${found.peso}%)` : '-'}</td>;
                    })}
                  </tr>
                ));
              })()}
              <tr style={{ fontWeight: 'bold', background: '#2c3e50' }}>
                <td>Result</td>
                {resultTable.map((pref, i) => <td key={i}>{pref.valorFinal}</td>)}
              </tr>
              <tr style={{ fontStyle: 'italic', background: '#2c3e50', color: '#dfe6ec' }}>
                <td>Formula</td>
                {resultTable.map((pref, i) => (
                  <td key={i} style={{ fontSize: '0.85em' }}>{pref.formula}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

     {history.length > 0 && (
  <div className="history-table">
    <h3>Simulation History</h3>
    {history.map(sim => (
      <div key={sim.id_simulacao} className="history-item">
        <p><strong>Simulation ID:</strong> {sim.id_simulacao}</p>
        <p><strong>Date:</strong> {new Date(sim.data).toLocaleString()}</p>
        <p><strong>Contributors:</strong></p>
        <ul>
          {sim.contribuidores.map((c, idx) => (
            <li key={idx}>{c.nome} ({c.percentagem}%)</li>
          ))}
        </ul>

        <table>
          <thead>
            <tr>
              {sim.preferencias.map((p, i) => (
                <th key={i}>{p.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {sim.preferencias.map((p, i) => (
                <td key={i}>{p.valor}{p.unidade}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    ))}
  </div>
)}

      <div className="chat-box">
        {chatMessages.map((msg, idx) => <p key={idx}>{msg}</p>)}
      </div>
    </div>
  );
};

export default SimulationPage;
