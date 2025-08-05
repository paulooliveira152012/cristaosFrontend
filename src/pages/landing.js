import "../styles/style.css";
import { useNavigate } from "react-router-dom";
import Salas from "../components/Salas";
import Liveusers from "../components/Liveusers";
import Footer from "../components/Footer";
import Listings from "../components/Listings";
import Header from "../components/Header";
import { useRoom } from "../context/RoomContext";
import SupportUs from "../components/SupportUs";
import PullToRefresh from "react-pull-to-refresh";

const Landing = () => {
  const navigate = useNavigate();
  const { minimizedRoom } = useRoom();

  const handleRefresh = () => {
    window.location.reload(); // ou chame fetchListings se tiver separado
  };

  return (
    <div>
      <div>
      <PullToRefresh onRefresh={handleRefresh}>
        <Header
          showBackButton={false}
          showBackArrow={false}
          showLeaveButton={false}
          showCloseIcon={false}
          navigate={navigate}
        />
      <SupportUs />
      </PullToRefresh>
      <Salas />
      <Liveusers />
      <Listings />

      {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Landing;
