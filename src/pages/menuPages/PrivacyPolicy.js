// src/pages/legal/PrivacyPolicy.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../components/Header";

const UPDATED_AT = "2025-08-27";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <>
       <Header showProfileImage={false} navigate={navigate} />
    <div className="landingListingsContainer">
      <div className="scrollable" style={{ padding: 16 }}>
        <h1>Política de Privacidade</h1>
        <p><em>Última atualização: {UPDATED_AT}</em></p>

        <section>
          <h2>1. Sobre esta Política</h2>
          <p>
            Esta Política de Privacidade descreve como o <strong>Cristãos App</strong>
            (“Plataforma”, “nós”) coleta, utiliza, compartilha e protege suas
            informações pessoais, em conformidade com a Lei Geral de Proteção de
            Dados Pessoais – <strong>LGPD (Lei 13.709/2018)</strong> e demais
            normas aplicáveis.
          </p>
        </section>

        <section>
          <h2>2. Dados que coletamos</h2>
          <ul>
            <li><strong>Cadastro:</strong> nome, e-mail, username, foto de perfil, denominação/igreja (se informado), biografia.</li>
            <li><strong>Login social (Google):</strong> identificador do provedor, e-mail verificado, nome, foto (conforme permissões).</li>
            <li><strong>Uso da Plataforma:</strong> posts, curtidas, comentários, amigos, mensagens, mural, interações.</li>
            <li><strong>Dados técnicos:</strong> IP, dispositivo, navegador, sistema operacional, cookies e identificadores similares.</li>
            <li><strong>Comunicações:</strong> preferências de notificação por e-mail e histórico de envio/abertura (quando aplicável).</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidades e bases legais</h2>
          <ul>
            <li><strong>Fornecer o serviço</strong> (execução de contrato): criar sua conta, autenticar, manter seu perfil e suas interações.</li>
            <li><strong>Segurança</strong> (legítimo interesse/obrigação legal): prevenção a fraudes, spam, abusos e incidentes.</li>
            <li><strong>Comunicações</strong> (execução de contrato/legítimo interesse): e-mails de atividade e avisos importantes. Por padrão você recebe notificações gerais; pode ajustar em <Link to="/notifications">Notificações</Link>.</li>
            <li><strong>Melhoria do produto</strong> (legítimo interesse): métricas e analytics para aprimorar a experiência.</li>
            <li><strong>Cumprimento legal</strong>: responder a autoridades e demandas legais, quando necessário.</li>
          </ul>
        </section>

        <section>
          <h2>4. Compartilhamento de dados</h2>
          <p>Podemos compartilhar dados com:</p>
          <ul>
            <li><strong>Operadores/fornecedores</strong> que suportam a Plataforma (hospedagem, e-mail, analytics), sob contrato e instruções.</li>
            <li><strong>Provedores de login</strong> (ex.: Google) quando você opta por autenticar via conta externa.</li>
            <li><strong>Autoridades</strong> em conformidade com a lei ou ordens válidas.</li>
          </ul>
          <p>Não vendemos seus dados pessoais.</p>
        </section>

        <section>
          <h2>5. Cookies e tecnologias similares</h2>
          <p>
            Utilizamos cookies essenciais para login e funcionamento, e cookies
            de desempenho/analytics para entender o uso e melhorar o serviço.
            Você pode gerenciar cookies no seu navegador; a desativação de
            cookies essenciais pode impedir o uso adequado da Plataforma.
          </p>
        </section>

        <section>
          <h2>6. Transferências internacionais</h2>
          <p>
            Seus dados podem ser processados em outros países por nossos
            fornecedores. Nesses casos, adotamos salvaguardas adequadas
            (cláusulas contratuais, padrões de segurança) para proteger seus
            dados conforme a LGPD.
          </p>
        </section>

        <section>
          <h2>7. Retenção</h2>
          <p>
            Mantemos seus dados enquanto a conta estiver ativa e pelo tempo
            necessário para cumprir finalidades legítimas e obrigações legais.
            Você pode solicitar exclusão da conta, observadas retenções
            necessárias (ex.: prevenção a fraudes, cumprimento legal).
          </p>
        </section>

        <section>
          <h2>8. Seus direitos</h2>
          <p>
            Conforme a LGPD, você pode solicitar: confirmação de tratamento,
            acesso, correção, anonimização, portabilidade, eliminação, informações
            sobre compartilhamento e <strong>revogação de consentimento</strong>{" "}
            quando aplicável. Para exercer, contate:
            <a href="mailto:cristaosapp@gmail.com"> privacidade@cristaos.app</a>.
          </p>
        </section>

        <section>
          <h2>9. Notificações por e-mail</h2>
          <p>
            Enviamos e-mails transacionais e de atividade por padrão ao endereço
            cadastrado. Você pode ajustar ou desativar a qualquer momento em{" "}
            <Link to="/notifications">Notificações</Link>. Alguns avisos
            essenciais (ex.: segurança, mudanças relevantes) podem ser enviados
            independentemente das preferências, pois são necessários à prestação
            do serviço.
          </p>
        </section>

        <section>
          <h2>10. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus
            dados. Nenhuma plataforma é 100% segura; em caso de incidentes
            relevantes, adotaremos as medidas exigidas pela lei aplicável.
          </p>
        </section>

        <section>
          <h2>11. Crianças e adolescentes</h2>
          <p>
            O serviço não é destinado a menores de 13 anos. Usuários entre 13 e
            18 anos devem usar a Plataforma com orientação/consentimento dos
            responsáveis, conforme legislação aplicável.
          </p>
        </section>

        <section>
          <h2>12. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política periodicamente. Avisaremos sobre
            alterações relevantes. O uso continuado após a atualização indica
            ciência da nova versão.
          </p>
        </section>

        <section>
          <h2>13. Contato do Encarregado (DPO)</h2>
          <p>
            Para dúvidas sobre privacidade/dados pessoais, contate nosso
            Encarregado:{" "}
            <a href="mailto:cristaosapp@gmail.com">privacidade@cristaos.app</a>.
          </p>
        </section>
      </div>
    </div>
    </>
  );
};

export default PrivacyPolicy;
