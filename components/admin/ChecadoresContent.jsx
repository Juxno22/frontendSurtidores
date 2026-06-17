'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Link2,
  Loader2,
  RefreshCcw,
  Search,
  Upload,
  Users
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import PowerBiCard from './PowerBiCard';
import { checadoresApi } from '@/lib/checadoresApi';
import { usuariosApi } from '@/lib/usuariosApi';
import { exportacionesApi } from '@/lib/exportacionesApi';

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
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, children }) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      >
        {children}
      </select>
    </label>
  );
}

function ImportadorExcel({ onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState('');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState(null);

  function showMessage(type, text) {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4500);
  }

  async function validar() {
    if (!file) {
      showMessage('warning', 'Selecciona un archivo Excel primero.');
      return;
    }

    try {
      setLoading('validar');
      const data = await checadoresApi.validarExcel(file);
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
      const data = await checadoresApi.importarExcel(file);
      setPreview(data);
      showMessage('success', 'Reporte importado correctamente.');
      onImported?.();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo importar el archivo.');
    } finally {
      setLoading('');
    }
  }

  return (
    <ReportPanel
      title="Cargar reporte de checadores"
      subtitle="Se importan todos los registros. Los códigos sin usuario se guardan, pero no aparecen en productividad hasta vincularse."
    >
      <div className="space-y-4">
        {message ? <Message type={message.type}>{message.text}</Message> : null}

        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Archivo Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
              }}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={validar}
              disabled={loading !== ''}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading === 'validar' ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
              Validar Excel
            </button>

            <button
              type="button"
              onClick={importar}
              disabled={loading !== ''}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {loading === 'importar' ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
              Importar
            </button>
          </div>
        </div>

        {preview?.resumen ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Salidas</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{numberFormat(preview.resumen.total_salidas)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">TP</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{numberFormat(preview.resumen.total_tp)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Checadores</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{numberFormat(preview.resumen.checadores_detectados?.length)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Vinculados</p>
              <p className="mt-2 text-2xl font-black text-green-700">{numberFormat(preview.resumen.codigos_vinculados_a_usuarios?.length || preview.resumen.vinculados_auto?.length)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pendientes</p>
              <p className="mt-2 text-2xl font-black text-amber-700">{numberFormat(preview.resumen.codigos_sin_usuario?.length || preview.resumen.pendientes_vincular?.length)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Rango</p>
              <p className="mt-2 text-sm font-black text-slate-950">{preview.resumen.fecha_min || '-'} / {preview.resumen.fecha_max || '-'}</p>
            </div>
          </div>
        ) : null}

        {preview?.warnings?.length ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-amber-700">
              <AlertTriangle size={17} />
              Advertencias
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs font-semibold text-amber-700">
              {preview.warnings.slice(0, 20).map((warning, index) => (
                <li key={`${warning}-${index}`}>• {warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ReportPanel>
  );
}

function Filtros({ filtros, setFiltros, checadores, onRefresh }) {
  function setValue(key, value) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ReportPanel
      title="Filtros"
      subtitle="Consulta productividad por rango, día o checador vinculado."
      right={
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={15} />
          Actualizar
        </button>
      }
    >
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <DateInput label="Desde" value={filtros.desde} onChange={(value) => setValue('desde', value)} />
        <DateInput label="Hasta" value={filtros.hasta} onChange={(value) => setValue('hasta', value)} />
        <SelectInput label="Checador" value={filtros.checador_id} onChange={(value) => setValue('checador_id', value)}>
          <option value="">Todos</option>
          {checadores.map((checador) => (
            <option key={checador.id} value={checador.id}>
              {checador.nombre_visible} · {checador.codigo_reporte}
            </option>
          ))}
        </SelectInput>
      </div>
    </ReportPanel>
  );
}

function PendientesVincular({ pendientes, usuarios, onVincular, onAutoVincular, loading, role }) {
  const [selection, setSelection] = useState({});

  if (role !== 'ADMIN') return null;

  return (
    <ReportPanel
      title="Pendientes de vincular"
      subtitle="Se guardan para auditoría, pero no aparecen en productividad hasta vincularlos con un usuario existente."
      right={
        <button
          type="button"
          onClick={onAutoVincular}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={15} /> : <Link2 size={15} />}
          Vincular automático
        </button>
      }
    >
      {pendientes.length === 0 ? (
        <div className="rounded-3xl bg-green-50 p-5 text-sm font-bold text-green-700 ring-1 ring-green-200">
          No hay checadores pendientes de vincular.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Código reporte</th>
                <th className="px-4 py-3">Nombre reporte</th>
                <th className="px-4 py-3">Usuario existente</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendientes.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-black text-slate-950">{row.codigo_reporte}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{row.nombre_reporte || row.nombre}</td>
                  <td className="px-4 py-3">
                    <select
                      value={selection[row.id] || ''}
                      onChange={(e) => setSelection((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
                    >
                      <option value="">Selecciona usuario...</option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} · {usuario.usuario} · {usuario.rol}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onVincular(row, selection[row.id])}
                      disabled={!selection[row.id] || loading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2 text-xs font-black text-white hover:brightness-95 disabled:opacity-60"
                    >
                      <CheckCircle2 size={15} />
                      Vincular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportPanel>
  );
}

function RankingTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
            <th className="px-4 py-3">Checador</th>
            <th className="px-4 py-3 text-right">Salidas</th>
            <th className="px-4 py-3 text-right">TP</th>
            <th className="px-4 py-3 text-right">TP/h</th>
            <th className="px-4 py-3 text-right">Salidas/h</th>
            <th className="px-4 py-3 text-right">Participación</th>
            <th className="px-4 py-3 text-right">Horas jornada</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.checador_id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-black text-slate-950">{row.checador_nombre}</p>
                <p className="text-xs font-bold text-slate-500">
                  {row.codigo_reporte} {row.tambien_surtidor ? '· también surtidor' : ''}
                </p>
              </td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.salidas)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.tp)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.tp_por_hora_laboral, 2)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.salidas_por_hora_laboral, 2)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.participacion_tp_pct, 2)}%</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.horas_laborales, 2)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{moneyFormat(row.total_importe)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!rows.length ? (
        <div className="rounded-3xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
          No hay datos de checadores vinculados en el rango seleccionado.
        </div>
      ) : null}
    </div>
  );
}

function PorFechaTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3 text-right">Checadores</th>
            <th className="px-4 py-3 text-right">Salidas</th>
            <th className="px-4 py-3 text-right">TP</th>
            <th className="px-4 py-3 text-right">TP/h equipo</th>
            <th className="px-4 py-3 text-right">Salidas/h</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.fecha} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black text-slate-950">{row.fecha}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.checadores_activos)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.salidas)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.tp)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.tp_por_hora_equipo, 2)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.salidas_por_hora_equipo, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetalleTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Checador</th>
            <th className="px-4 py-3">Salida</th>
            <th className="px-4 py-3">Req.</th>
            <th className="px-4 py-3">Observación</th>
            <th className="px-4 py-3 text-right">TP</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Est</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-700">{row.fecha}</td>
              <td className="px-4 py-3 font-black text-slate-950">{row.checador_nombre}</td>
              <td className="px-4 py-3 font-bold text-slate-700">{row.num_salida}</td>
              <td className="px-4 py-3 font-bold text-slate-700">{row.num_requisicion || '-'}</td>
              <td className="px-4 py-3 font-semibold text-slate-600">{row.observaciones || '-'}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{numberFormat(row.tp)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-800">{moneyFormat(row.total)}</td>
              <td className="px-4 py-3 font-bold text-slate-500">{row.est || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChecadoresContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({ desde: monthStartLocal(), hasta: todayLocal(), checador_id: '' });
  const [checadores, setChecadores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ desde: filtros.desde, hasta: filtros.hasta, checador_id: filtros.checador_id }), [filtros]);

  async function cargarTodo() {
    try {
      setLoading(true);
      setError('');

      const [checadoresRes, usuariosRes, dashboardRes, reportesRes] = await Promise.all([
        checadoresApi.listar({}),
        usuariosApi.listar({ activo: 1 }),
        checadoresApi.dashboard(params),
        checadoresApi.reportes({ ...params, limit: 300 })
      ]);

      setChecadores(checadoresRes.checadores || []);
      setUsuarios(usuariosRes.usuarios || []);
      setDashboard(dashboardRes);
      setReportes(reportesRes.reportes || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar checadores.');
    } finally {
      setLoading(false);
    }
  }

  async function vincularManual(checador, usuarioId) {
    if (!usuarioId) return;

    try {
      setLinking(true);
      await checadoresApi.actualizar(checador.id, {
        codigo_reporte: checador.codigo_reporte,
        nombre_reporte: checador.nombre_reporte || checador.nombre,
        nombre: checador.nombre || checador.nombre_reporte,
        usuario_id: Number(usuarioId),
        activo: 1
      });
      await cargarTodo();
    } catch (err) {
      setError(err.message || 'No se pudo vincular el checador.');
    } finally {
      setLinking(false);
    }
  }

  async function vincularAutomatico() {
    try {
      setLinking(true);
      await checadoresApi.vincularUsuarios();
      await cargarTodo();
    } catch (err) {
      setError(err.message || 'No se pudo ejecutar la vinculación automática.');
    } finally {
      setLinking(false);
    }
  }

  async function exportarChecadores() {
    try {
      setDownloading(true);
      await exportacionesApi.checadores({ desde: filtros.desde, hasta: filtros.hasta, checador_id: filtros.checador_id, formato: 'xlsx' });
    } catch (err) {
      setError(err.message || 'No se pudo exportar checadores.');
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTodo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const resumen = dashboard?.resumen || {};
  const reportables = checadores.filter((item) => Number(item.reportable) === 1);
  const pendientes = checadores.filter((item) => Number(item.pendiente_vincular) === 1);

  return (
    <AdminShell role={role} title="Checadores" subtitle="Productividad del equipo de checadores desde reporte diario o acumulativo.">
      <div className="space-y-5">
        {error ? <Message type="error">{error}</Message> : null}

        <ImportadorExcel onImported={cargarTodo} />

        <PendientesVincular
          pendientes={pendientes}
          usuarios={usuarios}
          onVincular={vincularManual}
          onAutoVincular={vincularAutomatico}
          loading={linking}
          role={role}
        />

        <Filtros filtros={filtros} setFiltros={setFiltros} checadores={reportables} onRefresh={cargarTodo} />

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <PowerBiCard title="TP total" value={loading ? '...' : numberFormat(resumen.total_tp)} icon={Activity} tone="red" subtitle="Solo checadores vinculados" />
          <PowerBiCard title="Salidas" value={loading ? '...' : numberFormat(resumen.total_salidas)} icon={FileSpreadsheet} tone="blue" subtitle="Registros reportables" />
          <PowerBiCard title="TP/h laboral" value={loading ? '...' : numberFormat(resumen.tp_por_hora_laboral_equipo, 2)} icon={BarChart3} tone="soft" subtitle="Productividad del equipo" />
          <PowerBiCard title="Checadores activos" value={loading ? '...' : numberFormat(resumen.checadores_activos)} icon={Users} tone="dark" subtitle="Con registros en el rango" />
          <PowerBiCard title="Pendientes" value={loading ? '...' : numberFormat(pendientes.length)} icon={AlertTriangle} tone="soft" subtitle="Guardados, no reportables" />
        </div>

        <div className="grid min-w-0 gap-5 2xl:grid-cols-[1.35fr_0.85fr]">
          <ReportPanel title="Ranking de checadores" subtitle="Solo usuarios vinculados y activos.">
            {loading ? (
              <div className="flex items-center justify-center rounded-3xl bg-slate-50 p-8 text-sm font-black text-slate-500">
                <Loader2 className="mr-2 animate-spin" size={18} />
                Cargando ranking...
              </div>
            ) : <RankingTable rows={dashboard?.ranking || []} />}
          </ReportPanel>

          <ReportPanel title="Productividad por día" subtitle="Comportamiento diario del equipo vinculado.">
            {loading ? (
              <div className="flex items-center justify-center rounded-3xl bg-slate-50 p-8 text-sm font-black text-slate-500">
                <Loader2 className="mr-2 animate-spin" size={18} />
                Cargando días...
              </div>
            ) : <PorFechaTable rows={dashboard?.por_fecha || []} />}
          </ReportPanel>
        </div>

        <ReportPanel
          title="Detalle del reporte"
          subtitle="Solo registros de checadores vinculados. Los no vinculados permanecen guardados para futura vinculación."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportarChecadores}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {downloading ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                Exportar
              </button>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-xs font-black text-green-700 ring-1 ring-green-200">
                <CheckCircle2 size={15} />
                {numberFormat(reportes.length)} visibles
              </div>
            </div>
          }
        >
          <DetalleTable rows={reportes} />
        </ReportPanel>
      </div>
    </AdminShell>
  );
}
