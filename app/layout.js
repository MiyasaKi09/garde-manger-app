// app/layout.js
import "./globals.css";
import { Suspense } from "react";
import MinimalistHeader from "@/components/MinimalistHeader";
import MatisseCutoutsBG from "@/components/MatisseCutoutsBG";

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
      <body
        style={{
          background:
            "linear-gradient(180deg, var(--bg-top, #0b0f0a), var(--bg-bottom, #1a2318))",
        }}
      >
        <MinimalistHeader />
        <MatisseCutoutsBG />

        <main
          className="main-container"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "2rem",
            minHeight: "calc(100vh - 150px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "300px",
                  gap: "1rem",
                }}
              >
                <div className="loading-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <p style={{ color: "var(--forest-600)", fontSize: "0.95rem" }}>
                  Connexion au réseau mycorhizien...
                </p>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
