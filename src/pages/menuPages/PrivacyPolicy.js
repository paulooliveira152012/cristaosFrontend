// privacy policy page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className='screenWrapper'>
      <Header showProfileImage={false} navigate={navigate} />
      <div className='scrollable'>
        <h1>Política de Privacidade</h1>
        <p>
          Esta Política de Privacidade descreve como coletamos, usamos e protegemos as informações pessoais dos usuários do nosso site.
        </p>
        <h2>Coleta de Informações</h2>
        <p>
          Coletamos informações pessoais quando você se registra em nosso site, participa de discussões ou interage com nossos serviços.
        </p>
        <h2>Uso das Informações</h2>
        <p>
          As informações coletadas são usadas para melhorar a experiência do usuário, personalizar conteúdo e enviar atualizações relevantes.
        </p>
        <h2>Proteção de Informações</h2>
        <p>
          Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado, alteração ou divulgação.
        </p>
        <h2>Compartilhamento de Informações</h2>
        <p>
          Não compartilhamos suas informações pessoais com terceiros sem o seu consentimento, exceto quando exigido por lei.
        </p>
        <h2>Cookies</h2>
        <p>
          Utilizamos cookies para melhorar a funcionalidade do site e analisar o tráfego. Você pode optar por não aceitar cookies, mas isso pode afetar sua experiência no site.
        </p>
        <h2>Alterações na Política de Privacidade</h2>
        <p>
          Reservamo-nos o direito de atualizar esta Política de Privacidade a qualquer momento. Notificaremos os usuários sobre quaisquer alterações significativas.
        </p>
        <h2>Contato</h2>
        <p>
          Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através do nosso formulário de contato.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;