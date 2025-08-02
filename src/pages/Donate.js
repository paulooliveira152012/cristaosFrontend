// src/pages/Donate.js
import React, { useEffect, useState } from 'react';
import paypalLogo from '../assets/images/paypal.png'; // Import the image correctly
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import "../styles/Donate.css"

const Donate = () => {
  const [isPayPalLoaded, setIsPayPalLoaded] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    // Carregar o script do PayPal SDK
    const script = document.createElement('script');
    script.src = 'https://www.paypalobjects.com/donate/sdk/donate-sdk.js';
    script.charset = 'UTF-8';
    script.async = true; // Carregar o script de forma assíncrona para melhor desempenho
    script.crossOrigin = 'anonymous'; // Definir o atributo crossOrigin

    script.onerror = () => {
      console.error('Falha ao carregar o script do PayPal SDK.');
    };

    // Adicionar o script ao documento
    document.body.appendChild(script);

    // Limpar o script quando o componente for desmontado
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className='screenWrapper'>
      <div className='scrollable'>
      <Header
       showProfileImage={false}
       navigate={navigate}
       />
      <div className='donateContainer'>
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=TFYQTBPL8AAMA"
          target="_blank"
          rel="noopener noreferrer"
          className='link'
        >
          <div 
            style={{
              width: "100%",
              height: "100px",
              backgroundImage: `url(${paypalLogo})`,
              backgroundSize: 'contain',
              backgroundRepeat: "no-repeat",
              backgroundPosition: 'center',
              margin: '0 auto',
            }}
          ></div>
        </a>
        <h2 className='title'>Apoie Nosso Projeto</h2>
        <p className='description'>
          Desde 2024, o Cristãos App tem como missão promover um ambiente para unificar os cristãos além das quatro paredes das igrejas. Nosso foco é nas doutrinas essenciais do Evangelho que nos unem como corpo, deixando de lado diferenças doutrinárias entre denominações. Também buscamos alcançar não-cristãos com a mensagem do Evangelho, e após uma conversão voluntária a Cristo, passamos a ensinar doutrinas e preceitos cristãos.
        </p>
        <p className='description'>
          Nosso propósito é promover o ensino da Bíblia como um todo, explorar livros bíblicos individuais, e ensinar sobre as doutrinas fundamentais da fé. Além disso, enfatizamos a luta contra o pecado, o apoio mútuo em oração e estudos focados em questões comportamentais. Também oferecemos suporte em áreas não diretamente bíblicas, como ajuda psicológica e aconselhamento para a vida.
        </p>
        <p className='description'>
          Para que o Cristãos App continue a crescer e alcançar mais pessoas, precisamos de recursos. Atualmente, não temos patrocinadores e contamos com o apoio generoso de pessoas como você. Considere fazer uma doação para ajudar a manter este projeto vivo e em constante desenvolvimento.
        </p>
        <div id="donate-button" className='description'></div>
        {!isPayPalLoaded && (
          <div className='fallback'>
            
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=TFYQTBPL8AAMA"
              target="_blank"
              rel="noopener noreferrer"
              className='link'
            >
              Doar com PayPal
            </a>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

// Estilos modernos aplicados ao componente

export default Donate;
