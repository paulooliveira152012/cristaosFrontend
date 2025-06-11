import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

const ChurchSupport = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Suporte à Igreja</h1>
      <p>Fornecemos suporte para igrejas que buscam melhorar seus ministérios.</p>
    </div>
  );
};

export default ChurchSupport;
