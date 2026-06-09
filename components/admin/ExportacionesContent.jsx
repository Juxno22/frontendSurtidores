'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Store,
  Warehouse
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';

import { exportacionesApi } from '@/lib/exportacionesApi';
import { sucursalesApi, surtidoresApi } from '@/lib/productividadApi';

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function Message({ type, children }) {
  const styles = {
    success: 'border-green-200 bg-green-50 text-green-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700'
  };

  return (
    <div className={`rounded-3xl border px-5 py-4 text-sm font-bold ${styles[type] || styles.info}`}>
      {children}
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
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
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
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

function ExportButton({
  label,
  description,
  icon: Icon,
  onClick,
  loading,
  variant = 'dark'
}) {
  const variants = {
    dark: 'bg-slate-950 text-white hover:bg-slate-800',
    red: 'bg-[var(--color-primary)] text-white hover:brightness-95',
    white: 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex w-full min-w-0 items-center gap-4 rounded-3xl p-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
    >
      <div className={variant === 'white'
        ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700'
        : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white'
      }>
        {loading ? <Loader2 className="animate-spin" size={22} /> : <Icon size={22} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">
          {label}
        </p>

        <p className={variant === 'white'
          ? 'mt-1 line-clamp-2 text-xs font-semibold text-slate-500'
          : 'mt-1 line-clamp-2 text-xs font-semibold text-white/75'
        }>
          {description}
        </p>
      </div>
    </button>
  );
}

function FiltrosExportacion({
  filtros,
  setFiltros,
  sucursales,
  surtidores,
  onReset
}) {
  function setValue(key, value) {
    setFiltros((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  return (
    <ReportPanel
      title="Filtros de exportación"
      subtitle="Estos filtros aplican a las descargas de reportes."
      right={
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={15} />
          Reiniciar
        </button>
      }
    >
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DateField
          label="Fecha diaria"
          value={filtros.fecha}
          onChange={(e) => setValue('fecha', e.target.value)}
        />

        <DateField
          label="Desde"
          value={filtros.desde}
          onChange={(e) => setValue('desde', e.target.value)}
        />

        <DateField
          label="Hasta"
          value={filtros.hasta}
          onChange={(e) => setValue('hasta', e.target.value)}
        />

        <SelectField
          label="Formato"
          value={filtros.formato}
          onChange={(e) => setValue('formato', e.target.value)}
        >
          <option value="xlsx">Excel .xlsx</option>
          <option value="csv">CSV</option>
        </SelectField>

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
          onChange={(e) => setValue('surtidor_id', e.target.value)}
        >
          <option value="">Todos los surtidores</option>

          {surtidores.map((surtidor) => (
            <option key={surtidor.id} value={surtidor.id}>
              {surtidor.nombre}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Estado de sesión"
          value={filtros.estado}
          onChange={(e) => setValue('estado', e.target.value)}
        >
          <option value="">Todos</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="CANCELADO">Cancelado</option>
        </SelectField>
      </div>
    </ReportPanel>
  );
}

export default function ExportacionesContent({ role = 'ADMIN' }) {
  const defaultFilters = {
    fecha: todayLocal(),
    desde: addDays(todayLocal(), -7),
    hasta: todayLocal(),
    sucursal_id: '',
    surtidor_id: '',
    estado: '',
    formato: 'xlsx'
  };

  const [filtros, setFiltros] = useState(defaultFilters);
  const [sucursales, setSucursales] = useState([]);
  const [surtidores, setSurtidores] = useState([]);

  const [downloading, setDownloading] = useState('');
  const [message, setMessage] = useState(null);

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
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

  async function runDownload(key, fn) {
    try {
      setDownloading(key);

      await fn();

      showMessage('success', 'Descarga generada correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo generar la descarga.');
    } finally {
      setDownloading('');
    }
  }

  function dailyParams() {
    return {
      fecha: filtros.fecha,
      sucursal_id: filtros.sucursal_id,
      surtidor_id: filtros.surtidor_id,
      formato: filtros.formato
    };
  }

  function sesionesFechaParams() {
    return {
      fecha: filtros.fecha,
      sucursal_id: filtros.sucursal_id,
      surtidor_id: filtros.surtidor_id,
      estado: filtros.estado,
      formato: filtros.formato
    };
  }

  function sesionesRangoParams() {
    return {
      desde: filtros.desde,
      hasta: filtros.hasta,
      sucursal_id: filtros.sucursal_id,
      surtidor_id: filtros.surtidor_id,
      estado: filtros.estado,
      formato: filtros.formato
    };
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogos();
  }, []);

  return (
    <AdminShell
      role={role}
      title="Exportaciones"
      subtitle="Descarga reportes de productividad, comparativos y sesiones para análisis externo."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <FiltrosExportacion
          filtros={filtros}
          setFiltros={setFiltros}
          sucursales={sucursales}
          surtidores={surtidores}
          onReset={() => setFiltros(defaultFilters)}
        />

        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          <ReportPanel
            title="Reportes diarios"
            subtitle="Usan la fecha diaria seleccionada."
          >
            <div className="space-y-3">
              <ExportButton
                label="Dashboard del día"
                description="Excel con resumen, comparativo y ranking de surtidores."
                icon={BarChart3}
                variant="red"
                loading={downloading === 'dashboard-dia'}
                onClick={() => runDownload('dashboard-dia', () =>
                  exportacionesApi.dashboardDia(dailyParams())
                )}
              />

              <ExportButton
                label="Comparativo"
                description="App contra reporte grupal por sucursal."
                icon={FileSpreadsheet}
                loading={downloading === 'comparativo'}
                onClick={() => runDownload('comparativo', () =>
                  exportacionesApi.comparativo(dailyParams())
                )}
              />

              <ExportButton
                label="Concentrado por sucursal"
                description="Totales diarios agrupados por sucursal surtida."
                icon={Store}
                variant="white"
                loading={downloading === 'concentrado-sucursales'}
                onClick={() => runDownload('concentrado-sucursales', () =>
                  exportacionesApi.concentradoSucursales(dailyParams())
                )}
              />
            </div>
          </ReportPanel>

          <ReportPanel
            title="Productividad individual"
            subtitle="Exporta productividad por surtidor."
          >
            <div className="space-y-3">
              <ExportButton
                label="Concentrado por surtidores"
                description="Sesiones, tickets, partidas, monto, horas y ratios por surtidor."
                icon={Warehouse}
                variant="dark"
                loading={downloading === 'concentrado-surtidores'}
                onClick={() => runDownload('concentrado-surtidores', () =>
                  exportacionesApi.concentradoSurtidores(dailyParams())
                )}
              />

              <ExportButton
                label="Sesiones por fecha"
                description="Detalle de sesiones de la fecha seleccionada."
                icon={ClipboardList}
                variant="white"
                loading={downloading === 'sesiones-fecha'}
                onClick={() => runDownload('sesiones-fecha', () =>
                  exportacionesApi.sesiones(sesionesFechaParams())
                )}
              />
            </div>
          </ReportPanel>

          <ReportPanel
            title="Histórico / rango"
            subtitle="Usa desde y hasta para descargar sesiones."
          >
            <div className="space-y-3">
              <ExportButton
                label="Sesiones por rango"
                description="Detalle histórico de sesiones entre dos fechas."
                icon={CalendarDays}
                variant="dark"
                loading={downloading === 'sesiones-rango'}
                onClick={() => runDownload('sesiones-rango', () =>
                  exportacionesApi.sesiones(sesionesRangoParams())
                )}
              />

              <div className="rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
                Para reportes ejecutivos usa Excel. Para análisis rápido o importación externa usa CSV.
              </div>
            </div>
          </ReportPanel>
        </div>
      </div>
    </AdminShell>
  );
}