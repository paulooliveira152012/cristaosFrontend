import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer'
import { useNavigate } from 'react-router-dom';

const BibleStudiesByBook = () => {
  const navigate = useNavigate()
  return (
    <div>
        <Header showProfileImage={false} navigate={navigate}/>
      <h1>Estudos por Livro Bíblico</h1>
      <p>Explore estudos detalhados organizados por livros da Bíblia.</p>
      <Footer />
    </div>
  );
};

export default BibleStudiesByBook;
