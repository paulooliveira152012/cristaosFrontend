import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const PlatformGuidelines = () => {
  const navigate = useNavigate()
  return (
    <div className='screenWrapper'>
      <div className='scrollable'>

      <Header showProfileImage={false} navigate={navigate}/>

      <h1>📜 Diretrizes da Fé</h1>

        <section>
          <h2>1. Visão e Propósito</h2>
          <ul>
            <li>
              A promoção da unidade entre cristãos genuínos, independentemente
              de suas denominações. <em>Efésios 4</em>.
            </li>
            <li>
              O combate a doutrinas e tradições extra-bíblicas que dividem o
              Corpo de Cristo.
            </li>
            <li>
              O incentivo a estudos bíblicos contínuos, cultos regionais e
              comunhão entre irmãos.
            </li>
            <li>
              A criação de uma rede de promotores locais para conduzir cultos
              físicos com reverência e responsabilidade.
            </li>
            <li>
              Incentivo ao julgamento responsável de tudo o que for ensinado ou
              profetizado:
              <ul>
                <li>
                  “Examinai tudo. Retende o bem.” –{" "}
                  <em>1 Tessalonicenses 5:21</em>
                </li>
                <li>
                  “Os espíritos dos profetas estão sujeitos aos próprios
                  profetas.” – <em>1 Coríntios 14:32</em>
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2>2. Doutrinas Essenciais da Fé Cristã</h2>
          <ul>
            <li>
              <strong>Divindade de Cristo</strong> – Jesus é Deus encarnado (
              <em>João 1:1, Colossenses 2:9</em>).
            </li>
            <li>
              <strong>Trindade</strong> – Um só Deus em três Pessoas: Pai, Filho
              e Espírito Santo (<em>Mateus 28:19</em>).
            </li>
            <li>
              <strong>Expiação eficaz</strong> – Só o sacrifício de Jesus salva
              (<em>Isaías 53, Hebreus 10</em>).
            </li>
            <li>
              <strong>Ressurreição corporal</strong> – Cristo ressuscitou
              fisicamente ao terceiro dia (<em>1 Coríntios 15</em>).
            </li>
            <li>
              <strong>Inspiração das Escrituras</strong> – A Bíblia é a Palavra
              de Deus (<em>2 Timóteo 3:16</em>).
            </li>
            <li>
              <strong>Salvação pela graça</strong> – Não por obras, mas pela fé
              (<em>Efésios 2:8-9</em>).
            </li>
            <li>
              <strong>Nascimento espiritual</strong> – Regeneração pelo Espírito
              (<em>João 3:3-7</em>).
            </li>
            <li>
              <strong>Unidade do Corpo de Cristo</strong> – Um só povo de Deus (
              <em>Efésios 4:3-6</em>).
            </li>
            <li>
              <strong>Segunda vinda de Cristo</strong> – Ele voltará para julgar
              e reinar (<em>Atos 1:11; Apocalipse 19</em>).
            </li>
            <li>
              <strong>Chamado à santidade</strong> – Vida transformada e
              irrepreensível (<em>1 Pedro 1:15-16</em>).
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Conduta nas Salas Públicas</h2>
          <ul>
            <li>Apenas a mensagem do Evangelho deve ser compartilhada.</li>
            <li>
              Discussões doutrinárias são proibidas, exceto:
              <ul>
                <li>Profecias messiânicas (1ª e 2ª vinda).</li>
                <li>Exortações ao arrependimento, fé e santidade.</li>
                <li>
                  Defesa da fé cristã contra ataques externos (apologética).
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Salas Privadas</h2>
          <ul>
            <li>Conversas doutrinárias respeitosas.</li>
            <li>Exortações bíblicas de irmão para irmão.</li>
            <li>Compartilhamento de pedidos de oração.</li>
          </ul>
        </section>

        <section>
          <h2>5. Pureza da Comunicação</h2>
          <ul>
            <li>
              É proibido:
              <ul>
                <li>Linguagem ofensiva, xingamentos ou palavras torpes.</li>
                <li>
                  Conteúdos que ferem princípios cristãos de pureza, reverência
                  e edificação.
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Maturidade e Paciência</h2>
          <p>
            Cada crente está em um estágio de crescimento. Como em{" "}
            <em>Romanos 14</em>, os fortes devem ter paciência com os fracos,
            ensinar com amor e não desprezar.
          </p>
        </section>

        <section>
          <h2>7. A Escritura tem a Palavra Final</h2>
          <p>
            Quando houver dúvidas ou debates, a boa exegese bíblica deve
            prevalecer. Nenhuma tradição, líder ou opinião está acima da Bíblia.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PlatformGuidelines;
