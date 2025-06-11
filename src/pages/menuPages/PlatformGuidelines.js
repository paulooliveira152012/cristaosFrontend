import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const PlatformGuidelines = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Diretrizes da Plataforma</h1>
      <p>Aqui você encontrará as diretrizes sobre o uso da nossa plataforma.</p>
      <Footer />
    </div>
  );
};

export default PlatformGuidelines;
