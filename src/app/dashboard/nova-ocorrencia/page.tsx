'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIAS, PRIORIDADES, IMPACTOS } from '@/lib/constants'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

type Unit = {
  id: string
  nome: string
}

const styles = {
  page: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
  } as const,

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    maxWidth: '1100px',
  } as const,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  } as const,

  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },

  fieldFull: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    gridColumn: '1 / -1',
  } as const,

  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  } as const,

  input: {
    minHeight: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  } as const,

  textarea: {
    minHeight: '120px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    resize: 'vertical' as const,
    outline: 'none',
  } as const,

  helper: {
    fontSize: '13px',
    color: '#64748b',
  } as const,

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '24px',
  } as const,

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  } as const,

  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  } as const,

  messageError: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  messageSuccess: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  sectionTitle: {
    margin: '0 0 18px 0',
    fontSize: '24px',
    fontWeight: 700,
  } as const,

  previewWrap: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  } as const,

  previewImage: {
    maxWidth: '320px',
    maxHeight: '240px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    objectFit: 'cover' as const,
  } as const,

  fileInfo: {
    fontSize: '13px',
    color: '#475569',
  } as const,
}

export default function NovaOcorrenciaPage() {
  const supabase = createClient()

  const [units, setUnits] = useState<Unit[]>([])
  const [unidadeId, setUnidadeId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')

  const [loadingUnits, setLoadingUnits] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadUnits() {
      setLoadingUnits(true)

      const { data, error } = await supabase
        .from('units')
        .select('id, nome')
        .order('nome', { ascending: true })

      if (error) {
        setErrorMessage(`Erro ao carregar unidades: ${error.message}`)
        setUnits([])
        setLoadingUnits(false)
        return
      }

      setUnits((data || []) as Unit[])
      setLoadingUnits(false)
    }

    loadUnits()
  }, [supabase])

  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview)
      }
    }
  }, [fotoPreview])

  function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null

    if (!file) {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
      setFotoFile(null)
      setFotoPreview('')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('A fotografia tem de ser JPG, JPEG, PNG ou WEBP.')
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
      setFotoFile(null)
      setFotoPreview('')
      return
    }

    const maxSizeMb = 5
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`A fotografia não pode ultrapassar ${maxSizeMb} MB.`)
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
      setFotoFile(null)
      setFotoPreview('')
      return
    }

    if (fotoPreview) URL.revokeObjectURL(fotoPreview)

    setErrorMessage('')
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function uploadFoto(userId: string) {
    if (!fotoFile) return null

    const extension = fotoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
      ? extension
      : 'jpg'

    const fileName = `${userId}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`

    const { error: uploadError } = await supabase.storage
      .from('ocorrencias')
      .upload(fileName, fotoFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erro ao enviar fotografia: ${uploadError.message}`)
    }

    return fileName
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!unidadeId) {
      setErrorMessage('Seleciona uma unidade.')
      setLoading(false)
      return
    }

    if (!descricao.trim()) {
      setErrorMessage('Preenche a descrição da ocorrência.')
      setLoading(false)
      return
    }

    if (!categoria) {
      setErrorMessage('Seleciona a categoria.')
      setLoading(false)
      return
    }

    if (!prioridade) {
      setErrorMessage('Seleciona a prioridade.')
      setLoading(false)
      return
    }

    if (!impacto) {
      setErrorMessage('Seleciona o impacto.')
      setLoading(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setErrorMessage('Sessão inválida. Volta a iniciar sessão.')
      setLoading(false)
      return
    }

    const unidadeSelecionada = units.find((u) => u.id === unidadeId)

    if (!unidadeSelecionada) {
      setErrorMessage('A unidade selecionada é inválida.')
      setLoading(false)
      return
    }

    const agora = new Date()
    const agoraIso = agora.toISOString()
    const hoje = agoraIso.slice(0, 10)

    let fotoUrl: string | null = null

    try {
      fotoUrl = await uploadFoto(user.id)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao enviar fotografia.')
      setLoading(false)
      return
    }

    const payload = {
      unidade_id: unidadeSelecionada.id,
      local_ocorrencia: unidadeSelecionada.nome,
      ocorrencia: descricao.trim(),
      categoria,
      prioridade,
      impacto,
      estado: 'Em aberto',
      data_reporte: hoje,
      data_estado: agoraIso,
      observacoes: observacoes.trim() || null,
      created_by: user.id,
      created_by_email: user.email || null,
      updated_by_email: user.email || null,
      foto_url: fotoUrl,
    }

    const { error } = await supabase.from('occurrences').insert([payload])

    if (error) {
      setErrorMessage(`Erro ao guardar: ${error.message}`)
      setLoading(false)
      return
    }

    setSuccessMessage('Ocorrência criada com sucesso.')

    if (fotoPreview) URL.revokeObjectURL(fotoPreview)

    setUnidadeId('')
    setDescricao('')
    setCategoria('')
    setPrioridade('')
    setImpacto('')
    setObservacoes('')
    setFotoFile(null)
    setFotoPreview('')

    setLoading(false)

    window.location.href = '/dashboard?refresh=' + Date.now()
  }

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Nova Ocorrência"
        subtitle="Registo de nova avaria ou necessidade de intervenção."
        actions={[
          {
            label: 'Voltar ao dashboard',
            href: '/dashboard',
            variant: 'default',
          },
        ]}
      />

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados da ocorrência</h2>

        {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
        {successMessage && <div style={styles.messageSuccess}>{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Unidade</label>
              <select
                style={styles.input}
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
                disabled={loading || loadingUnits}
                required
              >
                <option value="">
                  {loadingUnits ? 'A carregar unidades...' : 'Selecionar unidade'}
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Categoria</label>
              <select
                style={styles.input}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Selecionar categoria</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Prioridade</label>
              <select
                style={styles.input}
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Selecionar prioridade</option>
                {PRIORIDADES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Impacto</label>
              <select
                style={styles.input}
                value={impacto}
                onChange={(e) => setImpacto(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Selecionar impacto</option>
                {IMPACTOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>Descrição da ocorrência</label>
              <input
                style={styles.input}
                placeholder="Ex.: Falha no sistema de iluminação do corredor principal"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={loading}
                required
              />
              <div style={styles.helper}>
                Descreve de forma simples e clara o problema reportado.
              </div>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>Observações</label>
              <textarea
                style={styles.textarea}
                placeholder="Informação adicional, contexto, urgência, localização exata, etc."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={loading}
                rows={5}
              />
              <div style={styles.helper}>
                Campo opcional. Podes acrescentar detalhes úteis para a análise.
              </div>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>Fotografia</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={styles.input}
                onChange={handleFotoChange}
                disabled={loading}
              />
              <div style={styles.helper}>
                Campo opcional. Formatos permitidos: JPG, JPEG, PNG ou WEBP. Máximo recomendado: 5 MB.
              </div>

              {(fotoFile || fotoPreview) && (
                <div style={styles.previewWrap}>
                  {fotoFile && (
                    <div style={styles.fileInfo}>
                      Ficheiro selecionado: <strong>{fotoFile.name}</strong>
                    </div>
                  )}

                  {fotoPreview && (
                    <img
                      src={fotoPreview}
                      alt="Pré-visualização da fotografia"
                      style={styles.previewImage}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={styles.actions}>
            <button type="submit" style={styles.btnPrimary} disabled={loading || loadingUnits}>
              {loading ? 'A guardar...' : 'Guardar ocorrência'}
            </button>

            <button
              type="button"
              style={styles.btnSecondary}
              onClick={() => {
                window.location.href = '/dashboard'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
