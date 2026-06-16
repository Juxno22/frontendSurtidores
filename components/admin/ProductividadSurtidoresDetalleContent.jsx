'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Clock,
  Loader2,
  PackageCheck,
  RefreshCcw,
  TimerReset,
  UserRound,
  Warehouse
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';

import { productividadDetalleApi } from '@/lib/productividadDetalleApi';
import { sucursalesApi, surtidoresApi } from '@/lib/productividadApi';

import {
  formatDurationHHMMSS,
  formatHourMinute
} from '@/lib/timeFormat';

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

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      >
        {children}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      <input
        type="date"
        value={value}
        onChange={onChange}
        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

export default function ProductividadSurtidoresDetalleContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({
    fecha: todayLocal(),
    sucursal_id: '',
    surtidor_id: ''
  });

  const [sucursales, setSucursales] = useState([]);
  const [surtidores, setSurtidores] = useState([]);

  const [data, setData] = useState({
    resumen: null,
    ranking: [],
    sesiones: []
  });

  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedSurtidor = useMemo(() => {
    if (!selectedId) return null;

    return data.ranking.find((item) => String(item.surtidor_id) === String(selectedId)) || null;
  }, [data.ranking, selectedId]);

  const selectedSesiones = useMemo(() => {
    if (!selectedId) return data.sesiones;

    return data.sesiones.filter((item) => String(item.surtidor_id) === String(selectedId));
  }, [data.sesiones, selectedId]);

  function setValue(key, value) {
    setFiltros((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function cargarCatalogos() {
    try {
      const [sucursalesRes, surtidoresRes] = await Promise.all([
        sucursalesApi.listarActivas(),
        surtidoresApi.listar({ activo: 1 })
      ]);

      setSucursales(sucursalesRes.sucursales || []);
      setSurtidores(surtidoresRes.surtidores || []);
    } catch {
      setSucursales([]);
      setSurtidores([]);
    }
  }

  async function cargarDetalle() {
    try {
      setLoading(true);
      setError('');

      const response = await productividadDetalleApi.listarSurtidores(filtros);

      setData({
        resumen: response.resumen || null,
        ranking: response.ranking || [],
        sesiones: response.sesiones || []
      });

      if (filtros.surtidor_id) {
        setSelectedId(filtros.surtidor_id);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de productividad.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogos();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDetalle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = selectedSurtidor || data.resumen || {};

  return (
    <AdminShell
      role={role}
      title="Detalle de productividad por surtidor"
      subtitle="Revisión individual de surtidos, horas reales de inicio/fin y tiempos muertos entre surtidos."
    >
      <div className="space-y-5">
        <ReportPanel
          title="Filtros"
          subtitle="Consulta por fecha, sucursal o surtidor."
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
          <div className="grid gap-4 md:grid-cols-3">
            <DateField
              label="Fecha"
              value={filtros.fecha}
              onChange={(e) => setValue('fecha', e.target.value)}
            />

            <SelectField
              label="Sucursal"
              value={filtros.sucursal_id}
              onChange={(e) => setValue('sucursal_id', e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Surtidor"
              value={filtros.surtidor_id}
              onChange={(e) => {
                setValue('surtidor_id', e.target.value);
                setSelectedId(e.target.value);
              }}
            >
              <option value="">Todos los surtidores</option>
              {surtidores.map((surtidor) => (
                <option key={surtidor.id} value={surtidor.id}>
                  {surtidor.nombre}
                </option>
              ))}
            </SelectField>
          </div>
        </ReportPanel>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <KpiCard
            title="Partidas surtidas"
            value={formatNumber(resumen.partidas_surtidas)}
            subtitle={`${formatNumber(resumen.surtido_total)} surtido total`}
            icon={PackageCheck}
            dark
          />

          <KpiCard
            title="Partidas/h jornada"
            value={formatNumber(resumen.partidas_por_hora_jornada)}
            subtitle={`${formatHours(resumen.jornada_disponible_horas)} jornada disponible`}
            icon={Activity}
          />

          <KpiCard
            title="Tiempo activo"
            value={formatDurationHHMMSS(resumen.tiempo_activo_segundos)}
            subtitle="Inicio a fin del surtido"
            icon={Clock}
          />

          <KpiCard
            title="Tiempo muerto"
            value={formatDurationHHMMSS(resumen.tiempo_muerto_segundos)}
            subtitle="Entre surtido y surtido"
            icon={TimerReset}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <ReportPanel
            title="Ranking individual"
            subtitle="Ordenado por partidas/h jornada."
          >
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm font-bold text-slate-500">Cargando...</p>
              ) : null}

              {!loading && data.ranking.length === 0 ? (
                <p className="text-sm font-bold text-slate-500">
                  No hay sesiones finalizadas con estos filtros.
                </p>
              ) : null}

              {data.ranking.map((item, index) => (
                <button
                  key={item.surtidor_id}
                  type="button"
                  onClick={() => setSelectedId(item.surtidor_id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    String(selectedId) === String(item.surtidor_id)
                      ? 'border-[var(--color-primary)] bg-red-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950">
                        #{index + 1} · {item.surtidor_nombre}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Código: {item.surtidor_codigo} · {item.sesiones} sesiones
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
                      <p className="text-[10px] font-black uppercase text-white/60">
                        Partidas/h
                      </p>
                      <p className="text-sm font-black">
                        {formatNumber(item.partidas_por_hora_jornada)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400">Partidas</p>
                      <p className="text-sm font-black text-slate-950">
                        {formatNumber(item.partidas_surtidas)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400">Activo</p>
                      <p className="text-sm font-black text-slate-950">
                        {formatDurationHHMMSS(item.tiempo_activo_segundos)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400">Muerto</p>
                      <p className="text-sm font-black text-slate-950">
                        {formatDurationHHMMSS(item.tiempo_muerto_segundos)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ReportPanel>

          <ReportPanel
            title={selectedSurtidor ? `Detalle · ${selectedSurtidor.surtidor_nombre}` : 'Detalle de surtidos'}
            subtitle="Cada fila representa un bloque de surtido capturado desde la app."
          >
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                    <th className="px-3 py-3">Surtidor</th>
                    <th className="px-3 py-3">Sucursal</th>
                    <th className="px-3 py-3">Inicio</th>
                    <th className="px-3 py-3">Fin</th>
                    <th className="px-3 py-3 text-right">Activo</th>
                    <th className="px-3 py-3 text-right">Muerto anterior</th>
                    <th className="px-3 py-3 text-right">Surtido total</th>
                    <th className="px-3 py-3 text-right">Partidas</th>
                    <th className="px-3 py-3 text-right">Ceros</th>
                    <th className="px-3 py-3 text-right">Negados</th>
                    <th className="px-3 py-3 text-right">Partidas/h activa</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedSesiones.map((sesion) => (
                    <tr key={sesion.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-black text-slate-950">
                        {sesion.surtidor_nombre}
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-600">
                        {sesion.sucursal_nombre}
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-700">
                        {formatHourMinute(sesion.hora_inicio)}
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-700">
                        {formatHourMinute(sesion.hora_fin)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatDurationHHMMSS(sesion.duracion_laboral_segundos)}
                      </td>
                      <td className="px-3 py-4 text-right font-black text-amber-700">
                        {formatDurationHHMMSS(sesion.tiempo_muerto_anterior_segundos)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(sesion.surtido_total)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(sesion.partidas_surtidas)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(sesion.ceros)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(sesion.negados)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatNumber(sesion.partidas_por_hora_activa)}
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