import "../styles/style.css";
import { useNavigate } from "react-router-dom";
// import Salas from "../components/Salas";
import Salas2 from "../components/liveRoom/Salas2";
import Liveusers from "../components/Liveusers";
import Listings from "../components/Listings";
import Header from "../components/Header";
import SupportUs from "../components/SupportUs";
import PullToRefresh from "react-pull-to-refresh";
import GoogleAd from "../ads/GoogleAd";
import SuggestionsComponent from "../components/SuggestionsComponent";

const Landing = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload(); // ou chame fetchListings se tiver separado
  };

  return (
    <div>
      <div>
        <Header
          showBackButton={false}
          showBackArrow={false}
          showLeaveButton={false}
          showCloseIcon={false}
          navigate={navigate}
        />
        <SupportUs />

        <Salas2 />
        <SuggestionsComponent />
        <Liveusers />
        <Listings />
        <GoogleAd />

        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Landing;
