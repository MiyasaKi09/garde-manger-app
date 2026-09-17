// app/layout.js
import "./globals.css";
import "./styles/tokens.css";
import "./styles/v21.css";
import { Suspense } from "react";
import { Fraunces, Inter, Crimson_Text, JetBrains_Mono } from "next/font/google";
import MinimalistHeader from "@/components/MinimalistHeader";
import MatisseWallpaperRandom from "@/components/MatisseWallpaperRandom";
import ToastContainer from "@/components/Toast";
import CacheWarmer from "@/components/CacheWarmer";
import ServiceWorkerBridge from "@/components/ServiceWorkerBridge";
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

/**
 * APPLICATION INSTALLABLE (livrable 3.7)
 *
 * Trois choses seulement rendent une application installable, et elles sont
 * toutes les trois ici ou pointées d'ici : un manifeste RÉFÉRENCÉ par le
 * document, des icônes qu'il déclare, et une couleur de thème. Un manifeste
 * posé dans `public/` et jamais référencé ne s'installe sur aucun téléphone —
 * il faut le dire, parce que c'est exactement l'état dans lequel ce livrable a
 * été trouvé.
 *
 * `manifest` écrit le `<link rel="manifest">`. `appleWebApp` écrit les balises
 * qu'iOS lit, et lui seul : Safari n'installe pas depuis le manifeste, il
 * installe depuis « Sur l'écran d'accueil », et c'est `apple-mobile-web-app-*`
 * plus `apple-touch-icon` qui décident alors du nom, de la barre d'état et de
 * l'icône. Les deux familles cohabitent : aucune des deux n'est de trop.
 */
export const metadata = {
  title: "Myko — Réseau mycorhizien",
  description: "Cultivez les connexions entre cuisine, garde-manger et potager",
  applicationName: "Myko",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/myko-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/myko-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Myko",
    // « default » et non « black-translucent » : le contenu passerait alors sous
    // l'encoche, et l'en-tête fixé de l'application y serait illisible.
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

/**
 * `viewport` est un export à part depuis Next 14 : `themeColor` et
 * `viewport` posés dans `metadata` y sont ignorés avec un avertissement au
 * build, et la barre système resterait blanche.
 *
 * `viewportFit: "cover"` fait dessiner sous l'encoche. `maximumScale` n'est pas
 * borné : une application installée qu'on ne peut plus agrandir est une
 * application qu'une personne presbyte ne lit pas debout devant son frigo.
 *
 * UNE SEULE COULEUR DE THÈME, ET C'EST CELLE DE L'ÉCRAN. `#F3EFE4` est
 * `--paper` (`app/globals.css:53`), le fond de `body` et la teinte de
 * l'en-tête fixé (`MinimalistHeader.jsx:186`) : la barre système se fond dans
 * l'en-tête au lieu de poser un bandeau d'une autre couleur au-dessus. Aucune
 * variante sombre n'est déclarée, parce qu'il n'y en a pas : `globals.css` ne
 * contient aucune règle `prefers-color-scheme` (vérifié), et une barre système
 * sombre au-dessus d'une application qui reste claire serait un thème annoncé
 * et pas tenu. La même valeur est dans `public/manifest.webmanifest` — deux
 * valeurs différentes se départageraient selon le navigateur.
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3EFE4",
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
        
        {/* Système de notifications toast */}
        <ToastContainer />

        {/* Préchargement prédictif des données partagées (au repos) */}
        <CacheWarmer />

        {/* Application installable : enregistre le service worker et lui déclare
            la version de plan active, qui versionne son cache. Sans ce
            composant, `public/sw.js` n'est qu'un fichier servi que personne
            n'exécute. */}
        <ServiceWorkerBridge />
      </body>
    </html>
  );
}
