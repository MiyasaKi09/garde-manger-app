// app/layout.js
import "./globals.css";
import { Suspense } from "react";
import MinimalistHeader from "@/components/MinimalistHeader";
// si tu utilises le fond + scrim :
import MatisseCutoutsBGRandom from "@/components/MatisseCutoutsBGRandom";
import ReadableScrim from "@/components/ReadableScrim";

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

        {/* Fond Matisse + scrim de lisibilité */}
        <MatisseCutoutsBGRandom />
        <ReadableScrim />

        <main style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              padding: "2rem",
              background: "rgba(12,17,12,.35)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 16,
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
          </div>
        </main>
      </body>
    </html>
  );
}
