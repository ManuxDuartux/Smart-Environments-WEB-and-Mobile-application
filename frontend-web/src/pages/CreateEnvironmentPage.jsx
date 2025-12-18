import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CreateEnvironmentPage.css';

import preferencesIcon from '../assets/preferences card icon.png'; 
import businessIcon from '../assets/Business-environment logo.png';
import domesticIcon from '../assets/domestic-environment logo.png';
import leisureIcon from '../assets/Leisure-environment logo.png';

const CreateEnvironmentPage = () => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  const handleNameChange = (e) => setName(e.target.value);
  const handleTypeSelect = (type) => {
    console.log("Tipo selecionado:", type);
    setSelectedType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const typeIdMap = {
        business: 3,
        domestic: 1,
        leisure: 2,
      };

      const typeId = typeIdMap[selectedType];

      if (!typeId) {
        alert("Tipo de ambiente inválido!");
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Token de autenticação ausente');
        return;
      }

      localStorage.setItem('environmentType', selectedType);
      console.log("Tipo de ambiente armazenado no localStorage:", selectedType);

      await axios.post('http://localhost:3001/api/environment/create', {
        nome: name,
        id_tipo: typeId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      alert('Ambiente criado com sucesso!');
      navigate('/environment-created');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar ambiente: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="create-environment-container">
      <div style={{ position: 'absolute', top: '20px', right: '30px', cursor: 'pointer' }} onClick={() => navigate('/preferences')}>
  <img src={preferencesIcon} alt="Preferences" style={{ width: '40px', height: '40px' }} />
</div>
      <h2>Environment Creation</h2>
      <p>Add a name to the environment</p>

      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={handleNameChange}
        required
      />

      <p>Select the type of environment</p>

      <div className="icons-container">
        <div
          className={`icon ${selectedType === 'business' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('business')}
        >
          <img src={businessIcon} alt="Business Environment" />
          <p>Business</p>
        </div>

        <div
          className={`icon ${selectedType === 'domestic' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('domestic')}
        >
          <img src={domesticIcon} alt="Domestic Environment" />
          <p>Domestic</p>
        </div>

        <div
          className={`icon ${selectedType === 'leisure' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('leisure')}
        >
          <img src={leisureIcon} alt="Leisure Environment" />
          <p>Leisure</p>
        </div>
      </div>

     
        <button onClick={handleSubmit}>Create Environment</button>
        
        <button onClick={() => navigate('/start-simulation')}>Simulation</button>
        <button onClick={() => navigate('/add')}>Add Users to an Environment</button>
        <button onClick={() => navigate('/user-list')}>Environment User List</button>
       
    </div>
  );
};

export default CreateEnvironmentPage;
