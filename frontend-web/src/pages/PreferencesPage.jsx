import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/PreferencesPage.css';

const PreferencesPage = () => {
  const [preferencias, setPreferencias] = useState([]);
  const [userId, setUserId] = useState(null);
  const [ambientes, setAmbientes] = useState([]);
  const [selectedAmbiente, setSelectedAmbiente] = useState('');

  const translatePreferenceName = (ptName) => {
    switch (ptName.toLowerCase()) {
      case 'temperatura': return 'Temperature';
      case 'humidade': return 'Humidity';
      case 'luminosidade': return 'Luminosity';
      default: return ptName;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = payload.userId || payload.id;
    setUserId(id);

    fetchAmbientes(token);
    fetchTiposPreferencia();
  }, []);

  const fetchAmbientes = async (token) => {
    try {
      const res = await axios.get('http://localhost:3001/api/environment/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAmbientes(res.data);
      if (res.data.length > 0) setSelectedAmbiente(res.data[0].id_ambiente);
    } catch (err) {
      console.error("Erro ao buscar ambientes:", err);
    }
  };

  const fetchTiposPreferencia = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/preferencias/tipos');
      setPreferencias(res.data.map(p => ({
        ...p,
        valor: p.valor_minimo
      })));
    } catch (err) {
      console.error("Erro ao buscar preferências:", err);
    }
  };

  const handleChange = (index, value) => {
    setPreferencias(prev => {
      const updated = [...prev];
      updated[index].valor = Number(value);
      return updated;
    });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('authToken');

    const body = {
      id_utilizador: userId,
      id_ambiente: selectedAmbiente,
      preferencias: preferencias.map(p => ({
        id_tipo_preferencia: p.id_tipo_preferencia,
        valor: p.valor
      }))
    };

    console.log('Dados a enviar:', body);

    try {
      if (!userId) {
        alert("User not authenticated. Please log in again.");
        return;
      }

      await axios.post('http://localhost:3001/api/preferencias', body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Preferences saved successfully!');
    } catch (err) {
      console.error('Erro ao guardar preferências:', err.response?.data || err.message);
      alert('Failed to save preferences.');
    }
  };

  return (
    <div className="preferences-page">
      <h2>Define your Preferences</h2>

      <label className="dropdown-label">Choose Environment:</label>
      <select
        value={selectedAmbiente}
        onChange={e => setSelectedAmbiente(e.target.value)}
        className="dropdown"
      >
        {ambientes.map(a => (
          <option key={a.id_ambiente} value={a.id_ambiente}>{a.nome}</option>
        ))}
      </select>

      <div className="preferences-list">
        {preferencias.map((pref, index) => (
          <div key={pref.id_tipo_preferencia} className="preference-card">
            <label>{translatePreferenceName(pref.nome)} ({pref.unidades_preferencia})</label>
          <input
  type="range"
  min={pref.valor_minimo}
  max={pref.valor_maximo}
  step={pref.nome.toLowerCase().includes('temperatura') ? 0.5 : 1}
  value={pref.valor}
  onChange={(e) => handleChange(index, e.target.value)}
/>


            <span>{pref.valor} {pref.unidades_preferencia}</span>
          </div>
        ))}
      </div>

      <button className="save-btn" onClick={handleSubmit}>Save Preferences</button>
    </div>
  );
};

export default PreferencesPage;
