'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

type Occurrence = {
  id: string
  ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  estado: string | null
  data_reporte: string | null
  data_encerramento: string | null
  fora_sla: boolean | null
  created_by: string | null
}

export default function RelatoriosPage() {
  const supabase = createClient()

  const [data, setData] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  // 🔐 buscar role do utilizador
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      setRole(profile?.role || null)
    }

    fetchUserRole()
  }, [])

  // 📊 buscar ocorrências
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .order('data_reporte', { ascending: false })

      if (!error) setData(data || [])

      setLoading(false)
    }

    fetchData()
  }, [])

  // 🎯 aplicar filtros
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return (
        (filtroEstado ? item.estado === filtroEstado : true) &&
        (filtroCategoria ? item.categoria === filtroCategoria : true)
      )
    })
  }, [data, filtroEstado, filtroCategoria])

  // 📈 métricas
  const total = filteredData.length
  const fechadas = filteredData.filter((o) => o.estado === 'fechado').length
  const abertas = filteredData.filter((o) => o.estado !== 'fechado').length
  const foraSLA = filteredData.filter((o) => o.fora_sla).length

  // 📤 exportar Excel (apenas admin/gestor)
  const exportExcel = () => {
    if (role !== 'admin' && role !== 'gestor') {
      alert('Sem permissão para exportar')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatórios')
    XLSX.writeFile(workbook, 'relatorios.xlsx')
  }

  if (loading) return <p>A carregar...</p>

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Relatórios</h1>

      {/* 🎛️ filtros */}
      <div className="flex gap-4 flex-wrap bg-gray-100 p-4 rounded-xl shadow">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">Todos estados</option>
          <option value="aberto">Aberto</option>
          <option value="em curso">Em curso</option>
          <option value="fechado">Fechado</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">Todas categorias</option>
          <option value="eletricidade">Eletricidade</option>
          <option value="canalização">Canalização</option>
          <option value="equipamento">Equipamento</option>
        </select>

        {(role === 'admin' || role === 'gestor') && (
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Exportar Excel
          </button>
        )}
      </div>

      {/* 📊 métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total" value={total} />
        <Card title="Abertas" value={abertas} />
        <Card title="Fechadas" value={fechadas} />
        <Card title="Fora SLA" value={foraSLA} />
      </div>

      {/* 📋 tabela */}
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Ocorrência</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Prioridade</th>
              <th className="p-2">Data</th>
              <th className="p-2">SLA</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.ocorrencia}</td>
                <td className="p-2">{item.categoria}</td>
                <td className="p-2">{item.estado}</td>
                <td className="p-2">{item.prioridade}</td>
                <td className="p-2">{item.data_reporte}</td>
                <td className="p-2">
                  {item.fora_sla ? (
                    <span className="text-red-600 font-bold">Fora</span>
                  ) : (
                    <span className="text-green-600">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 🧱 componente card
function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 text-center">
      <p className="text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
