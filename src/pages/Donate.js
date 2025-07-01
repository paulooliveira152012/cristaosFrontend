// src/pages/Donate.js
import React, { useEffect, useState } from 'react';
import paypalLogo from '../assets/images/paypal.png'; // Import the image correctly
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

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
    <div>
      <Header
       showProfileImage={false}
       navigate={navigate}
       />
      <div style={styles.container}>
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=TFYQTBPL8AAMA"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
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
        <h2 style={styles.title}>Apoie Nosso Projeto</h2>
        <p style={styles.description}>
          Desde 2024, o Cristãos App tem como missão promover um ambiente para unificar os cristãos além das quatro paredes das igrejas. Nosso foco é nas doutrinas essenciais do Evangelho que nos unem como corpo, deixando de lado diferenças doutrinárias entre denominações. Também buscamos alcançar não-cristãos com a mensagem do Evangelho, e após uma conversão voluntária a Cristo, passamos a ensinar doutrinas e preceitos cristãos.
        </p>
        <p style={styles.description}>
          Nosso propósito é promover o ensino da Bíblia como um todo, explorar livros bíblicos individuais, e ensinar sobre as doutrinas fundamentais da fé. Além disso, enfatizamos a luta contra o pecado, o apoio mútuo em oração e estudos focados em questões comportamentais. Também oferecemos suporte em áreas não diretamente bíblicas, como ajuda psicológica e aconselhamento para a vida.
        </p>
        <p style={styles.description}>
          Para que o Cristãos App continue a crescer e alcançar mais pessoas, precisamos de recursos. Atualmente, não temos patrocinadores e contamos com o apoio generoso de pessoas como você. Considere fazer uma doação para ajudar a manter este projeto vivo e em constante desenvolvimento.
        </p>
        <div id="donate-button" style={styles.donateButton}></div>
        {!isPayPalLoaded && (
          <div style={styles.fallback}>
            
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=TFYQTBPL8AAMA"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Doar com PayPal
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Estilos modernos aplicados ao componente
const styles = {
  container: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    margin: '20px auto',
    maxWidth: '600px',
  },
  title: {
    color: '#333',
    fontSize: '28px',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  description: {
    color: '#555',
    fontSize: '16px',
    marginBottom: '15px',
    textAlign: "justify"
  },
  donateButton: {
    display: 'inline-block',
    marginTop: '20px',
  },
  fallback: {
    marginTop: '20px',
    // color: '#ff0000',
  },
  link: {
    textDecoration: 'none',
    color: '#0070ba',
    fontWeight: 'bold',
    fontSize: '18px',
  },
};

export default Donate;
