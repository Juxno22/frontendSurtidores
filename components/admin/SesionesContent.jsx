'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCcw,
  Save,
  SlidersHorizontal,
  TimerReset,
  UserRound,
  XCircle
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { sesionesApi, sucursalesApi, surtidoresApi } from '@/lib/productividadApi';

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

function money(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function decimal(value) {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';
  return String(value).slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function statusClass(estado) {
  const value = String(estado || '').toUpperCase();

  if (value === 'FINALIZADO') return 'bg-green-50 text-green-700 ring-green-200';
  if (value === 'EN_PROCESO') return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (value === 'CANCELADO') return 'bg-red-50 text-red-700 ring-red-200';

  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function EstadoSesionBadge({ estado }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(estado)}`}>
      {estado || 'SIN_ESTADO'}
    </span>
  );
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

function Input({ label, name, value, onChange, type = 'number', placeholder = '0' }) {
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
        step={name === 'monto' ? '0.01' : '1'}
        placeholder={placeholder}
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

function MiniKpi({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        {Icon ? <Icon size={17} className="text-slate-400" /> : null}
      </div>
      <p className="mt-2 text-xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function FiltrosSesiones({
  filtros,
  setFiltros,
  sucursales,
  surtidores,
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
      subtitle="Consulta sesiones por fecha, estado, sucursal surtida o surtidor."
    >
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Fecha
          </span>

          <input
            name="fecha"
            type="date"
            value={filtros.fecha}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          />
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Estado
          </span>

          <select
            name="estado"
            value={filtros.estado}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Todos</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Sucursal
          </span>

          <select
            name="sucursal_id"
            value={filtros.sucursal_id}
            onChange={handleChange}
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

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Surtidor
          </span>

          <select
            name="surtidor_id"
            value={filtros.surtidor_id}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Todos</option>

            {surtidores.map((surtidor) => (
              <option key={surtidor.id} value={surtidor.id}>
                {surtidor.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCcw size={17} />}
            Buscar
          </button>
        </div>
      </div>
    </ReportPanel>
  );
}

function SesionesTable({ sesiones, loading, onSelect }) {
  return (
    <ReportPanel
      title="Sesiones de productividad"
      subtitle="Detalle operativo de capturas realizadas por surtidores."
      right={loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : null}
    >
      {sesiones.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No hay sesiones con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Sesión</th>
                <th className="px-3 py-2">Surtidor</th>
                <th className="px-3 py-2">Sucursal</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2 text-right">Tickets</th>
                <th className="px-3 py-2 text-right">Partidas</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2 text-right">Horas</th>
                <th className="px-3 py-2 text-right">Partidas/h</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {sesiones.map((sesion) => (
                <tr key={sesion.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4">
                    <p className="font-black text-slate-950">#{sesion.id}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {formatDate(sesion.fecha_operativa)}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-black text-slate-950">{sesion.surtidor_nombre}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {sesion.surtidor_codigo || 'Sin código'}
                    </p>
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-700">
                    {sesion.sucursal_nombre}
                  </td>

                  <td className="px-3 py-4">
                    <EstadoSesionBadge estado={sesion.estado} />
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {number(sesion.tickets)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {number(sesion.partidas)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {money(sesion.monto)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {decimal(sesion.duracion_horas)}
                  </td>

                  <td className="px-3 py-4 text-right font-black">
                    {decimal(sesion.partidas_por_hora)}
                  </td>

                  <td className="rounded-r-2xl px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onSelect(sesion.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800"
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

function EventosTimeline({ eventos }) {
  return (
    <ReportPanel
      title="Eventos de sesión"
      subtitle="Historial de inicio, avances, finalización, cancelación y ajustes."
    >
      {eventos.length === 0 ? (
        <p className="text-sm font-semibold text-slate-500">
          No hay eventos registrados.
        </p>
      ) : (
        <div className="space-y-3">
          {eventos.map((evento) => (
            <div
              key={evento.id}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {evento.tipo_evento}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {evento.usuario_nombre} · {formatDateTime(evento.created_at)}
                  </p>
                </div>

                <Activity size={18} className="text-slate-400" />
              </div>

              {evento.motivo ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                  Motivo: {evento.motivo}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </ReportPanel>
  );
}

function DetalleSesion({ sesion, eventos, onClose, onAdjusted }) {
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ajuste, setAjuste] = useState({
    motivo: '',
    fecha_operativa: '',
    sucursal_id: '',
    tickets: '',
    partidas: '',
    monto: '',
    ceros: '',
    no_surtido: '',
    observaciones: ''
  });

  useEffect(() => {
    if (!sesion) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAjuste({
      motivo: '',
      fecha_operativa: formatDate(sesion.fecha_operativa),
      sucursal_id: sesion.sucursal_id || '',
      tickets: sesion.tickets ?? '',
      partidas: sesion.partidas ?? '',
      monto: sesion.monto ?? '',
      ceros: sesion.ceros ?? '',
      no_surtido: sesion.no_surtido ?? '',
      observaciones: sesion.observaciones || ''
    });
  }, [sesion]);

  if (!sesion) return null;

  function handleChange(e) {
    const { name, value } = e.target;

    setAjuste((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmitAjuste(e) {
    e.preventDefault();

    if (!ajuste.motivo || ajuste.motivo.trim().length < 5) {
      alert('El motivo es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    const confirmar = window.confirm('¿Confirmas aplicar este ajuste administrativo?');

    if (!confirmar) return;

    try {
      setSaving(true);

      await sesionesApi.ajusteAdmin(sesion.id, {
        motivo: ajuste.motivo.trim(),
        fecha_operativa: ajuste.fecha_operativa,
        sucursal_id: Number(ajuste.sucursal_id),
        tickets: Number(ajuste.tickets || 0),
        partidas: Number(ajuste.partidas || 0),
        monto: Number(ajuste.monto || 0),
        ceros: Number(ajuste.ceros || 0),
        no_surtido: Number(ajuste.no_surtido || 0),
        observaciones: ajuste.observaciones
      });

      setAjusteOpen(false);
      await onAdjusted(sesion.id);
    } catch (error) {
      alert(error.message || 'No se pudo aplicar el ajuste.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ReportPanel
        title={`Detalle sesión #${sesion.id}`}
        subtitle={`${sesion.surtidor_nombre} · ${sesion.sucursal_nombre}`}
        right={
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniKpi label="Estado" value={<EstadoSesionBadge estado={sesion.estado} />} icon={CheckCircle2} />
          <MiniKpi label="Fecha" value={formatDate(sesion.fecha_operativa)} icon={CalendarDays} />
          <MiniKpi label="Inicio" value={formatDateTime(sesion.hora_inicio)} icon={Clock} />
          <MiniKpi label="Fin" value={formatDateTime(sesion.hora_fin)} icon={TimerReset} />

          <MiniKpi label="Tickets" value={number(sesion.tickets)} />
          <MiniKpi label="Partidas" value={number(sesion.partidas)} />
          <MiniKpi label="Monto" value={money(sesion.monto)} />
          <MiniKpi label="Horas" value={decimal(sesion.duracion_horas)} />

          <MiniKpi label="Ceros" value={number(sesion.ceros)} />
          <MiniKpi label="No surtido / Negados" value={number(sesion.no_surtido)} />
          <MiniKpi label="Tickets/h" value={decimal(sesion.tickets_por_hora)} />
          <MiniKpi label="Partidas/h" value={decimal(sesion.partidas_por_hora)} />
        </div>

        {sesion.observaciones ? (
          <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            <span className="font-black text-slate-950">Observaciones:</span> {sesion.observaciones}
          </div>
        ) : null}

        {sesion.estado === 'FINALIZADO' ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAjusteOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-white shadow-sm hover:brightness-95"
            >
              <SlidersHorizontal size={17} />
              {ajusteOpen ? 'Ocultar ajuste' : 'Ajustar sesión'}
            </button>
          </div>
        ) : null}
      </ReportPanel>

      {ajusteOpen && sesion.estado === 'FINALIZADO' ? (
        <ReportPanel
          title="Ajuste administrativo"
          subtitle="Solo corrige datos operativos. No modifica hora de inicio ni hora final."
        >
          <form onSubmit={handleSubmitAjuste} className="space-y-4">
            <div className="rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <p>
                  Todo ajuste queda guardado en eventos de sesión y auditoría. Escribe un motivo claro.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Motivo obligatorio
              </span>

              <textarea
                name="motivo"
                value={ajuste.motivo}
                onChange={handleChange}
                rows={3}
                className="block w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
                placeholder="Ej. Corrección por captura incorrecta de partidas"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Input label="Fecha operativa" name="fecha_operativa" type="date" value={ajuste.fecha_operativa} onChange={handleChange} />
              <Input label="Tickets" name="tickets" value={ajuste.tickets} onChange={handleChange} />
              <Input label="Partidas" name="partidas" value={ajuste.partidas} onChange={handleChange} />
              <Input label="Monto" name="monto" value={ajuste.monto} onChange={handleChange} />
              <Input label="Ceros" name="ceros" value={ajuste.ceros} onChange={handleChange} />
              <Input label="No surtido / Negados" name="no_surtido" value={ajuste.no_surtido} onChange={handleChange} />
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Observaciones
              </span>

              <textarea
                name="observaciones"
                value={ajuste.observaciones}
                onChange={handleChange}
                rows={3}
                className="block w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Guardando ajuste...' : 'Guardar ajuste'}
            </button>
          </form>
        </ReportPanel>
      ) : null}

      <EventosTimeline eventos={eventos} />
    </div>
  );
}

export default function SesionesContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({
    fecha: todayLocal(),
    estado: '',
    sucursal_id: '',
    surtidor_id: '',
    limit: 200
  });

  const [sucursales, setSucursales] = useState([]);
  const [surtidores, setSurtidores] = useState([]);
  const [sesiones, setSesiones] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [eventos, setEventos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [message, setMessage] = useState(null);

  const title = role === 'ADMIN'
    ? 'Sesiones de productividad'
    : 'Sesiones operativas';

  const resumen = useMemo(() => {
    return sesiones.reduce((acc, sesion) => {
      acc.total += 1;
      acc.tickets += Number(sesion.tickets || 0);
      acc.partidas += Number(sesion.partidas || 0);
      acc.monto += Number(sesion.monto || 0);

      if (sesion.estado === 'EN_PROCESO') acc.enProceso += 1;
      if (sesion.estado === 'FINALIZADO') acc.finalizadas += 1;
      if (sesion.estado === 'CANCELADO') acc.canceladas += 1;

      return acc;
    }, {
      total: 0,
      enProceso: 0,
      finalizadas: 0,
      canceladas: 0,
      tickets: 0,
      partidas: 0,
      monto: 0
    });
  }, [sesiones]);

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function cargarCatalogos() {
    const [sucursalesRes, surtidoresRes] = await Promise.all([
      sucursalesApi.listarActivas(),
      surtidoresApi.listar({ activo: 1 })
    ]);

    setSucursales(sucursalesRes.sucursales || []);
    setSurtidores(surtidoresRes.surtidores || []);
  }

  async function cargarSesiones() {
    try {
      setLoading(true);

      const data = await sesionesApi.listar(filtros);
      setSesiones(data.sesiones || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudieron cargar las sesiones.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDetalle(id) {
    try {
      setLoadingDetalle(true);
      setSelectedId(id);

      const [detalleRes, eventosRes] = await Promise.all([
        sesionesApi.detalle(id),
        sesionesApi.eventos(id)
      ]);

      setDetalle(detalleRes.sesion);
      setEventos(eventosRes.eventos || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudo cargar el detalle.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  async function handleAdjusted(id) {
    await cargarDetalle(id);
    await cargarSesiones();
    showMessage('success', 'Sesión ajustada correctamente.');
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogos().catch(() => {
      showMessage('error', 'No se pudieron cargar los catálogos.');
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarSesiones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.fecha, filtros.estado, filtros.sucursal_id, filtros.surtidor_id]);

  return (
    <AdminShell
      role={role}
      title={title}
      subtitle="Consulta sesiones, revisa eventos y corrige datos finalizados con auditoría."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniKpi label="Sesiones" value={number(resumen.total)} icon={Activity} />
          <MiniKpi label="Finalizadas" value={number(resumen.finalizadas)} icon={CheckCircle2} />
          <MiniKpi label="En proceso" value={number(resumen.enProceso)} icon={Clock} />
          <MiniKpi label="Monto" value={money(resumen.monto)} icon={UserRound} />
        </div>

        <FiltrosSesiones
          filtros={filtros}
          setFiltros={setFiltros}
          sucursales={sucursales}
          surtidores={surtidores}
          onRefresh={cargarSesiones}
          loading={loading}
        />

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0">
            <SesionesTable
              sesiones={sesiones}
              loading={loading}
              onSelect={cargarDetalle}
            />
          </div>

          <div className="min-w-0">
            {loadingDetalle ? (
              <ReportPanel title="Detalle" subtitle="Cargando información de la sesión.">
                <div className="flex min-h-80 items-center justify-center">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" size={34} />
                </div>
              </ReportPanel>
            ) : detalle ? (
              <DetalleSesion
                sesion={detalle}
                eventos={eventos}
                onClose={() => {
                  setSelectedId(null);
                  setDetalle(null);
                  setEventos([]);
                }}
                onAdjusted={handleAdjusted}
              />
            ) : (
              <ReportPanel
                title="Detalle de sesión"
                subtitle="Selecciona una sesión de la tabla para ver información completa."
              >
                <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <div>
                    <Eye className="mx-auto text-slate-400" size={34} />
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      No hay sesión seleccionada.
                    </p>
                  </div>
                </div>
              </ReportPanel>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}