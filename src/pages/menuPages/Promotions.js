import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const Promotions = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Promova seu trabalho</h1>
      <p>Promova seu trabalho.</p>
    </div>
  );
};

export default Promotions;
