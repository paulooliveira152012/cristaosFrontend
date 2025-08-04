// termos de uso
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const UsageTerms = () => {
  const navigate = useNavigate();

  return (
    <div className='screenWrapper'>
      <Header showProfileImage={false} navigate={navigate} />
      <div className='scrollable'>
        <h1>Termos de Uso</h1>
        <p>
          Estes Termos de Uso regem o acesso e uso do nosso site. Ao utilizar nossos serviços, você concorda com estes termos.
        </p>
        <h2>Aceitação dos Termos</h2>
        <p>
          Ao acessar ou usar nosso site, você concorda em cumprir estes Termos de Uso e nossa Política de Privacidade.
        </p>
        <h2>Modificações nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Notificaremos os usuários sobre quaisquer alterações significativas.
        </p>
        <h2>Uso do Site</h2>
        <p>
          Você concorda em usar nosso site apenas para fins legais e de acordo com todas as leis aplicáveis.
        </p>
        <h2>Conteúdo do Usuário</h2>
        <p>
          Você é responsável pelo conteúdo que publica em nosso site e concorda em não publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros.
        </p>
        <h2>Limitação de Responsabilidade</h2>
        <p>
          Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade de uso do nosso site.
        </p>
        <h2>Lei Aplicável</h2>
        <p>
          Estes Termos de Uso são regidos pelas leis do país onde operamos. Qualquer disputa relacionada a estes termos será resolvida nos tribunais competentes desse país.
        </p>
        <h2>Contato</h2>
        <p>
          Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do nosso formulário de contato.
        </p>
      </div>
    </div>
  );
};

export default UsageTerms;