// src/pages/legal/UsageTerms.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../components/Header";
import { useUser } from "../../context/UserContext";

const UPDATED_AT = "2025-08-27"; // dd-mm-aaaa (atualize quando mudar algo)

const UsageTerms = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  console.log("currentUser:", currentUser);

  return (
    <>
      {currentUser ? (
        <Header showProfileImage={false} navigate={navigate} />
      ) : (
        <Header
          showProfileImage={false}
          navigate={navigate}
          showBackArrow={false}
        />
      )}

      <div className="landingListingsContainer">
        <div className="scrollable" style={{ padding: 16 }}>
          <h1>Termos de Uso</h1>
          <p>
            <em>Última atualização: {UPDATED_AT}</em>
          </p>

          <section>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Bem-vindo ao <strong>Cristãos App</strong> (“Plataforma”, “nós”).
              Estes Termos de Uso (“Termos”) regem seu acesso e uso dos nossos
              serviços, site e aplicativos. Ao criar conta, acessar ou usar a
              Plataforma, você declara que leu, entendeu e concorda com estes
              Termos e com a nossa{" "}
              <Link to="/privacy">Política de Privacidade</Link>. Caso não
              concorde, não utilize a Plataforma.
            </p>
            <p>
              Ao prosseguir com o cadastro (inclusive via login social como
              Google), você confirma que <strong>leu e aceitou</strong> estes
              Termos.
            </p>
          </section>

          <section>
            <h2>2. Comunidade de orientação cristã</h2>
            <p>
              O Cristãos App é uma comunidade de convívio, encorajamento e
              edificação com <strong>orientação cristã</strong>. Pessoas de
              qualquer crença são bem-vindas, desde que respeitem os valores de
              civilidade, cordialidade e testemunho.
            </p>
            <h3>2.1 Regras básicas de convivência</h3>
            <ul>
              <li>
                Respeite os demais usuários; não publique insultos, assédio,
                difamação, discurso de ódio ou incitação à violência.
              </li>
              <li>
                Conteúdos adultos/sexuais, violentos, chocantes,
                discriminatórios ou que contrariem a legislação aplicável são
                proibidos.
              </li>
              <li>
                Não publique spam, correntes, golpes, promoções enganosas ou
                autosserviço comercial sem autorização expressa.
              </li>
              <li>
                Evite polêmicas de teor político-partidário, proselitismo
                agressivo ou ataques a denominações/igrejas.
              </li>
              <li>
                Proteja sua privacidade e a de terceiros; não compartilhe dados
                pessoais sensíveis sem consentimento.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Cadastro, Idade Mínima e Segurança da Conta</h2>
            <ul>
              <li>
                Você deve ter pelo menos <strong>13 anos</strong> (ou idade
                mínima de consentimento digital aplicável em sua jurisdição)
                para usar a Plataforma.
              </li>
              <li>
                Você é responsável por manter a confidencialidade das
                credenciais e por todas as atividades realizadas em sua conta.
              </li>
              <li>
                Podemos solicitar verificação de e-mail e aplicar medidas de
                segurança, inclusive autenticação e logs antifraude.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Notificações por e-mail</h2>
            <p>
              Enviamos <strong>e-mails transacionais</strong> e de atividade
              (ex. novas mensagens, convites, avisos de segurança) como parte
              necessária do serviço. O recebimento de{" "}
              <strong>e-mails promocionais/marketing</strong> depende do seu{" "}
              <strong>consentimento</strong> e pode ser alterado a qualquer
              momento em <Link to="/notifications">Notificações</Link>. Alguns
              avisos essenciais poderão ser enviados independentemente das
              preferências.
            </p>
          </section>

          <section>
            <h2>5. Consentimentos Específicos</h2>
            <ul>
              <li>
                <strong>E-mails promocionais/marketing:</strong> além dos
                e-mails transacionais (necessários ao serviço), o envio de
                comunicações promocionais depende do seu{" "}
                <strong>consentimento</strong> e pode ser
                <strong> revogado</strong> a qualquer momento em{" "}
                <Link to="/notifications">Notificações</Link>.
              </li>
              <li>
                <strong>Publicidade personalizada:</strong> o uso de cookies/IDs
                para personalização e medição de anúncios depende do seu{" "}
                <strong>consentimento</strong>, gerenciado no{" "}
                <Link to="/privacy-center">Centro de Privacidade</Link>. Sem
                esse consentimento, exibimos somente{" "}
                <strong>publicidade contextual</strong>.
              </li>
              <li>
                <strong>
                  Uso de imagem/voz/biografia em materiais de divulgação do
                  Cristãos App:
                </strong>{" "}
                podemos solicitar <strong>consentimento específico</strong> para
                utilizar sua imagem, voz, nome e biografia em canais oficiais
                (site, redes sociais, anúncios e peças institucionais) com
                finalidade de promoção da Plataforma. Você pode{" "}
                <strong>revogar</strong> a qualquer tempo via{" "}
                <Link to="/privacy-center">Centro de Privacidade</Link> ou pelo
                e-mail{" "}
                <a href="mailto:cristaosapp@gmail.com">
                  cristaosapp@gmail.com
                </a>
                . A revogação não afeta materiais já publicados dentro do prazo
                e limites legais, mas interrompe novos usos.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Conteúdo do Usuário e Licença</h2>
            <ul>
              <li>Você mantém a titularidade do conteúdo que publicar.</li>
              <li>
                Ao publicar, você concede ao Cristãos App uma{" "}
                <strong>
                  licença não exclusiva, mundial, gratuita, transferível e
                  sublicenciável
                </strong>{" "}
                para hospedar, armazenar, reproduzir, adaptar, moderar, exibir e
                distribuir tal conteúdo na Plataforma, exclusivamente para
                operação e divulgação do serviço.
              </li>
              <li>
                Você declara ter todos os direitos necessários e que seu
                conteúdo não viola direitos de terceiros.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Propriedade Intelectual da Plataforma</h2>
            <p>
              Todos os direitos sobre o software, marcas, logotipos, layout e
              funcionalidades pertencem ao Cristãos App e/ou licenciantes. É
              vedado reproduzir, modificar, realizar engenharia reversa ou criar
              obras derivadas sem autorização.
            </p>
          </section>

          <section>
            <h2>8. Moderação, Suspensão e Remoção</h2>
            <p>
              Podemos, a nosso critério e sem aviso prévio, moderar, remover
              conteúdos e <strong>restringir ou encerrar contas</strong> que
              violem estes Termos ou a lei. Sempre que possível e apropriado,
              poderemos oferecer um canal de esclarecimento/contestação.
            </p>
          </section>

          <section>
            <h2>9. Denúncias e Reclamações</h2>
            <p>
              Para denunciar conteúdo ou conduta que viole estes Termos, utilize
              os canais internos da Plataforma ou entre em contato por e-mail:
              <a href="mailto:cristaosapp@gmail.com"> cristaosapp@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2>10. Isenções e Responsabilidades</h2>
            <ul>
              <li>
                A Plataforma é fornecida “<strong>como está</strong>” e
                “conforme disponível”. Não garantimos disponibilidade contínua,
                ausência de erros ou adequação a fins específicos.
              </li>
              <li>
                O conteúdo é, em grande parte, gerado por usuários; não nos
                responsabilizamos por opiniões, conselhos ou informações de
                terceiros.
              </li>
              <li>
                Na máxima medida permitida por lei, não nos responsabilizamos
                por
                <strong>
                  {" "}
                  danos indiretos, incidentais, especiais, punitivos ou
                  consequenciais
                </strong>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2>11. Indenização</h2>
            <p>
              Você concorda em indenizar e manter indene o Cristãos App de
              reclamações decorrentes do conteúdo que publicar, do uso indevido
              da Plataforma ou de violação destes Termos ou da lei.
            </p>
          </section>

          <section>
            <h2>12. Alterações nestes Termos</h2>
            <p>
              Podemos alterar estes Termos a qualquer momento. Notificaremos
              sobre mudanças relevantes. O uso continuado após as alterações
              indica concordância com a nova versão.
            </p>
          </section>

          <section>
            <h2>13. Lei Aplicável e Foro</h2>
            <p>
              Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro
              da Comarca de São Paulo/SP, com renúncia a qualquer outro, por
              mais privilegiado que seja, salvo legislação de ordem pública
              aplicável.
            </p>
          </section>

          <section>
            <h2>14. Contato</h2>
            <p>
              Dúvidas? Fale com a gente:{" "}
              <a href="mailto:cristaosapp@gmail.com">cristaosapp@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default UsageTerms;
