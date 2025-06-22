import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const PrivateRooms = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Salas de Reuniões Privadas</h1>
      <p>Entre em uma sala de reunião privada para conversar com seu grupo.</p>
    </div>
  );
};

export default PrivateRooms;
