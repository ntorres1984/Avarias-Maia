"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [form, setForm] = useState({
    local_ocorrencia: "",
    ocorrencia: "",
    categoria: "",
    prioridade: "",
    impacto: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("occurrences").insert([
      {
        local_ocorrencia: form.local_ocorrencia,
        ocorrencia: form.ocorrencia,
        categoria: form.categoria,
        prioridade: form.prioridade,
        impacto: form.impacto,
        estado: "Registada",
      },
    ]);

    if (error) {
      alert("Erro ao guardar ocorrência.");
      console.error(error);
      return;
    }

    alert("Ocorrência criada com sucesso!");
    setForm({
      local_ocorrencia: "",
      ocorrencia: "",
      categoria: "",
      prioridade: "",
      impacto: "",
    });
    setMostrarFormulario(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Indicadores operacionais, SLA e distribuição por unidade.</p>

      <button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
        {mostrarFormulario ? "Fechar formulário" : "Nova Ocorrência"}
      </button>

      {mostrarFormulario && (
        <div style={{ marginTop: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2>Registar Nova Ocorrência</h2>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 500 }}>
            <input
              name="local_ocorrencia"
              placeholder="Local da ocorrência"
              value={form.local_ocorrencia}
              onChange={handleChange}
            />

            <input
              name="ocorrencia"
              placeholder="Descrição da ocorrência"
              value={form.ocorrencia}
              onChange={handleChange}
            />

            <select name="categoria" value={form.categoria} onChange={handleChange}>
              <option value="">Categoria</option>
              <option value="Iluminação">Iluminação</option>
              <option value="Elétrica">Elétrica</option>
              <option value="AVAC">AVAC</option>
              <option value="Canalização">Canalização</option>
              <option value="Serralharia">Serralharia</option>
              <option value="Outros">Outros</option>
            </select>

            <select name="prioridade" value={form.prioridade} onChange={handleChange}>
              <option value="">Prioridade</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>

            <select name="impacto" value={form.impacto} onChange={handleChange}>
              <option value="">Impacto</option>
              <option value="Baixo">Baixo</option>
              <option value="Médio">Médio</option>
              <option value="Alto">Alto</option>
              <option value="Crítico">Crítico</option>
            </select>

            <button type="submit">Guardar ocorrência</button>
          </form>
        </div>
      )}
    </div>
  );
}
