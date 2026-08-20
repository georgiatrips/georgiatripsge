"use client";

import React, { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            background: "#ffffff",
            padding: "3rem 2rem",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
          }}
        >
          <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "1rem" }}>⚠️</span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d233a", marginBottom: "0.75rem" }}>
            Application Error
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            An unexpected global error occurred. Please refresh or try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.75rem",
              background: "#29b2b7",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
