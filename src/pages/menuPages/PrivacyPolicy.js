// src/pages/legal/PrivacyPolicy.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../components/Header";
import { useUser } from "../../context/UserContext";

const UPDATED_AT = "2025-08-27";
const POLICY_VERSION = "1.2.0";
const CONTACT_EMAIL = "cristaosapp@gmail.app"; // mantém consistência no texto
const PRIVACY_CENTER_PATH = "/privacy-center";
const ADS_PARTNERS_PATH = "/ads-partners";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

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
          <h1>Política de Privacidade</h1>
          <p>
            <em>
              Última atualização: {UPDATED_AT} • Versão da política:{" "}
              {POLICY_VERSION}
            </em>
          </p>

          <section>
            <h2>1. Sobre esta Política</h2>
            <p>
              Esta Política de Privacidade descreve como o{" "}
              <strong>Cristãos App</strong>
              (“Plataforma”, “nós”) coleta, utiliza, compartilha e protege suas
              informações pessoais, em conformidade com a Lei Geral de Proteção
              de Dados Pessoais –<strong> LGPD (Lei 13.709/2018)</strong> e
              demais normas aplicáveis.
            </p>
            <p>
              Para gerenciar preferências de cookies e publicidade, acesse o{" "}
              <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link>. Para
              conhecer os nossos parceiros de anúncios (“vendors”), consulte{" "}
              <Link to={ADS_PARTNERS_PATH}>Parceiros de Anúncios</Link>.
            </p>
          </section>

          <section>
            <h2>2. Definições essenciais</h2>
            <ul>
              <li>
                <strong>Cookies e identificadores</strong>: pequenos
                arquivos/IDs (por ex., cookies, localStorage, IDs de
                dispositivo) usados para lembrar preferências, autenticar,
                realizar medições e, se você consentir, personalizar anúncios.
              </li>
              <li>
                <strong>Publicidade personalizada</strong>: anúncios baseados no
                seu uso da Plataforma e em identificadores online para
                criar/usar perfis, inclusive medição de desempenho e limitação
                de frequência.
              </li>
              <li>
                <strong>Publicidade contextual</strong>: anúncios baseados no
                conteúdo da página/consulta, sem usar seu histórico ou perfil.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Dados que coletamos</h2>
            <ul>
              <li>
                <strong>Cadastro:</strong> nome, e-mail, username, foto de
                perfil, denominação/igreja (se informado), biografia.
              </li>
              <li>
                <strong>Login social (Google):</strong> identificador do
                provedor, e-mail verificado, nome, foto (conforme permissões).
              </li>
              <li>
                <strong>Uso da Plataforma:</strong> posts, curtidas,
                comentários, amigos, mensagens, mural, interações.
              </li>
              <li>
                <strong>Dados técnicos:</strong> IP, dispositivo, navegador,
                sistema operacional, configurações de idioma, logs de acesso,
                cookies e identificadores similares.
              </li>
              <li>
                <strong>Comunicações:</strong> preferências de notificação por
                e-mail e histórico de envio/abertura (quando aplicável).
              </li>
              <li>
                <strong>Consentimento de cookies:</strong> categorias
                aceitas/recusadas, carimbo de data/hora, versão da política e
                país/área aproximada (derivada do IP).
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Finalidades e bases legais</h2>
            <ul>
              <li>
                <strong>Fornecer o serviço</strong> (execução de contrato):
                criar sua conta, autenticar, manter seu perfil e suas
                interações.
              </li>
              <li>
                <strong>Segurança</strong> (legítimo interesse/obrigação legal):
                prevenção a fraudes, spam, abusos e incidentes.
              </li>
              <li>
                <strong>Comunicações</strong> (execução de contrato/legítimo
                interesse): e-mails de atividade e avisos importantes. Por
                padrão você pode receber notificações; ajuste em{" "}
                <Link to="/notifications">Notificações</Link>.
              </li>
              <li>
                <strong>Métricas e analytics</strong> (legítimo interesse e/ou
                consentimento, conforme exigências locais): entender uso e
                melhorar a experiência. Você pode optar por não participar no{" "}
                <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link>.
              </li>
              <li>
                <strong>Publicidade personalizada</strong> (consentimento):
                personalizar e mensurar anúncios, limitar frequência, prevenir
                fraude em ads e construir/usar perfis com identificadores
                online. Sem consentimento, exibimos apenas{" "}
                <strong>publicidade contextual</strong>.
              </li>
              <li>
                <strong>Cumprimento legal</strong>: responder a autoridades e
                demandas legais.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies e categorias de tecnologia</h2>
            <p>
              Utilizamos as categorias abaixo. Você pode gerenciá-las por
              categoria no{" "}
              <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link>. A
              desativação de cookies essenciais pode impedir o uso adequado da
              Plataforma.
            </p>
            <ul>
              <li>
                <strong>Essenciais (necessários):</strong> login, manutenção de
                sessão, segurança, prevenção a fraudes. <em>Base legal:</em>{" "}
                execução de contrato e/ou legítimo interesse.
              </li>
              <li>
                <strong>Desempenho/Analytics:</strong> métricas de uso e
                qualidade. <em>Base legal:</em> legítimo interesse e/ou
                consentimento (conforme jurisdição).
              </li>
              <li>
                <strong>Publicidade:</strong> somente com seu consentimento para
                personalização, medição, limite de frequência e prevenção a
                fraude em ads. Sem consentimento, podemos exibir anúncios
                contextuais.
              </li>
            </ul>
            <p>
              Mantemos um <strong>registro do seu consentimento</strong>{" "}
              (categorias selecionadas, versão da política e carimbo de
              data/hora) para fins de conformidade. Você pode{" "}
              <strong>revogar</strong> a qualquer tempo no{" "}
              <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link>.
            </p>
          </section>

          <section>
            <h2>5.1 Publicidade e parceiros (vendors)</h2>
            <p>
              Com o seu <strong>consentimento</strong>, poderemos compartilhar
              identificadores online (cookies/IDs de dispositivo) com nossos
              parceiros de anúncios (“vendors”) para: (i) entregar e mensurar
              anúncios, (ii) aplicar limites de frequência, (iii)
              detectar/prevenir fraude e (iv) personalizar conteúdo
              publicitário.
            </p>
            <p>
              A lista de vendors, as finalidades específicas e links úteis
              (políticas/opt-out do parceiro) estão em{" "}
              <Link to={ADS_PARTNERS_PATH}>Parceiros de Anúncios</Link>. Você
              pode alterar seu consentimento em{" "}
              <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link>. A
              revogação não afeta a legalidade do tratamento já realizado.
            </p>
          </section>

          <section>
            <h2>6. Compartilhamento de dados</h2>
            <p>Podemos compartilhar dados com:</p>
            <ul>
              <li>
                <strong>Operadores/fornecedores</strong> que suportam a
                Plataforma (hospedagem, e-mail, analytics), sob contrato e
                instruções.
              </li>
              <li>
                <strong>Provedores de login</strong> (ex.: Google) quando você
                opta por autenticar via conta externa.
              </li>
              <li>
                <strong>Parceiros de anúncios (vendors)</strong> apenas com seu
                consentimento para publicidade personalizada e medição (ver
                seção 5.1).
              </li>
              <li>
                <strong>Autoridades</strong> em conformidade com a lei ou ordens
                válidas.
              </li>
            </ul>
            <p>Não vendemos seus dados pessoais.</p>
          </section>

          <section>
            <h2>7. Transferências internacionais</h2>
            <p>
              Seus dados podem ser processados em outros países por nossos
              fornecedores e vendors. Nesses casos, adotamos salvaguardas
              adequadas (cláusulas contratuais, padrões de segurança) para
              proteger seus dados conforme a LGPD.
            </p>
          </section>

          <section>
            <h2>8. Retenção</h2>
            <p>
              Mantemos seus dados enquanto a conta estiver ativa e pelo tempo
              necessário para cumprir finalidades legítimas e obrigações legais.
              Identificadores de ads e cookies são retidos pelo período mínimo
              necessário para medição/segurança e de acordo com a política dos
              vendors, disponível em{" "}
              <Link to={ADS_PARTNERS_PATH}>Parceiros de Anúncios</Link>. Você
              pode solicitar exclusão da conta, observadas retenções necessárias
              (ex.: prevenção a fraudes, cumprimento legal).
            </p>
          </section>

          <section>
            <h2>9. Seus direitos</h2>
            <p>
              Conforme a LGPD, você pode solicitar: confirmação de tratamento,
              acesso, correção, anonimização, portabilidade, eliminação,
              informações sobre compartilhamento e{" "}
              <strong>revogação de consentimento</strong> quando aplicável. Para
              exercer, contate:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
            <p>
              Também respeitamos sinais de preferência de privacidade do
              navegador quando tecnicamente disponíveis (por exemplo,
              configurações que indicam menor rastreamento). Se você utiliza
              tais sinais, poderemos tratá-los como uma preferência para{" "}
              <strong>não</strong> utilizar publicidade personalizada.
            </p>
          </section>

          <section>
            <h2>10. Notificações por e-mail</h2>
            <p>
              Enviamos e-mails transacionais e de atividade por padrão ao
              endereço cadastrado. Você pode ajustar ou desativar a qualquer
              momento em <Link to="/notifications">Notificações</Link>. Alguns
              avisos essenciais (ex.: segurança, mudanças relevantes) podem ser
              enviados independentemente das preferências, pois são necessários
              à prestação do serviço.
            </p>
          </section>

          <section>
            <h2>10.1 E-mails promocionais/marketing</h2>
            <p>
              O envio de comunicações promocionais/marketing depende do seu{" "}
              <strong>consentimento</strong>. Você pode gerenciar ou revogar
              esse consentimento em{" "}
              <Link to="/notifications">Notificações</Link> ou pelo{" "}
              <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link>. A
              revogação não afeta a legalidade dos envios efetuados antes do
              pedido.
            </p>
          </section>

          <section>
            <h2>11. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus
              dados (criptografia em trânsito, controles de acesso, logs,
              revisão periódica). Nenhuma plataforma é 100% segura; em caso de
              incidentes relevantes, adotaremos as medidas exigidas pela lei
              aplicável.
            </p>
          </section>

          <section>
            <h2>12. Crianças e adolescentes</h2>
            <p>
              O serviço não é destinado a menores de 13 anos. Usuários entre 13
              e 18 anos devem usar a Plataforma com orientação/consentimento dos
              responsáveis, conforme legislação aplicável.
            </p>
          </section>

          <section>
            <h2>13. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política periodicamente. Avisaremos sobre
              alterações relevantes (por exemplo, banner/aviso no app). O uso
              continuado após a atualização indica ciência da nova versão.
              Manteremos registro da versão do seu consentimento.
            </p>
          </section>

          <section>
            <h2>14. Contato do Encarregado (DPO)</h2>
            <p>
              Para dúvidas sobre privacidade/dados pessoais, contate nosso
              Encarregado:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2>15. Uso de imagem, voz e biografia para divulgação</h2>
            <p>
              Podemos solicitar o seu <strong>consentimento específico</strong>{" "}
              para usar sua <strong>imagem, voz, nome e biografia</strong> em
              materiais de divulgação do Cristãos App (site, blog, redes
              sociais, anúncios e peças institucionais). O consentimento
              especificará as finalidades, o período e os canais.
            </p>
            <p>
              Você poderá <strong>revogar</strong> esse consentimento a qualquer
              momento no{" "}
              <Link to={PRIVACY_CENTER_PATH}>Centro de Privacidade</Link> ou por
              e-mail para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A
              revogação não exige justificativa e interromperá novos usos.
              Materiais já publicados podem permanecer dentro dos limites legais
              e prazos de guarda aplicáveis.
            </p>
          </section>

          <section>
            <h2>16. Dados agregados e anonimizados</h2>
            <p>
              Podemos produzir e utilizar{" "}
              <strong>estatísticas agregadas</strong> e
              <strong> dados anonimizados</strong> (que não identificam você)
              para analisar desempenho, melhorar a Plataforma e apoiar decisões
              de negócio.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
