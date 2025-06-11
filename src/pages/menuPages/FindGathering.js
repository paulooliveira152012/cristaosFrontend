import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const FindGathering = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Encontrar reuniao próxima a voce</h1>
      <p>Utilize nossa ferramenta para encontrar uma reuniao perto de você.</p>
      <Footer />
    </div>
  );
};

export default FindGathering;
