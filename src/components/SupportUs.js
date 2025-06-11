// src/components/SupportUs.js
import React from 'react';
import { Link } from 'react-router-dom';

const SupportUs = () => {
  return (
    <div style={styles.container}>
      <Link to="/donate" style={styles.button}>
        Apoie-nos
      </Link>
    </div>
  );
};

// Estilos modernos para o botão
const styles = {
  container: {
    textAlign: 'center',
    margin: '20px 0',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#0070ba',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '5px',
    textDecoration: 'none',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  buttonHover: {
    backgroundColor: '#005a9c',
  },
};

export default SupportUs;
