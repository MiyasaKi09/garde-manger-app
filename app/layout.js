// app/layout.js
import "./globals.css";
import { Suspense } from "react";
import MinimalistHeader from "@/components/MinimalistHeader";
import MatisseWallpaperRandom from "@/components/MatisseWallpaperRandom";
import ToastContainer from "@/components/Toast";
import "../components/Toast.css";

export const metadata = {
  title: "Myko — Réseau mycorhizien",
  description: "Cultivez les connexions entre cuisine, garde-manger et potager",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
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
      </body>
    </html>
  );
}
