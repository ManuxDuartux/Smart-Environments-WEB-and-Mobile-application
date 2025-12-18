import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EnvironmentCreatedPage.css'; // Adicionar o CSS para esta página

// Importando as imagens dos ambientes
import businessImage from '../assets/Business space.png';
import domesticImage from '../assets/Domestic space.jpg';
import leisureImage from '../assets/leisure space.png';

// Importando os ícones
import addIcon from '../assets/add button.png';
import userIcon from '../assets/users icon.png';
import smartHomeIcon from '../assets/smart home icon.png';

const EnvironmentCreatedPage = () => {
  const [environmentImage, setEnvironmentImage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedType = localStorage.getItem('environmentType'); // Supondo que o tipo foi salvo no localStorage

    // Definir a imagem do ambiente com base no tipo
    switch (storedType) {
      case 'business':
        setEnvironmentImage(businessImage);
        break;
      case 'domestic':
        setEnvironmentImage(domesticImage);
        break;
      case 'leisure':
        setEnvironmentImage(leisureImage);
        break;
      default:
        setEnvironmentImage('');
    }
  }, []);

  return (
    <div className="environment-created-container">
      <h2>Environment Created</h2>
      <p className="success-message">Success !!</p>
      <img src={environmentImage} alt="Environment" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
      
      <div className="button-container">
        <button onClick={() => navigate('/add')}>
          <img src={addIcon} alt="Add Users" />
          Add Users
        </button>
        <button onClick={() => navigate('/user-list')}>
          <img src={userIcon} alt="User List" />
          User List
        </button>
        <button onClick={() => navigate('/start-simulation')}>
          <img src={smartHomeIcon} alt="Start Simulation" />
          Start Simulation
        </button>
      </div>
    </div>
  );
};

export default EnvironmentCreatedPage;
