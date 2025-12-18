import React, { useEffect, useState } from 'react';
import '../styles/AdminBackendPage.css';
import EditIcon from '../assets/edit icon.png';
import RemoveIcon from '../assets/remove icon.png';

const AdminBackendPage = () => {
  const [users, setUsers] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPref, setEditingPref] = useState(null);
  const [editingEnv, setEditingEnv] = useState(null);
  const [tempPrefEdit, setTempPrefEdit] = useState(null);


  // Novo estado
  const [selectedUserEnv, setSelectedUserEnv] = useState({});
  const [userPrefValues, setUserPrefValues] = useState({});

  const tipoAmbienteMap = { 1: 'Domestic', 2: 'Leisure', 3: 'Business' };

  const fetchAll = async () => {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const [u, p, e] = await Promise.all([
      fetch('http://localhost:3001/api/admin/users', { headers }).then(res => res.json()),
      fetch('http://localhost:3001/api/admin/preferencias', { headers }).then(res => res.json()),
      fetch('http://localhost:3001/api/admin/ambientes', { headers }).then(res => res.json()),
    ]);

    setUsers(u);
    setPreferences(p);
    setEnvironments(e);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const saveEdit = async (type, data, id) => {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`http://localhost:3001/api/admin/${type}/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) fetchAll();
  };

  const handleSaveEnvironment = (env) => {
    const body = {
      nome: env.nome,
      id_tipo: env.id_tipo,
      id_utilizador: env.id_dono || null,
    };
    saveEdit('ambientes', body, env.id_ambiente);
    setEditingEnv(null);
  };

  const deleteItem = async (type, id) => {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`http://localhost:3001/api/admin/${type}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchAll();
  };

  const addPreference = async () => {
    const nome = prompt('Name of the new preference:');
    const unidades = prompt('Unit of the preference:');
    const valor_minimo = parseFloat(prompt('Minimum value:'));
    const valor_maximo = parseFloat(prompt('Maximum value:'));

    if (!nome || !unidades || isNaN(valor_minimo) || isNaN(valor_maximo)) {
      return alert('All fields are required and must be valid numbers.');
    }

    const token = localStorage.getItem('authToken');
    await fetch('http://localhost:3001/api/admin/preferencias', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, unidades_preferencia: unidades, valor_minimo, valor_maximo })
    });

    fetchAll();
  };

  const handleEnvChange = (env, key, value) => {
    const updated = { ...env, [key]: value };
    setEnvironments(prev => prev.map(e => e.id_ambiente === env.id_ambiente ? updated : e));
  };

  const handleUserEnvironmentChange = async (userId, ambienteId) => {
    const token = localStorage.getItem('authToken');
    setSelectedUserEnv(prev => ({ ...prev, [userId]: ambienteId }));

    const res = await fetch(`http://localhost:3001/api/admin/preferencias/ultimas/${userId}/${ambienteId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    setUserPrefValues(prev => ({
      ...prev,
      [userId]: data.reduce((acc, pref) => {
        acc[pref.id_tipo_preferencia] = pref.valor;
        return acc;
      }, {})
    }));
  };

  const handleSliderChange = (userId, prefId, value) => {
    setUserPrefValues(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [prefId]: value }
    }));
  };

  const saveUserPreferences = async (userId) => {
    const ambienteId = selectedUserEnv[userId];
    const prefs = userPrefValues[userId];

    const payload = {
      id_utilizador: userId,
      id_ambiente: ambienteId,
      preferencias: Object.entries(prefs).map(([id, valor]) => ({
        id_tipo_preferencia: parseInt(id),
        valor: parseFloat(valor)
      }))
    };

    const token = localStorage.getItem('authToken');
    await fetch('http://localhost:3001/api/admin/preferencias/admin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    alert('Preferências guardadas com sucesso.');
  };

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>

      {/* USERS */}
       <div className="section">
        <h2>Users</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(user => (
              <React.Fragment key={user.id_utilizador}>
                <tr>
                  <td>{editingUser === user.id_utilizador ? <input defaultValue={user.nome} onChange={e => user.nome = e.target.value} /> : user.nome}</td>
                  <td>{editingUser === user.id_utilizador ? <input defaultValue={user.email} onChange={e => user.email = e.target.value} /> : user.email}</td>
                  <td className="action-buttons">
                    {editingUser === user.id_utilizador ? (
                      <>
                        <button className="save-button" onClick={() => saveEdit('users', user, user.id_utilizador)}>Save</button>
                        <button className="delete-button" onClick={() => setEditingUser(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="icon-button" onClick={() => setEditingUser(user.id_utilizador)} title="Edit">
                          <img src={EditIcon} alt="Edit" />
                        </button>
                        <button className="icon-button" onClick={() => deleteItem('users', user.id_utilizador)} title="Remove">
                          <img src={RemoveIcon} alt="Remove" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>

                {/* Cartão de Preferências */}
                <tr>
                  <td colSpan={3}>
                    <div className="user-preferences-card">
                      <label>Environment:</label>
                      <select
                        value={selectedUserEnv[user.id_utilizador] || ''}
                        onChange={e => handleUserEnvironmentChange(user.id_utilizador, parseInt(e.target.value))}
                      >
                        <option value="">Select Environment</option>
                        {environments.map(env => (
                          <option key={env.id_ambiente} value={env.id_ambiente}>{env.nome}</option>
                        ))}
                      </select>

                      {selectedUserEnv[user.id_utilizador] && preferences.map(pref => (
                        <div key={pref.id_tipo_preferencia} className="slider-row">
                          <label>{pref.nome} ({pref.unidades_preferencia})</label>
                          <input
  type="range"
  min={pref.valor_minimo}
  max={pref.valor_maximo}
  step={pref.nome === 'Temperatura' ? 0.5 : 1}
  value={userPrefValues[user.id_utilizador]?.[pref.id_tipo_preferencia] || pref.valor_minimo}
  onChange={e => handleSliderChange(user.id_utilizador, pref.id_tipo_preferencia, e.target.value)}
/>

                          <span>{userPrefValues[user.id_utilizador]?.[pref.id_tipo_preferencia] || pref.valor_minimo}</span>
                        </div>
                      ))}

                      {selectedUserEnv[user.id_utilizador] && (
                        <button className="save-button" onClick={() => saveUserPreferences(user.id_utilizador)}>
                          Guardar Preferências
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
{/* PREFERENCES */}
<div className="section">
  <h2>
    Preferences <button className="add-button" onClick={addPreference}>Add</button>
  </h2>
  <table className="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Unit</th>
        <th>Min</th>
        <th>Max</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {preferences.map(p => (
        <tr key={p.id_tipo_preferencia}>
          <td>
            {editingPref === p.id_tipo_preferencia
              ? <input
                  defaultValue={p.nome}
                  onChange={e => setTempPrefEdit(prev => ({ ...prev, nome: e.target.value }))}
                />
              : ({ Temperatura: 'Temperature', Luminosidade: 'Luminosity', Humidade: 'Humidity' }[p.nome] || p.nome)
            }
          </td>
          <td>
            {editingPref === p.id_tipo_preferencia
              ? <input
                  defaultValue={p.unidades_preferencia}
                  onChange={e => setTempPrefEdit(prev => ({ ...prev, unidades_preferencia: e.target.value }))}
                />
              : p.unidades_preferencia
            }
          </td>
          <td>
            {editingPref === p.id_tipo_preferencia ? (
              <>
                <input
                  type="range"
                  min="0"
                  max={tempPrefEdit?.valor_maximo || 100}
                  step="1"
                  value={tempPrefEdit?.valor_minimo || 0}
                  onChange={e =>
                    setTempPrefEdit(prev => ({
                      ...prev,
                      valor_minimo: parseFloat(e.target.value)
                    }))
                  }
                />
                <span>{tempPrefEdit?.valor_minimo}</span>
              </>
            ) : (
              <span>{p.valor_minimo}</span>
            )}
          </td>
          <td>
            {editingPref === p.id_tipo_preferencia ? (
              <>
                <input
                  type="range"
                  min={tempPrefEdit?.valor_minimo || 0}
                  max="1000"
                  step="1"
                  value={tempPrefEdit?.valor_maximo || 100}
                  onChange={e =>
                    setTempPrefEdit(prev => ({
                      ...prev,
                      valor_maximo: parseFloat(e.target.value)
                    }))
                  }
                />
                <span>{tempPrefEdit?.valor_maximo}</span>
              </>
            ) : (
              <span>{p.valor_maximo}</span>
            )}
          </td>
          <td className="action-buttons">
            {editingPref === p.id_tipo_preferencia ? (
              <>
                <button
                  className="save-button"
                  onClick={() => {
                    saveEdit('preferencias', tempPrefEdit, p.id_tipo_preferencia);
                    setEditingPref(null);
                    setTempPrefEdit(null);
                  }}
                >
                  Save
                </button>
                <button className="delete-button" onClick={() => setEditingPref(null)}>Cancel</button>
              </>
            ) : (
              <>
                <button
                  className="icon-button"
                  onClick={() => {
                    setEditingPref(p.id_tipo_preferencia);
                    setTempPrefEdit({ ...p });
                  }}
                  title="Edit"
                >
                  <img src={EditIcon} alt="Edit" />
                </button>
                <button
                  className="icon-button"
                  onClick={() => deleteItem('preferencias', p.id_tipo_preferencia)}
                  title="Remove"
                >
                  <img src={RemoveIcon} alt="Remove" />
                </button>
              </>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>



      {/* ENVIRONMENTS */}
      <div className="section">
        <h2>Environments</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Owner</th><th>Actions</th></tr></thead>
          <tbody>
            {environments.map(env => (
              <tr key={env.id_ambiente}>
                <td>{editingEnv === env.id_ambiente ? <input defaultValue={env.nome} onChange={e => env.nome = e.target.value} /> : env.nome}</td>
                <td>
                  {editingEnv === env.id_ambiente ? (
                    <select value={env.id_tipo} onChange={e => handleEnvChange(env, 'id_tipo', parseInt(e.target.value))}>
                      <option value={1}>Domestic</option>
                      <option value={2}>Leisure</option>
                      <option value={3}>Business</option>
                    </select>
                  ) : tipoAmbienteMap[env.id_tipo]}
                </td>
                <td>
                  {editingEnv === env.id_ambiente ? (
                    <select value={env.id_dono} onChange={e => handleEnvChange(env, 'id_dono', parseInt(e.target.value))}>
                      {users.map(u => <option key={u.id_utilizador} value={u.id_utilizador}>{u.nome}</option>)}
                    </select>
                  ) : env.nome_dono}
                </td>
                <td className="action-buttons">
                  {editingEnv === env.id_ambiente ? (
                    <>
                      <button className="save-button" onClick={() => handleSaveEnvironment(env)}>Save</button>
                      <button className="delete-button" onClick={() => setEditingEnv(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="icon-button" onClick={() => setEditingEnv(env.id_ambiente)} title="Edit">
                        <img src={EditIcon} alt="Edit" />
                      </button>
                      <button className="icon-button" onClick={() => deleteItem('ambientes', env.id_ambiente)} title="Remove">
                        <img src={RemoveIcon} alt="Remove" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBackendPage;
