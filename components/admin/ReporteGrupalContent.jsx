'use client';

import { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Save,
  Upload,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import StatusBadge from './StatusBadge';

import { reporteGrupalApi } from '@/lib/reporteGrupalApi';
import { sucursalesApi } from '@/lib/productividadApi';

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function number(value) {
  return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function decimal(value) {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

const EMPTY_FORM = {
  fecha: todayLocal(),
  sucursal_id: '',
  partidas: '',
  ceros: '',
  no_surtido: '',
  porcentaje_surtido: ''
};

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function calcularSurtidoTotal(form) {
  return toNumber(form.partidas) + toNumber(form.ceros) + toNumber(form.no_surtido);
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

function Field({ label, name, value, onChange, type = 'number', placeholder = '0' }) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={name === 'porcentaje_surtido' ? '0.01' : '1'}
        placeholder={placeholder}
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

function ReporteManualForm({
  form,
  setForm,
  sucursales,
  onSubmit,
  saving
}) {
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  return (
    <ReportPanel
      title="Carga manual"
      subtitle="Registra el acumulado grupal por fecha y sucursal."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Field
            label="Fecha"
            name="fecha"
            type="date"
            value={form.fecha}
            onChange={handleChange}
          />

          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Sucursal
            </span>

            <select
              name="sucursal_id"
              value={form.sucursal_id}
              onChange={handleChange}
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Selecciona sucursal</option>

              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-black uppercase tracking-widest text-white/50">
            Surtido total calculado
          </p>
          <p className="mt-1 text-4xl font-black">
            {number(calcularSurtidoTotal(form))}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/60">
            Partidas surtidas + ceros + negados
          </p>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Partidas surtidas" name="partidas" value={form.partidas} onChange={handleChange} />
          <Field label="Ceros" name="ceros" value={form.ceros} onChange={handleChange} />
          <Field label="Negados" name="no_surtido" value={form.no_surtido} onChange={handleChange} />
          <Field label="% de surtido" name="porcentaje_surtido" value={form.porcentaje_surtido} onChange={handleChange} placeholder="98.5" />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Guardar reporte'}
        </button>
      </form>
    </ReportPanel>
  );
}

function ExcelImportPanel({
  fecha,
  setFecha,
  onDryRun,
  onImport,
  importing,
  preview
}) {
  const [file, setFile] = useState(null);

  return (
    <ReportPanel
      title="Importar Excel"
      subtitle="Carga el reporte grupal con columnas FECHA, SUCURSAL, SURTIDO, PARTIDAS, CEROS, NEGADOS y % DE SURTIDO."
    >
      <div className="space-y-4">
        <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
            <p className="text-sm font-semibold text-slate-600">
              Si el Excel no trae columna de fecha, puedes indicar una fecha general aquí.
              Primero usa “Validar Excel” para revisar errores antes de importar.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-[0.8fr_1.2fr]">
          <Field
            label="Fecha opcional"
            name="fecha_excel"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Archivo Excel
            </span>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-700"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={!file || importing}
            onClick={() => onDryRun(file)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Validar Excel
          </button>

          <button
            type="button"
            disabled={!file || importing}
            onClick={() => onImport(file)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            Importar
          </button>
        </div>

        {preview ? (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <div className="mb-2 flex items-center gap-2 font-black">
              <CheckCircle2 size={18} />
              Validación correcta
            </div>

            <p className="font-semibold">
              Filas preparadas: {number(preview.total_preparadas || preview.total_importados || 0)}
            </p>

            {preview.preview?.length ? (
              <p className="mt-1 text-xs font-semibold">
                Vista previa disponible en respuesta de API.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </ReportPanel>
  );
}

function ReportesTable({ reportes, loading }) {
  return (
    <ReportPanel
      title="Reportes cargados"
      subtitle="Acumulado grupal por fecha y sucursal."
      right={loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : null}
    >
      {reportes.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No hay reportes cargados para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Sucursal</th>
                <th className="px-3 py-2 text-right">Surtido</th>
                <th className="px-3 py-2 text-right">Partidas surtidas</th>
                <th className="px-3 py-2 text-right">Ceros</th>
                <th className="px-3 py-2 text-right">Negados</th>
                <th className="px-3 py-2 text-right">% surtido</th>
                <th className="px-3 py-2">Fuente</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>

            <tbody>
              {reportes.map((reporte) => (
                <tr key={reporte.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">
                    {String(reporte.fecha).slice(0, 10)}
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-black text-slate-950">
                      {reporte.sucursal_nombre}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {number(reporte.surtido)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {number(reporte.partidas)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {number(reporte.ceros)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {number(reporte.no_surtido)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {reporte.porcentaje_surtido !== null && reporte.porcentaje_surtido !== undefined
                      ? `${decimal(reporte.porcentaje_surtido)}%`
                      : '-'}
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-600">
                    {reporte.fuente}
                  </td>

                  <td className="rounded-r-2xl px-3 py-4">
                    <StatusBadge status={
                      reporte.estado === 'COMPARADO'
                        ? 'CUADRADO'
                        : reporte.estado === 'CON_DIFERENCIAS'
                          ? 'CON_DIFERENCIAS'
                          : 'SIN_CAPTURA'
                    } />
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

export default function ReporteGrupalContent({ role = 'ADMIN' }) {
  const [sucursales, setSucursales] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [filtros, setFiltros] = useState({
    fecha: todayLocal(),
    sucursal_id: ''
  });

  const [fechaExcel, setFechaExcel] = useState('');
  const [reportes, setReportes] = useState([]);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);

  const title = role === 'ADMIN'
    ? 'Reporte grupal'
    : 'Reporte grupal operativo';

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function cargarSucursales() {
    const data = await sucursalesApi.listarActivas();
    setSucursales(data.sucursales || []);
  }

  async function cargarReportes() {
    try {
      setLoading(true);

      const data = await reporteGrupalApi.listar({
        fecha: filtros.fecha,
        sucursal_id: filtros.sucursal_id
      });

      setReportes(data.reportes || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitManual(e) {
    e.preventDefault();

    if (!form.fecha || !form.sucursal_id) {
      showMessage('warning', 'Fecha y sucursal son obligatorias.');
      return;
    }

    try {
      setSaving(true);

      await reporteGrupalApi.guardar({
        fecha: form.fecha,
        sucursal_id: Number(form.sucursal_id),
        surtido: calcularSurtidoTotal(form),
        partidas: toNumber(form.partidas),
        ceros: toNumber(form.ceros),
        no_surtido: toNumber(form.no_surtido),
        porcentaje_surtido: form.porcentaje_surtido === ''
          ? null
          : Number(form.porcentaje_surtido),
        fuente: 'MANUAL'
      });

      showMessage('success', 'Reporte guardado correctamente.');
      setForm((prev) => ({
        ...EMPTY_FORM,
        fecha: prev.fecha
      }));

      setFiltros((prev) => ({
        ...prev,
        fecha: form.fecha,
        sucursal_id: form.sucursal_id
      }));
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar el reporte.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDryRun(file) {
    try {
      setImporting(true);
      setPreview(null);

      const data = await reporteGrupalApi.importarExcel({
        file,
        fecha: fechaExcel,
        dryRun: true
      });

      setPreview(data);
      showMessage('success', 'Excel validado correctamente. Puedes importarlo.');
    } catch (error) {
      showMessage('error', error.message || 'El Excel tiene errores.');
    } finally {
      setImporting(false);
    }
  }

  async function handleImport(file) {
    const confirmar = window.confirm(
      '¿Confirmas importar este Excel? Si ya existen reportes para la fecha/sucursal, se actualizarán.'
    );

    if (!confirmar) return;

    try {
      setImporting(true);
      setPreview(null);

      const data = await reporteGrupalApi.importarExcel({
        file,
        fecha: fechaExcel,
        dryRun: false
      });

      showMessage('success', `Excel importado correctamente. Registros: ${number(data.total_importados)}.`);
      await cargarReportes();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo importar el Excel.');
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarSucursales().catch(() => {
      showMessage('error', 'No se pudieron cargar las sucursales.');
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarReportes();
  }, [filtros.fecha, filtros.sucursal_id]);

  return (
    <AdminShell
      role={role}
      title={title}
      subtitle="Carga manual o por Excel del acumulado grupal para comparar contra la captura individual."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <ReporteManualForm
            form={form}
            setForm={setForm}
            sucursales={sucursales}
            onSubmit={handleSubmitManual}
            saving={saving}
          />

          <ExcelImportPanel
            fecha={fechaExcel}
            setFecha={setFechaExcel}
            onDryRun={handleDryRun}
            onImport={handleImport}
            importing={importing}
            preview={preview}
          />
        </div>

        <ReportPanel
          title="Filtros de consulta"
          subtitle="Consulta reportes ya cargados."
        >
          <div className="grid min-w-0 gap-3 sm:grid-cols-[0.8fr_1fr_auto]">
            <Field
              label="Fecha"
              name="fecha_filtro"
              type="date"
              value={filtros.fecha}
              onChange={(e) => setFiltros((prev) => ({ ...prev, fecha: e.target.value }))}
            />

            <label className="min-w-0">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Sucursal
              </span>

              <select
                value={filtros.sucursal_id}
                onChange={(e) => setFiltros((prev) => ({ ...prev, sucursal_id: e.target.value }))}
                className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              >
                <option value="">Todas</option>

                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={cargarReportes}
              className="flex h-[46px] items-center justify-center gap-2 self-end rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
          </div>
        </ReportPanel>

        <ReportesTable reportes={reportes} loading={loading} />
      </div>
    </AdminShell>
  );
}