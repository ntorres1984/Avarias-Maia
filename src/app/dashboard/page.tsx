import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ unidade?: string; dataInicio?: string; dataFim?: string }>; }) {
  await requireUser();
  const { unidade, dataInicio, dataFim } = await searchParams;
  const supabase = await createClient();

  let baseQuery = supabase.from('occurrences').select('estado, prioridade, data_reporte, prazo_previsto, resolvida_fora_sla, units(nome)');
  if (dataInicio) baseQuery = baseQuery.gte('data_reporte', dataInicio);
  if (dataFim) baseQuery = baseQuery.lte('data_reporte', dataFim);
  if (unidade) baseQuery = baseQuery.eq('units.nome', unidade);

  const [{ count: total }, { count: abertas }, { count: concluidas }, { data: ocorrencias }, { data: units }, { count: foraSla }] = await Promise.all([
    supabase.from('occurrences').select('*', { count: 'exact', head: true }),
    supabase.from('occurrences').select('*', { count: 'exact', head: true }).in('estado', ['Em aberto', 'Em análise', 'A aguardar resposta', 'Em execução']),
    supabase.from('occurrences').select('*', { count: 'exact', head: true }).eq('estado', 'Concluída'),
    baseQuery,
    supabase.from('units').select('nome').eq('ativo', true).order('nome'),
    supabase.from('occurrences').select('*', { count: 'exact', head: true }).eq('resolvida_fora_sla', true),
  ]);

  const byStatusMap = new Map<string, number>();
  const byUnitMap = new Map<string, number>();
  (ocorrencias ?? []).forEach((item: any) => {
    byStatusMap.set(item.estado, (byStatusMap.get(item.estado) || 0) + 1);
    const unitName = item.units?.nome || 'Sem unidade';
    byUnitMap.set(unitName, (byUnitMap.get(unitName) || 0) + 1);
  });

  const byStatus = Array.from(byStatusMap.entries()).map(([name, total]) => ({ name, total }));
  const byUnit = Array.from(byUnitMap.entries()).map(([name, total]) => ({ name, total }));
  const mediaSla = (() => {
    const totalSla = (ocorrencias ?? []).filter((i: any) => i.prazo_previsto).length;
    const dentro = totalSla - (foraSla ?? 0);
    return totalSla ? Math.round((dentro / totalSla) * 100) : 0;
  })();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-slate-600">Indicadores operacionais, SLA e distribuição por unidade.</p></div>
        <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
          <select name="unidade" defaultValue={unidade || ''} className="rounded-xl border p-3"><option value="">Todas as unidades</option>{(units ?? []).map((u: any) => <option key={u.nome} value={u.nome}>{u.nome}</option>)}</select>
          <input type="date" name="dataInicio" defaultValue={dataInicio || ''} className="rounded-xl border p-3" />
          <input type="date" name="dataFim" defaultValue={dataFim || ''} className="rounded-xl border p-3" />
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-white">Aplicar filtros</button>
        </form>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Total</p><p className="text-3xl font-bold">{total ?? 0}</p></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Em aberto</p><p className="text-3xl font-bold">{abertas ?? 0}</p></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Concluídas</p><p className="text-3xl font-bold">{concluidas ?? 0}</p></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Fora SLA</p><p className="text-3xl font-bold">{foraSla ?? 0}</p></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Cumprimento SLA</p><p className="text-3xl font-bold">{mediaSla}%</p></div>
        </div>
        <DashboardCharts byStatus={byStatus} byUnit={byUnit} />
      </div>
    </main>
  );
}
