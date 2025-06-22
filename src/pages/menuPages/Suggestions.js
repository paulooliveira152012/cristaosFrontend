import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const Suggestions = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Sugestões</h1>
      <p>Envie suas sugestões para melhorar a plataforma.</p>
    </div>
  );
};

export default Suggestions;
