"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NovaOcorrencia() {
  const [form, setForm] = useState({
    local_ocorrencia: "",
    ocorrencia: "",
    categoria: "",
    prioridade: "",
    impacto: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
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
      alert("Erro ao guardar");
    } else {
      alert("Ocorrência criada com sucesso!");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Nova Ocorrência</h1>

      <form onSubmit={handleSubmit}>
        <input name="local_ocorrencia" placeholder="Local" onChange={handleChange} />

        <input name="ocorrencia" placeholder="Descrição" onChange={handleChange} />

        <select name="categoria" onChange={handleChange}>
          <option value="">Categoria</option>
          <option value="Iluminação">Iluminação</option>
          <option value="Elétrica">Elétrica</option>
          <option value="AVAC">AVAC</option>
        </select>

        <select name="prioridade" onChange={handleChange}>
          <option value="">Prioridade</option>
          <option value="Baixa">Baixa</option>
          <option value="Média">Média</option>
          <option value="Alta">Alta</option>
          <option value="Urgente">Urgente</option>
        </select>

        <select name="impacto" onChange={handleChange}>
          <option value="">Impacto</option>
          <option value="Baixo">Baixo</option>
          <option value="Médio">Médio</option>
          <option value="Alto">Alto</option>
          <option value="Crítico">Crítico</option>
        </select>

        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
