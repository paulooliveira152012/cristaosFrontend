import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const CommunityForum = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Fórum da Comunidade</h1>
      <p>Participe de discussões e interações com outros cristãos no fórum da comunidade.</p>
    </div>
  );
};

export default CommunityForum;
