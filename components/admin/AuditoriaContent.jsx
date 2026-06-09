'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  Database,
  Eye,
  FileJson,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { auditoriaApi } from '@/lib/auditoriaApi';

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

function number(value) {
  return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function shortText(value, max = 70) {
  const text = String(value || '');

  if (text.length <= max) return text;

  return `${text.slice(0, max)}...`;
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

function MiniKpi({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>

        {Icon ? <Icon size={18} className="text-slate-400" /> : null}
      </div>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function JsonBlock({ title, data }) {
  return (
    <div className="min-w-0 rounded-3xl bg-slate-950 p-4 text-white">
      <div className="mb-3 flex items-center gap-2">
        <FileJson size={17} className="text-slate-400" />

        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {title}
        </p>
      </div>

      {data ? (
        <pre className="max-h-80 overflow-auto rounded-2xl bg-black/30 p-4 text-xs leading-relaxed text-slate-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="rounded-2xl bg-white/10 p-4 text-sm font-semibold text-slate-300">
          Sin información.
        </p>
      )}
    </div>
  );
}

function FiltrosAuditoria({
  filtros,
  setFiltros,
  onRefresh,
  loading
}) {
  function handleChange(e) {
    const { name, value } = e.target;

    setFiltros((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  return (
    <ReportPanel
      title="Filtros"
      subtitle="Consulta auditoría por fechas, módulo, acción o entidad."
    >
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Desde
          </span>

          <input
            name="desde"
            type="date"
            value={filtros.desde}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          />
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Hasta
          </span>

          <input
            name="hasta"
            type="date"
            value={filtros.hasta}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          />
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Módulo
          </span>

          <select
            name="modulo"
            value={filtros.modulo}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Todos</option>
            <option value="PRODUCTIVIDAD">PRODUCTIVIDAD</option>
            <option value="USUARIOS">USUARIOS</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Límite
          </span>

          <select
            name="limit"
            value={filtros.limit}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Acción
          </span>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

            <input
              name="accion"
              value={filtros.accion}
              onChange={handleChange}
              placeholder="Ej. AJUSTAR_SESION_FINALIZADA"
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </div>
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Entidad / ID
          </span>

          <div className="grid grid-cols-2 gap-2">
            <input
              name="entidad"
              value={filtros.entidad}
              onChange={handleChange}
              placeholder="usuarios"
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />

            <input
              name="entidad_id"
              value={filtros.entidad_id}
              onChange={handleChange}
              placeholder="ID"
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </div>
        </label>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex h-[46px] items-center justify-center gap-2 self-end rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCcw size={17} />}
          Consultar
        </button>
      </div>
    </ReportPanel>
  );
}

function AuditoriaTable({
  auditoria,
  loading,
  onSelect
}) {
  return (
    <ReportPanel
      title="Registros de auditoría"
      subtitle="Historial de acciones relevantes del sistema."
      right={loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : null}
    >
      {auditoria.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No hay registros de auditoría con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Módulo</th>
                <th className="px-3 py-2">Acción</th>
                <th className="px-3 py-2">Entidad</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {auditoria.map((item) => (
                <tr key={item.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4">
                    <p className="font-black text-slate-950">
                      #{item.id}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                      {formatDateTime(item.created_at)}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-black text-slate-950">
                      {item.usuario_nombre || 'Sistema'}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                      {item.usuario || '-'} · {item.rol || '-'}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      {item.modulo}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-black text-slate-950">
                      {shortText(item.accion, 45)}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-bold text-slate-700">
                      {item.entidad || '-'}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      ID: {item.entidad_id || '-'}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                    {item.ip || '-'}
                  </td>

                  <td className="rounded-r-2xl px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-3 py-2 text-xs font-black text-white shadow-sm hover:brightness-95"
                    >
                      <Eye size={15} />
                      Ver
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

function AuditoriaDetalle({
  item,
  loading,
  onClose
}) {
  return (
    <ReportPanel
      title="Detalle de auditoría"
      subtitle={item ? `${item.modulo} · ${item.accion}` : 'Selecciona un registro para ver el detalle.'}
      right={
        item ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-primary)]" size={34} />
        </div>
      ) : !item ? (
        <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div>
            <ShieldCheck className="mx-auto text-slate-400" size={34} />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              No hay registro seleccionado.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Usuario
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {item.usuario_nombre || 'Sistema'}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {item.usuario || '-'} · {item.rol || '-'}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Fecha
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {formatDateTime(item.created_at)}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                IP: {item.ip || '-'}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Entidad
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {item.entidad || '-'}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                ID: {item.entidad_id || '-'}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                User Agent
              </p>
              <p className="mt-2 break-all text-xs font-semibold text-slate-600">
                {item.user_agent || '-'}
              </p>
            </div>
          </div>

          <JsonBlock title="Datos antes" data={item.datos_antes} />
          <JsonBlock title="Datos después" data={item.datos_despues} />
        </div>
      )}
    </ReportPanel>
  );
}

export default function AuditoriaContent() {
  const [filtros, setFiltros] = useState({
    desde: addDays(todayLocal(), -7),
    hasta: todayLocal(),
    modulo: '',
    accion: '',
    entidad: '',
    entidad_id: '',
    limit: 200
  });

  const [auditoria, setAuditoria] = useState([]);
  const [detalle, setDetalle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [message, setMessage] = useState(null);

  const resumen = useMemo(() => {
    return auditoria.reduce((acc, item) => {
      acc.total += 1;

      if (item.modulo === 'PRODUCTIVIDAD') acc.productividad += 1;
      if (item.modulo === 'USUARIOS') acc.usuarios += 1;

      if (item.accion?.includes('EXCEL')) acc.excel += 1;
      if (item.accion?.includes('AJUST')) acc.ajustes += 1;

      return acc;
    }, {
      total: 0,
      productividad: 0,
      usuarios: 0,
      excel: 0,
      ajustes: 0
    });
  }, [auditoria]);

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function cargarAuditoria() {
    try {
      setLoading(true);

      const data = await auditoriaApi.listar(filtros);
      setAuditoria(data.auditoria || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudo cargar la auditoría.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDetalle(id) {
    try {
      setLoadingDetalle(true);

      const data = await auditoriaApi.detalle(id);
      setDetalle(data.auditoria);
    } catch (error) {
      showMessage('error', error.message || 'No se pudo cargar el detalle.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarAuditoria();
  }, [filtros.modulo, filtros.limit]);

  return (
    <AdminShell
      role="ADMIN"
      title="Auditoría"
      subtitle="Consulta acciones críticas, ajustes, importaciones y cambios administrativos."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniKpi label="Registros" value={number(resumen.total)} icon={Activity} />
          <MiniKpi label="Productividad" value={number(resumen.productividad)} icon={Database} />
          <MiniKpi label="Usuarios" value={number(resumen.usuarios)} icon={UserRound} />
          <MiniKpi label="Excel" value={number(resumen.excel)} icon={FileJson} />
          <MiniKpi label="Ajustes" value={number(resumen.ajustes)} icon={ShieldCheck} />
        </div>

        <FiltrosAuditoria
          filtros={filtros}
          setFiltros={setFiltros}
          onRefresh={cargarAuditoria}
          loading={loading}
        />

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0">
            <AuditoriaTable
              auditoria={auditoria}
              loading={loading}
              onSelect={cargarDetalle}
            />
          </div>

          <div className="min-w-0">
            <AuditoriaDetalle
              item={detalle}
              loading={loadingDetalle}
              onClose={() => setDetalle(null)}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}