'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { CATEGORIAS, PRIORIDADES, IMPACTOS } from '../../../lib/constants'
import DashboardTopbar from '../../../components/dashboard/DashboardTopbar'

type Unit = {
  id: string
  nome: string | null
}

type Profile = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo: boolean | null
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

  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 700,
  } as const,

  subtitle: {
    margin: '0 0 20px 0',
    color: '#64748b',
    fontSize: '14px',
  } as const,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  } as const,

  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  } as const,

  fieldFull: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    gridColumn: '1 / -1',
  } as const,

  label: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  } as const,

  input: {
    width: '100%',
    minHeight: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as const,

  textarea: {
    width: '100%',
    minHeight: '140px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    outline: 'none',
  } as const,

  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '20px',
    color: '#1e3a8a',
    fontSize: '14px',
  } as const,

  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  success: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
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

  smallInfo: {
    color: '#64748b',
    fontSize: '12px',
  } as const,

  previewWrap: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  } as const,

  previewImage: {
    maxWidth: '260px',
    maxHeight: '200px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    objectFit: 'cover' as const,
  } as const,
}

export default function NovaOcorrenciaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [units, setUnits] = useState<Unit[]>([])

  const [ocorrencia, setOcorrencia] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [localOcorrencia, setLocalOcorrencia] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [slaDias, setSlaDias] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadInitialData() {
      setLoadingPage(true)
      setErrorMessage('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.replace('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, nome, email, role, ativo')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        setErrorMessage(profileError?.message || 'Não foi possível carregar o perfil.')
        setLoadingPage(false)
        return
      }

      const currentProfile = profileData as Profile

      if (currentProfile.ativo === false) {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      setProfile(currentProfile)

      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('id, nome')
        .order('nome', { ascending: true })

      if (unitsError) {
        console.error('Erro ao carregar unidades:', unitsError)
      } else {
        setUnits((unitsData || []) as Unit[])
      }

      setLoadingPage(false)
    }

    void loadInitialData()
  }, [router, supabase])

  useEffect(() => {
    if (!fotoFile) {
      setFotoPreview('')
      return
    }

    const objectUrl = URL.createObjectURL(fotoFile)
    setFotoPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [fotoFile])

  const unidadeSelecionada = useMemo(() => {
    return units.find((item) => item.id === unidadeId) || null
  }, [units, unidadeId])

  async function uploadImageIfNeeded(userId: string) {
    if (!fotoFile) return null

    const extension = fotoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg'
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExtension}`

    const { error: uploadError } = await supabase.storage
      .from('ocorrencias')
      .upload(filePath, fotoFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erro ao carregar imagem: ${uploadError.message}`)
    }

    return filePath
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setErrorMessage('Sessão inválida.')
      setLoading(false)
      return
    }

    if (!ocorrencia.trim()) {
      setErrorMessage('Indica a descrição da ocorrência.')
      setLoading(false)
      return
    }

    if (!categoria) {
      setErrorMessage('Seleciona uma categoria.')
      setLoading(false)
      return
    }

    if (!prioridade) {
      setErrorMessage('Seleciona uma prioridade.')
      setLoading(false)
      return
    }

    if (!impacto) {
      setErrorMessage('Seleciona um impacto.')
      setLoading(false)
      return
    }

    if (!unidadeId && !localOcorrencia.trim()) {
      setErrorMessage('Seleciona a unidade ou indica o local da ocorrência.')
      setLoading(false)
      return
    }

    let fotoPath: string | null = null

    try {
      fotoPath = await uploadImageIfNeeded(user.id)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao carregar a imagem.')
      setLoading(false)
      return
    }

    const nowIso = new Date().toISOString()

    const payload = {
      ocorrencia: ocorrencia.trim(),
      local_ocorrencia: unidadeSelecionada?.nome || localOcorrencia.trim() || null,
      unidade_id: unidadeId || null,
      categoria,
      prioridade,
      impacto,
      estado: 'Em aberto',
      observacoes: observacoes.trim() || null,
      sla_dias: slaDias ? Number(slaDias) : null,
      data_reporte: nowIso,
      data_estado: nowIso,
      data_encerramento: null,
      created_by: user.id,
      created_by_email: user.email || profile?.email || null,
      updated_by_email: user.email || profile?.email || null,
      foto_url: fotoPath,
      assigned_gestor: null,
      assigned_gestor_email: null,
      assigned_gestor_at: null,
      assigned_tecnico: null,
      assigned_tecnico_email: null,
      assigned_tecnico_at: null,
      forwarded_by: null,
      forwarded_by_email: null,
      area: null,
      fora_sla: false,
    }

    const { error: insertError } = await supabase
      .from('occurrences')
      .insert([payload])

    if (insertError) {
      setErrorMessage(`Erro ao guardar ocorrência: ${insertError.message}`)
      setLoading(false)
      return
    }

    setSuccessMessage('Ocorrência registada com sucesso.')
    setLoading(false)

    setTimeout(() => {
      router.push('/dashboard')
    }, 900)
  }

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Nova Ocorrência"
        subtitle="Regista uma nova ocorrência para posterior tratamento e encaminhamento."
        actions={[
          {
            label: 'Voltar ao dashboard',
            href: '/dashboard',
            variant: 'gray',
          },
        ]}
      />

      {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
      {successMessage ? <div style={styles.success}>{successMessage}</div> : null}

      {loadingPage ? (
        <div style={styles.card}>A carregar...</div>
      ) : (
        <div style={styles.card}>
          <h2 style={styles.title}>Registo da ocorrência</h2>
          <p style={styles.subtitle}>
            A ocorrência ficará inicialmente em aberto. O encaminhamento para gestor será feito
            numa fase seguinte pelo administrador.
          </p>

          <div style={styles.infoBox}>
            Utilizador atual: <strong>{profile?.nome || profile?.email || '-'}</strong>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Ocorrência</label>
                <input
                  type="text"
                  style={styles.input}
                  value={ocorrencia}
                  onChange={(e) => setOcorrencia(e.target.value)}
                  placeholder="Descreve resumidamente a ocorrência"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Unidade</label>
                <select
                  style={styles.input}
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                >
                  <option value="">Selecionar unidade</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.nome || '-'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Local da ocorrência</label>
                <input
                  type="text"
                  style={styles.input}
                  value={localOcorrencia}
                  onChange={(e) => setLocalOcorrencia(e.target.value)}
                  placeholder="Opcional se selecionares unidade"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Categoria</label>
                <select
                  style={styles.input}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="">Selecionar categoria</option>
                  {CATEGORIAS.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
                >
                  <option value="">Selecionar impacto</option>
                  {IMPACTOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Prazo de resolução (dias)</label>
                <input
                  type="number"
                  min="0"
                  style={styles.input}
                  value={slaDias}
                  onChange={(e) => setSlaDias(e.target.value)}
                  placeholder="Ex.: 5"
                />
                <div style={styles.smallInfo}>
                  Podes deixar em branco se não quiseres definir já o prazo.
                </div>
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Observações</label>
                <textarea
                  style={styles.textarea}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais, contexto, localização exata, etc."
                />
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  style={styles.input}
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                />

                {fotoPreview ? (
                  <div style={styles.previewWrap}>
                    <img
                      src={fotoPreview}
                      alt="Pré-visualização da imagem"
                      style={styles.previewImage}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div style={styles.actions}>
              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? 'A guardar...' : 'Guardar ocorrência'}
              </button>

              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => router.push('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
