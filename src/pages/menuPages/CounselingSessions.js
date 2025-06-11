import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const CounselingSessions = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Sessões de Aconselhamento</h1>
      <p>Agende uma sessão de aconselhamento para apoio espiritual e pessoal.</p>
      <Footer />
    </div>
  );
};

export default CounselingSessions;
