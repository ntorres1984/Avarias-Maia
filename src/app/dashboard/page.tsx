"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <button onClick={() => setMostrar(!mostrar)}>
        Nova Ocorrência
      </button>

      {mostrar && (
        <div style={{ marginTop: 20 }}>
          <h2>Formulário</h2>
          <input placeholder="Local" />
        </div>
      )}
    </div>
  );
}
