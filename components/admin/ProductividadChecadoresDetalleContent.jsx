'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Loader2,
  RefreshCcw,
  Timer,
  UserCheck
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';

import { productividadDetalleApi } from '@/lib/productividadDetalleApi';

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

function formatHours(value) {
  return `${Number(value || 0).toFixed(2)} h`;
}

function KpiCard({ title, value, subtitle, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ring-1 ${
      dark
        ? 'bg-slate-950 text-white ring-slate-900'
        : 'bg-white text-slate-950 ring-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-widest ${
            dark ? 'text-white/60' : 'text-slate-400'
          }`}>
            {title}
          </p>

          <p className="mt-3 text-3xl font-black">
            {value}
          </p>

          <p className={`mt-2 text-sm font-bold ${
            dark ? 'text-white/70' : 'text-slate-500'
          }`}>
            {subtitle}
          </p>
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          dark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
        }`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function ProductividadChecadoresDetalleContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({
    fecha: todayLocal(),
    checador_id: ''
  });

  const [data, setData] = useState({
    resumen: null,
    ranking: [],
    registros: []
  });

  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedChecador = useMemo(() => {
    if (!selectedId) return null;

    return data.ranking.find((item) => String(item.checador_id) === String(selectedId)) || null;
  }, [data.ranking, selectedId]);

  const selectedRegistros = useMemo(() => {
    if (!selectedId) return data.registros;

    return data.registros.filter((item) => String(item.checador_id) === String(selectedId));
  }, [data.registros, selectedId]);

  function setValue(key, value) {
    setFiltros((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function cargarDetalle() {
    try {
      setLoading(true);
      setError('');

      const response = await productividadDetalleApi.listarChecadores(filtros);

      setData({
        resumen: response.resumen || null,
        ranking: response.ranking || [],
        registros: response.registros || []
      });

      if (filtros.checador_id) {
        setSelectedId(filtros.checador_id);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de checadores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDetalle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = selectedChecador || data.resumen || {};

  return (
    <AdminShell
      role={role}
      title="Detalle de productividad por checador"
      subtitle="Productividad individual del equipo de checadores con base en el reporte importado."
    >
      <div className="space-y-5">
        <ReportPanel
          title="Filtros"
          subtitle="Consulta por fecha y checador."
          right={
            <button
              type="button"
              onClick={cargarDetalle}
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
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Fecha
              </span>

              <input
                type="date"
                value={filtros.fecha}
                onChange={(e) => setValue('fecha', e.target.value)}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Checador
              </span>

              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setValue('checador_id', e.target.value);
                }}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              >
                <option value="">Todos los checadores</option>
                {data.ranking.map((item) => (
                  <option key={item.checador_id} value={item.checador_id}>
                    {item.checador_nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </ReportPanel>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <KpiCard
            title="Salidas"
            value={formatNumber(resumen.salidas)}
            subtitle={`${formatNumber(resumen.registros)} registros`}
            icon={ClipboardCheck}
            dark
          />

          <KpiCard
            title="Salidas/h jornada"
            value={formatNumber(resumen.salidas_por_hora_jornada)}
            subtitle={`${formatHours(resumen.jornada_disponible_horas)} jornada`}
            icon={Timer}
          />

          <KpiCard
            title="TP"
            value={formatNumber(resumen.tp)}
            subtitle={`${formatNumber(resumen.tp_por_hora_jornada)} TP/h jornada`}
            icon={UserCheck}
          />

          <KpiCard
            title="Total"
            value={formatNumber(resumen.total)}
            subtitle={`${formatNumber(resumen.total_por_hora_jornada)} total/h jornada`}
            icon={UserCheck}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <ReportPanel
            title="Ranking de checadores"
            subtitle="Ordenado por salidas/h jornada."
          >
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm font-bold text-slate-500">Cargando...</p>
              ) : null}

              {!loading && data.ranking.length === 0 ? (
                <p className="text-sm font-bold text-slate-500">
                  No hay registros con estos filtros.
                </p>
              ) : null}

              {data.ranking.map((item, index) => (
                <button
                  key={item.checador_id}
                  type="button"
                  onClick={() => setSelectedId(item.checador_id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    String(selectedId) === String(item.checador_id)
                      ? 'border-[var(--color-primary)] bg-red-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950">
                        #{index + 1} · {item.checador_nombre}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Código: {item.checador_codigo} · {item.registros} registros
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
                      <p className="text-[10px] font-black uppercase text-white/60">
                        Salidas/h
                      </p>
                      <p className="text-sm font-black">
                        {formatNumber(item.salidas_por_hora_jornada)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ReportPanel>

          <ReportPanel
            title={selectedChecador ? `Detalle · ${selectedChecador.checador_nombre}` : 'Detalle de registros'}
            subtitle="Detalle del reporte importado."
          >
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Checador</th>
                    <th className="px-3 py-3">Salida</th>
                    <th className="px-3 py-3">Est</th>
                    <th className="px-3 py-3">Requisición</th>
                    <th className="px-3 py-3 text-right">TP</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3">Observaciones</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedRegistros.map((registro) => (
                    <tr key={registro.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-bold text-slate-700">
                        {registro.fecha}
                      </td>
                      <td className="px-3 py-4 font-black text-slate-950">
                        {registro.checador_nombre}
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-700">
                        {registro.num_salida}
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-700">
                        {registro.est || '-'}
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-700">
                        {registro.num_requisicion || '-'}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(registro.tp)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(registro.total)}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-500">
                        {registro.observaciones || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportPanel>
        </div>
      </div>
    </AdminShell>
  );
}