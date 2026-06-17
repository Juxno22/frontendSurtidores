'use client';

import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Loader2,
  RefreshCcw,
  UserCheck,
  Users,
  Warehouse
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { productividadDetalleApi } from '@/lib/productividadDetalleApi';
import { formatDurationHHMMSS } from '@/lib/timeFormat';

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-MX');
}

function Kpi({ title, value, subtitle, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ring-1 ${dark ? 'bg-slate-950 text-white ring-slate-900' : 'bg-white text-slate-950 ring-slate-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-widest ${dark ? 'text-white/60' : 'text-slate-400'}`}>{title}</p>
          <p className="mt-3 text-3xl font-black">{value}</p>
          <p className={`mt-2 text-sm font-bold ${dark ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function ProductividadIntegralContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({ desde: todayLocal(), hasta: todayLocal() });
  const [data, setData] = useState({ resumen: null, usuarios: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function setValue(key, value) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  async function cargar() {
    try {
      setLoading(true);
      setError('');
      const response = await productividadDetalleApi.productividadIntegralUsuarios(filtros);
      setData({ resumen: response.resumen || null, usuarios: response.usuarios || [] });
    } catch (err) {
      setError(err.message || 'No se pudo cargar la productividad integral.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = data.resumen || {};

  return (
    <AdminShell role={role} title="Productividad integral" subtitle="Une productividad de usuarios que participan como surtidores y checadores.">
      <div className="space-y-5">
        <ReportPanel
          title="Filtros"
          subtitle="Consulta diaria o por rango. Solo considera usuarios vinculados y activos."
          right={
            <button
              type="button"
              onClick={cargar}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCcw size={17} />}
              Actualizar
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Desde</span>
              <input type="date" value={filtros.desde} onChange={(e) => setValue('desde', e.target.value)} className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Hasta</span>
              <input type="date" value={filtros.hasta} onChange={(e) => setValue('hasta', e.target.value)} className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100" />
            </label>
          </div>
        </ReportPanel>

        {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <Kpi title="Usuarios" value={formatNumber(resumen.usuarios)} subtitle={`${formatNumber(resumen.mixtos)} mixtos`} icon={Users} dark />
          <Kpi title="Partidas surtidas" value={formatNumber(resumen.partidas_surtidas)} subtitle={`${formatNumber(resumen.surtido_total)} surtido total`} icon={Warehouse} />
          <Kpi title="Salidas checadas" value={formatNumber(resumen.salidas)} subtitle={`${formatNumber(resumen.tp)} TP`} icon={ClipboardCheck} />
          <Kpi title="Usuarios mixtos" value={formatNumber(resumen.mixtos)} subtitle="Surtidor + checador" icon={UserCheck} />
        </div>

        <ReportPanel title="Detalle integral por usuario" subtitle="No se mezclan unidades distintas en un solo score; se muestran surtido y chequeo por separado.">
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-3">Usuario</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3 text-right">Partidas</th>
                  <th className="px-3 py-3 text-right">Surtido total</th>
                  <th className="px-3 py-3 text-right">Activo surtido</th>
                  <th className="px-3 py-3 text-right">Partidas/h jornada</th>
                  <th className="px-3 py-3 text-right">Salidas</th>
                  <th className="px-3 py-3 text-right">TP</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">Salidas/h jornada</th>
                  <th className="px-3 py-3 text-right">TP/h jornada</th>
                </tr>
              </thead>
              <tbody>
                {data.usuarios.map((item) => (
                  <tr key={item.key} className="border-b border-slate-100">
                    <td className="px-3 py-4">
                      <p className="font-black text-slate-950">{item.nombre}</p>
                      <p className="text-xs font-bold text-slate-500">{item.usuario || '-'} · {item.rol || '-'}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${item.es_mixto ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : item.es_surtidor ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-green-50 text-green-700 ring-1 ring-green-200'}`}>
                        {item.es_mixto ? 'Mixto' : item.es_surtidor ? 'Surtidor' : 'Checador'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.surtidor.partidas_surtidas)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.surtidor.surtido_total)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatDurationHHMMSS(item.surtidor.tiempo_activo_segundos)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.surtidor.partidas_por_hora_jornada)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.checador.salidas)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.checador.tp)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.checador.total)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.checador.salidas_por_hora_jornada)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatNumber(item.checador.tp_por_hora_jornada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPanel>
      </div>
    </AdminShell>
  );
}
