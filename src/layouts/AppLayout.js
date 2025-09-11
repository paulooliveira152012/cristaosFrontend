// src/layouts/AppLayout.jsx
import { Fragment } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdsBootstrap from "../ads/AdsBootstrap";
import GoogleAd from "../ads/GoogleAd";
import { isAdsAllowed } from "../ads/allowList"; // veja o item 2 abaixo

export default function AppLayout() {
  const { pathname } = useLocation();
  const canShowAds = isAdsAllowed(pathname);

  return (
    <Fragment>
      {/* NÃO use <main> aqui. Isso mantém sua árvore original intacta */}
      <Outlet />

      {canShowAds && (
        <>
          <AdsBootstrap clientId={process.env.REACT_APP_ADS_CLIENT} />
          <div style={{ maxWidth: 1000, margin: "24px auto", minHeight: 250, backgroundColor:"blue"}}>
            <GoogleAd slot="3175280799" />
          </div>
        </>
      )}
    </Fragment>
  );
}
