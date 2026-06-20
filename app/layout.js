// app/layout.js
import "./globals.css";
import "./styles/tokens.css";
import "./styles/v21.css";
import { Suspense } from "react";
import { Fraunces, Inter, Crimson_Text, JetBrains_Mono } from "next/font/google";
import MinimalistHeader from "@/components/MinimalistHeader";
import MobileTabBar from "@/components/MobileTabBar";
import MatisseWallpaperRandom from "@/components/MatisseWallpaperRandom";
import ToastContainer from "@/components/Toast";
import CacheWarmer from "@/components/CacheWarmer";
import "../components/Toast.css";

// Polices auto-hébergées via next/font (remplacent les <link> Google Fonts :
// perf, plus de requête réseau bloquante, pas de FOUT).
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-crimson",
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-jetbrains" });

export const metadata = {
  title: "Myko — Réseau mycorhizien",
  description: "Cultivez les connexions entre cuisine, garde-manger et potager",
};

// Viewport mobile explicite (largeur de l'appareil, zoom autorisé pour l'a11y,
// couleur de barre système accordée au papier).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2EEE3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable} ${crimson.variable} ${jetbrains.variable}`}>
      <body>
        {/* Header fixé */}
        <MinimalistHeader />

        {/* Fond papier-peint Matisse (lé unique, suit le scroll) */}
        <MatisseWallpaperRandom />

        {/* Contenu sans overlay sombre */}
        <main className="main">
          <Suspense
            fallback={
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  minHeight: 240,
                  padding: "2rem",
                }}
              >
                <div className="loading-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
        
        {/* Navigation primaire mobile (barre d'onglets en bas, ≤ 860px) */}
        <MobileTabBar />

        {/* Système de notifications toast */}
        <ToastContainer />

        {/* Préchargement prédictif des données partagées (au repos) */}
        <CacheWarmer />
      </body>
    </html>
  );
}
