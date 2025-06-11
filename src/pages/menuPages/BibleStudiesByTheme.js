import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const BibleStudiesByTheme = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Estudos por Temas</h1>
      <p>Explore estudos bíblicos organizados por temas.</p>
      <Footer />
    </div>
  );
};

export default BibleStudiesByTheme;
