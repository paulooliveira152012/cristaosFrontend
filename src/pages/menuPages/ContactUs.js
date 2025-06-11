import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const ContactUs = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header showProfileImage={false} navigate={navigate}/>
      <h1>Fale Conosco</h1>
      <p>Entre em contato conosco para mais informações ou suporte.</p>
      <Footer />
    </div>
  );
};

export default ContactUs;
