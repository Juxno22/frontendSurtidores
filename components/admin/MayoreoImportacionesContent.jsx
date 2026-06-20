'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Loader2,
  PackageSearch,
  RefreshCcw,
  TimerReset,
  Upload,
  Warehouse
} from 'lucide-react';

import AdminShell from './AdminShell';
import PowerBiCard from './PowerBiCard';
import ReportPanel from './ReportPanel';
import { mayoreoApi } from '@/lib/mayoreoApi';
import { formatDurationHHMMSS } from '@/lib/timeFormat';

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthStartLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function numberFormat(value, decimals = 0) {
  return Number(value || 0).toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function moneyFormat(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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

function DateInput({ label, value, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

function ImportadorMayoreo({ title, subtitle, tipo, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState('');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState(null);

  function showMessage(typeMessage, text) {
    setMessage({ type: typeMessage, text });
    window.setTimeout(() => setMessage(null), 5000);
  }

  async function validar() {
    if (!file) {
      showMessage('warning', 'Selecciona un archivo Excel primero.');
      return;
    }

    try {
      setLoading('validar');
      const data = tipo === 'reportes'
        ? await mayoreoApi.validarReporteSurtidores(file)
        : await mayoreoApi.validarNegados(file);

      setPreview(data);
      showMessage('success', 'Archivo validado correctamente.');
    } catch (error) {
      setPreview(null);
      showMessage('error', error.message || 'No se pudo validar el archivo.');
    } finally {
      setLoading('');
    }
  }

  async function importar() {
    if (!file) {
      showMessage('warning', 'Selecciona un archivo Excel primero.');
      return;
    }

    try {
      setLoading('importar');
      const data = tipo === 'reportes'
        ? await mayoreoApi.importarReporteSurtidores(file)
        : await mayoreoApi.importarNegados(file);

      setPreview(data);
      showMessage('success', 'Archivo importado correctamente.');
      onImported?.();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo importar el archivo.');
    } finally {
      setLoading('');
    }
  }

  const resumen = preview?.resumen || {};

  return (
    <ReportPanel title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {message ? <Message type={message.type}>{message.text}</Message> : null}

        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Archivo Excel
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={validar}
              disabled={Boolean(loading)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading === 'validar' ? <Loader2 className="animate-spin" size={17} /> : <FileSpreadsheet size={17} />}
              Validar
            </button>

            <button
              type="button"
              onClick={importar}
              disabled={Boolean(loading)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-black text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {loading === 'importar' ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
              Importar
            </button>
          </div>
        </div>

        {preview ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Filas válidas</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{numberFormat(resumen.filas_validas)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reportables</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{numberFormat(resumen.codigos_reportables?.length)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin vincular</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{numberFormat(resumen.codigos_sin_vincular?.length)}</p>
            </div>
          </div>
        ) : null}

        {preview?.warnings?.length ? (
          <Message type="warning">
            {preview.warnings.slice(0, 5).join(' | ')}
          </Message>
        ) : null}
      </div>
    </ReportPanel>
  );
}

export default function MayoreoImportacionesContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({
    desde: monthStartLocal(),
    hasta: todayLocal()
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    resumen: null,
    ranking: [],
    productividad: null,
    productividadRanking: [],
    pendientes: { reportes: [], negados: [] },
    negados: []
  });

  function setValue(key, value) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  async function cargar() {
    try {
      setLoading(true);
      setError('');

      const [resumenRes, productividadRes, pendientesRes, negadosRes] = await Promise.all([
        mayoreoApi.resumen(filtros),
        mayoreoApi.productividad(filtros),
        mayoreoApi.pendientesVincular(filtros),
        mayoreoApi.negados({ ...filtros, limit: 120 })
      ]);

      setData({
        resumen: resumenRes.resumen || null,
        ranking: resumenRes.ranking || [],
        productividad: productividadRes.resumen || null,
        productividadRanking: productividadRes.ranking || [],
        pendientes: pendientesRes || { reportes: [], negados: [] },
        negados: negadosRes.negados || []
      });
    } catch (err) {
      setError(err.message || 'No se pudo cargar mayoreo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = data.resumen || {};
  const productividad = data.productividad || {};
  const pendientesReportes = data.pendientes?.reportes || [];
  const pendientesNegados = data.pendientes?.negados || [];

  return (
    <AdminShell
      role={role}
      title="Mayoreo"
      subtitle="Importación oficial, negados y productividad en horas de surtidores de mayoreo."
    >
      <div className="space-y-5">
        <ReportPanel
          title="Filtros"
          subtitle="Consulta la producción oficial y productividad de mayoreo por rango."
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
            <DateInput label="Desde" value={filtros.desde} onChange={(value) => setValue('desde', value)} />
            <DateInput label="Hasta" value={filtros.hasta} onChange={(value) => setValue('hasta', value)} />
          </div>
        </ReportPanel>

        {error ? <Message type="error">{error}</Message> : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <PowerBiCard
            title="Partidas netas"
            value={numberFormat(productividad.partidas_netas ?? resumen.partidas_netas)}
            subtitle={`${numberFormat(productividad.partidas_oficiales ?? resumen.partidas_oficiales)} oficiales`}
            icon={Warehouse}
            tone="dark"
          />
          <PowerBiCard
            title="Productividad activa"
            value={numberFormat(productividad.partidas_netas_por_hora_activa, 2)}
            subtitle="Partidas netas / tiempo activo"
            icon={Activity}
          />
          <PowerBiCard
            title="Tiempo activo"
            value={formatDurationHHMMSS(productividad.tiempo_activo_segundos)}
            subtitle={`${numberFormat(productividad.sesiones)} sesiones capturadas`}
            icon={Clock}
          />
          <PowerBiCard
            title="Negados pendientes"
            value={numberFormat(productividad.negados_pendientes ?? resumen.negados_pendientes)}
            subtitle={`${numberFormat(productividad.negados_penalizables ?? resumen.negados_penalizables)} penalizables`}
            icon={AlertTriangle}
            tone={Number(productividad.negados_pendientes || resumen.negados_pendientes || 0) > 0 ? 'red' : 'default'}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <PowerBiCard
            title="Tickets"
            value={numberFormat(productividad.tickets ?? resumen.tickets)}
            subtitle={`${numberFormat(productividad.movimientos ?? resumen.movimientos)} movimientos`}
            icon={FileSpreadsheet}
          />
          <PowerBiCard
            title="Neto"
            value={moneyFormat(productividad.neto ?? resumen.neto)}
            subtitle="Producción oficial del Excel"
            icon={PackageSearch}
          />
          <PowerBiCard
            title="Tiempo muerto"
            value={formatDurationHHMMSS(productividad.tiempo_muerto_segundos)}
            subtitle="Entre surtidos capturados"
            icon={TimerReset}
          />
          <PowerBiCard
            title="Conciliados"
            value={numberFormat(data.productividadRanking.filter((row) => row.productividad_conciliada).length)}
            subtitle="Con producción oficial y sesiones"
            icon={CheckCircle2}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ImportadorMayoreo
            title="Cargar reporte de surtidores mayoreo"
            subtitle="Archivo reporteSurtidores.xlsx. Se guardan todos los registros; solo los vinculados a surtidor MAYOREO activo entran a reportes."
            tipo="reportes"
            onImported={cargar}
          />

          <ImportadorMayoreo
            title="Cargar negados mayoreo"
            subtitle="Archivo negados.xlsx. Sirve como evidencia externa para cruzar contra negados declarados por surtidor."
            tipo="negados"
            onImported={cargar}
          />
        </div>

        <ReportPanel
          title="Productividad mayoreo con horas"
          subtitle="Combina producción oficial del Excel con tiempo activo y muerto capturado en la app. La hora del Excel no se usa para productividad."
        >
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-3">Surtidor</th>
                  <th className="px-3 py-3 text-right">Sesiones</th>
                  <th className="px-3 py-3 text-right">Activo</th>
                  <th className="px-3 py-3 text-right">Muerto</th>
                  <th className="px-3 py-3 text-right">Tickets</th>
                  <th className="px-3 py-3 text-right">Part. oficiales</th>
                  <th className="px-3 py-3 text-right">Penalizables</th>
                  <th className="px-3 py-3 text-right">Part. netas</th>
                  <th className="px-3 py-3 text-right">Netas/h activa</th>
                  <th className="px-3 py-3 text-right">Netas/h jornada</th>
                  <th className="px-3 py-3 text-right">Neto</th>
                  <th className="px-3 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.productividadRanking.map((row) => (
                  <tr key={row.surtidor_id} className="border-b border-slate-100">
                    <td className="px-3 py-4">
                      <p className="font-black text-slate-950">{row.surtidor_nombre}</p>
                      <p className="text-xs font-bold text-slate-500">{row.codigo_reporte || row.usuario || row.surtidor_codigo}</p>
                    </td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.sesiones)}</td>
                    <td className="px-3 py-4 text-right font-black">{formatDurationHHMMSS(row.tiempo_activo_segundos)}</td>
                    <td className="px-3 py-4 text-right font-black text-amber-700">{formatDurationHHMMSS(row.tiempo_muerto_segundos)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.tickets)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.partidas_oficiales)}</td>
                    <td className="px-3 py-4 text-right font-black text-red-700">{numberFormat(row.negados_penalizables)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.partidas_netas)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.partidas_netas_por_hora_activa, 2)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.partidas_netas_por_hora_jornada, 2)}</td>
                    <td className="px-3 py-4 text-right font-black">{moneyFormat(row.neto)}</td>
                    <td className="px-3 py-4 text-right">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${row.bloqueado_por_negados_pendientes ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : row.productividad_conciliada ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                        {row.bloqueado_por_negados_pendientes ? 'Pendiente' : row.productividad_conciliada ? 'Conciliado' : 'Incompleto'}
                      </span>
                    </td>
                  </tr>
                ))}

                {!data.productividadRanking.length ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-sm font-bold text-slate-500" colSpan={12}>
                      Sin datos de productividad mayoreo en este rango.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </ReportPanel>

        <ReportPanel
          title="Ranking oficial mayoreo"
          subtitle="Partidas oficiales y partidas netas sin mezclar tiempos. Se conserva como referencia del reporte importado."
        >
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-3">Surtidor</th>
                  <th className="px-3 py-3 text-right">Mov.</th>
                  <th className="px-3 py-3 text-right">Tickets</th>
                  <th className="px-3 py-3 text-right">Partidas oficiales</th>
                  <th className="px-3 py-3 text-right">Neg. Excel</th>
                  <th className="px-3 py-3 text-right">Pendientes</th>
                  <th className="px-3 py-3 text-right">Penalizables</th>
                  <th className="px-3 py-3 text-right">Partidas netas</th>
                  <th className="px-3 py-3 text-right">Neto</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((row) => (
                  <tr key={row.surtidor_id} className="border-b border-slate-100">
                    <td className="px-3 py-4">
                      <p className="font-black text-slate-950">{row.surtidor_nombre}</p>
                      <p className="text-xs font-bold text-slate-500">{row.codigo_reporte || row.usuario}</p>
                    </td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.movimientos)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.tickets)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.partidas_oficiales)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.negados_excel)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.negados_pendientes)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.negados_penalizables)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.partidas_netas)}</td>
                    <td className="px-3 py-4 text-right font-black">{moneyFormat(row.neto)}</td>
                  </tr>
                ))}

                {!data.ranking.length ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-sm font-bold text-slate-500" colSpan={9}>
                      Sin datos reportables de mayoreo en este rango.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </ReportPanel>

        <ReportPanel
          title="Pendientes de vincular"
          subtitle="Estos códigos se guardaron, pero no aparecen en reportes hasta registrarlos como usuario y surtidor MAYOREO."
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">Producción</h4>
              <div className="space-y-2">
                {pendientesReportes.slice(0, 12).map((row) => (
                  <div key={row.codigo_surtidor_reporte} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <div>
                      <p className="font-black text-slate-950">{row.codigo_surtidor_reporte}</p>
                      <p className="text-xs font-bold text-slate-500">{numberFormat(row.movimientos)} mov.</p>
                    </div>
                    <p className="font-black text-slate-950">{numberFormat(row.partidas)} TP</p>
                  </div>
                ))}
                {!pendientesReportes.length ? <Message type="success">No hay producción pendiente de vincular.</Message> : null}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">Negados</h4>
              <div className="space-y-2">
                {pendientesNegados.slice(0, 12).map((row) => (
                  <div key={row.codigo_surtidor_reporte} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <div>
                      <p className="font-black text-slate-950">{row.codigo_surtidor_reporte}</p>
                      <p className="text-xs font-bold text-slate-500">{numberFormat(row.filas_negados)} filas</p>
                    </div>
                    <p className="font-black text-slate-950">{numberFormat(row.cantidad_a_deber)} neg.</p>
                  </div>
                ))}
                {!pendientesNegados.length ? <Message type="success">No hay negados pendientes de vincular.</Message> : null}
              </div>
            </div>
          </div>
        </ReportPanel>

        <ReportPanel
          title="Negados importados"
          subtitle="Cruce informativo contra negados declarados en la app. La validación final sigue siendo del supervisor."
        >
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Surtidor</th>
                  <th className="px-3 py-3">Código</th>
                  <th className="px-3 py-3">Producto</th>
                  <th className="px-3 py-3 text-right">A deber</th>
                  <th className="px-3 py-3 text-right">Declarados</th>
                  <th className="px-3 py-3 text-right">Pendientes</th>
                  <th className="px-3 py-3 text-right">Penalizables</th>
                </tr>
              </thead>
              <tbody>
                {data.negados.slice(0, 80).map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-3 py-4 font-bold">{row.fecha_operativa}</td>
                    <td className="px-3 py-4">
                      <p className="font-black text-slate-950">{row.surtidor_nombre}</p>
                      <p className="text-xs font-bold text-slate-500">{row.codigo_surtidor_reporte}</p>
                    </td>
                    <td className="px-3 py-4 font-black">{row.codigo_producto}</td>
                    <td className="px-3 py-4 font-bold text-slate-600">{row.producto}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.cantidad_a_deber)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.negados_declarados_mismo_dia_producto)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.declarados_pendientes)}</td>
                    <td className="px-3 py-4 text-right font-black">{numberFormat(row.declarados_penalizables)}</td>
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
