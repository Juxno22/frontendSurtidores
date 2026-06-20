'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Search,
  ShieldAlert,
  XCircle
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { negadosApi } from '@/lib/negadosApi';

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

function Message({ type = 'info', children }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700'
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${styles[type]}`}>
      {children}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const styles = {
    PENDIENTE_REVISION: 'bg-amber-50 text-amber-700 ring-amber-200',
    VALIDADO_NO_PENALIZA: 'bg-green-50 text-green-700 ring-green-200',
    RECHAZADO_PENALIZA: 'bg-red-50 text-red-700 ring-red-200',
    CANCELADO_DUPLICADO: 'bg-slate-100 text-slate-700 ring-slate-200'
  };

  const labels = {
    PENDIENTE_REVISION: 'Pendiente',
    VALIDADO_NO_PENALIZA: 'No penaliza',
    RECHAZADO_PENALIZA: 'Penaliza',
    CANCELADO_DUPLICADO: 'Duplicado'
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${styles[estado] || styles.PENDIENTE_REVISION}`}>
      {labels[estado] || estado}
    </span>
  );
}

function Kpi({ title, value, subtitle, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ring-1 ${
      dark ? 'bg-slate-950 text-white ring-slate-900' : 'bg-white text-slate-950 ring-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-widest ${dark ? 'text-white/60' : 'text-slate-400'}`}>
            {title}
          </p>
          <p className="mt-3 text-3xl font-black">{value}</p>
          <p className={`mt-2 text-sm font-bold ${dark ? 'text-white/70' : 'text-slate-500'}`}>
            {subtitle}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function buildGroupKey(item) {
  return [
    item.codigo_producto || 'SIN_CODIGO',
    item.linea || 'SIN_LINEA',
    item.producto || 'SIN_PRODUCTO'
  ].join('||');
}

function groupNegados(negados = []) {
  const map = new Map();

  negados.forEach((item) => {
    const key = buildGroupKey(item);

    if (!map.has(key)) {
      map.set(key, {
        key,
        codigo_producto: item.codigo_producto || 'SIN CÓDIGO',
        producto: item.producto || '-',
        linea: item.linea || '-',
        total_cantidad: 0,
        total_registros: 0,
        pendientes: 0,
        penalizan: 0,
        no_penalizan: 0,
        duplicados: 0,
        surtidores: new Set(),
        fechas: new Set(),
        items: []
      });
    }

    const group = map.get(key);

    group.total_cantidad += Number(item.cantidad_negada || 0);
    group.total_registros += 1;
    group.items.push(item);

    if (item.surtidor_nombre) group.surtidores.add(item.surtidor_nombre);
    if (item.fecha_operativa) group.fechas.add(item.fecha_operativa);

    if (item.estado_revision === 'PENDIENTE_REVISION') group.pendientes += 1;
    if (item.estado_revision === 'RECHAZADO_PENALIZA') group.penalizan += 1;
    if (item.estado_revision === 'VALIDADO_NO_PENALIZA') group.no_penalizan += 1;
    if (item.estado_revision === 'CANCELADO_DUPLICADO') group.duplicados += 1;
  });

  return [...map.values()].sort((a, b) => {
    return b.pendientes - a.pendientes || b.total_cantidad - a.total_cantidad || a.codigo_producto.localeCompare(b.codigo_producto);
  });
}

export default function NegadosRevisionContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({
    desde: todayLocal(),
    hasta: todayLocal(),
    estado_revision: 'PENDIENTE_REVISION',
    tipo_operacion: '',
    codigo_producto: ''
  });

  const [data, setData] = useState({
    resumen: [],
    negados: []
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  function setValue(key, value) {
    setFiltros((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4500);
  }

  async function cargar() {
    try {
      setLoading(true);
      setMessage(null);

      const response = await negadosApi.listar({
        ...filtros,
        limit: 2000
      });

      setData({
        resumen: response.resumen || [],
        negados: response.negados || []
      });
    } catch (error) {
      showMessage('error', error.message || 'No se pudieron cargar los negados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function revisar(item, estadoRevision) {
    let comentario = '';

    if (estadoRevision === 'RECHAZADO_PENALIZA') {
      comentario = window.prompt('Comentario del supervisor para penalizar:') || '';

      if (comentario.trim().length < 3) {
        showMessage('warning', 'El comentario es obligatorio para penalizar.');
        return;
      }
    } else if (estadoRevision === 'VALIDADO_NO_PENALIZA') {
      comentario = window.prompt('Comentario opcional para validar como no penalizable:') || '';
    } else if (estadoRevision === 'CANCELADO_DUPLICADO') {
      comentario = window.prompt('Motivo para cancelar como duplicado:') || '';
    }

    try {
      setLoading(true);

      await negadosApi.revisar(item.id, {
        estado_revision: estadoRevision,
        comentario_supervisor: comentario.trim()
      });

      showMessage('success', 'Negado revisado correctamente.');
      await cargar();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo revisar el negado.');
    } finally {
      setLoading(false);
    }
  }

  const resumenCalculado = useMemo(() => {
    const base = {
      PENDIENTE_REVISION: { registros: 0, cantidad: 0 },
      VALIDADO_NO_PENALIZA: { registros: 0, cantidad: 0 },
      RECHAZADO_PENALIZA: { registros: 0, cantidad: 0 },
      CANCELADO_DUPLICADO: { registros: 0, cantidad: 0 }
    };

    data.resumen.forEach((item) => {
      base[item.estado_revision] = {
        registros: Number(item.registros || 0),
        cantidad: Number(item.cantidad || 0)
      };
    });

    return base;
  }, [data.resumen]);

  const gruposNegados = useMemo(() => groupNegados(data.negados), [data.negados]);

  return (
    <AdminShell
      role={role}
      title="Negados"
      subtitle="Revisión diaria de negados declarados por surtidores o cargados desde reportes."
    >
      <div className="space-y-5">
        {message ? <Message type={message.type}>{message.text}</Message> : null}

        <ReportPanel
          title="Filtros"
          subtitle="Los pendientes bloquean el cierre de comisión hasta ser revisados. La vista agrupa por código, pero cada registro se responde individualmente."
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
          <div className="grid gap-4 md:grid-cols-5">
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Desde</span>
              <input
                type="date"
                value={filtros.desde}
                onChange={(e) => setValue('desde', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Hasta</span>
              <input
                type="date"
                value={filtros.hasta}
                onChange={(e) => setValue('hasta', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Estado</span>
              <select
                value={filtros.estado_revision}
                onChange={(e) => setValue('estado_revision', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE_REVISION">Pendiente</option>
                <option value="VALIDADO_NO_PENALIZA">No penaliza</option>
                <option value="RECHAZADO_PENALIZA">Penaliza</option>
                <option value="CANCELADO_DUPLICADO">Duplicado</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Tipo</span>
              <select
                value={filtros.tipo_operacion}
                onChange={(e) => setValue('tipo_operacion', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              >
                <option value="">Todos</option>
                <option value="SUCURSAL">Sucursal</option>
                <option value="MAYOREO">Mayoreo</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Código</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={filtros.codigo_producto}
                  onChange={(e) => setValue('codigo_producto', e.target.value)}
                  placeholder="Producto"
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-9 pr-4 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
                />
              </div>
            </label>
          </div>
        </ReportPanel>

        <div className="grid gap-4 xl:grid-cols-4">
          <Kpi
            title="Pendientes"
            value={formatNumber(resumenCalculado.PENDIENTE_REVISION.cantidad)}
            subtitle={`${formatNumber(resumenCalculado.PENDIENTE_REVISION.registros)} registros`}
            icon={AlertTriangle}
            dark
          />
          <Kpi
            title="No penalizan"
            value={formatNumber(resumenCalculado.VALIDADO_NO_PENALIZA.cantidad)}
            subtitle="Validados por supervisor"
            icon={CheckCircle2}
          />
          <Kpi
            title="Penalizan"
            value={formatNumber(resumenCalculado.RECHAZADO_PENALIZA.cantidad)}
            subtitle="Restan en comisión"
            icon={ShieldAlert}
          />
          <Kpi
            title="Duplicados"
            value={formatNumber(resumenCalculado.CANCELADO_DUPLICADO.cantidad)}
            subtitle="Cancelados"
            icon={XCircle}
          />
        </div>

        <ReportPanel
          title="Negados agrupados por código"
          subtitle="El agrupado facilita la búsqueda; la decisión se toma por registro individual."
        >
          <div className="space-y-4">
            {gruposNegados.map((grupo) => (
              <details key={grupo.key} className="overflow-hidden rounded-3xl border border-slate-200 bg-white open:ring-2 open:ring-slate-100">
                <summary className="cursor-pointer list-none p-5 transition hover:bg-slate-50">
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] xl:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Código producto</p>
                      <p className="mt-1 text-xl font-black text-slate-950">{grupo.codigo_producto}</p>
                      <p className="mt-1 text-sm font-bold text-slate-500">{grupo.producto}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Línea</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{grupo.linea}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{grupo.surtidores.size} surtidores involucrados</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cantidad</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(grupo.total_cantidad)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Registros</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(grupo.total_registros)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pendientes</p>
                      <p className={`mt-1 text-2xl font-black ${grupo.pendientes ? 'text-amber-600' : 'text-green-700'}`}>
                        {formatNumber(grupo.pendientes)}
                      </p>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-slate-200 bg-slate-50 p-4">
                  <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
                    <table className="min-w-[1300px] w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                          <th className="px-3 py-3">Fecha</th>
                          <th className="px-3 py-3">Surtidor</th>
                          <th className="px-3 py-3">Tipo</th>
                          <th className="px-3 py-3">Origen</th>
                          <th className="px-3 py-3">Razón</th>
                          <th className="px-3 py-3 text-right">Cantidad</th>
                          <th className="px-3 py-3">Estado</th>
                          <th className="px-3 py-3">Comentario surtidor</th>
                          <th className="px-3 py-3">Comentario supervisor</th>
                          <th className="px-3 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {grupo.items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 align-top">
                            <td className="px-3 py-4 font-black text-slate-950">{item.fecha_operativa}</td>
                            <td className="px-3 py-4">
                              <p className="font-black text-slate-950">{item.surtidor_nombre}</p>
                              <p className="text-xs font-bold text-slate-500">{item.surtidor_usuario}</p>
                            </td>
                            <td className="px-3 py-4 font-black">{item.tipo_operacion}</td>
                            <td className="px-3 py-4 font-black text-slate-700">{item.origen === 'REPORTE_MAYOREO' ? 'Reporte' : 'App'}</td>
                            <td className="px-3 py-4 font-bold text-slate-700">{item.razon_texto || '-'}</td>
                            <td className="px-3 py-4 text-right font-black">{formatNumber(item.cantidad_negada)}</td>
                            <td className="px-3 py-4"><EstadoBadge estado={item.estado_revision} /></td>
                            <td className="max-w-[220px] px-3 py-4 text-xs font-semibold text-slate-600">{item.comentario_surtidor || '-'}</td>
                            <td className="max-w-[220px] px-3 py-4 text-xs font-semibold text-slate-600">{item.comentario_supervisor || '-'}</td>
                            <td className="px-3 py-4 text-right">
                              {item.estado_revision === 'PENDIENTE_REVISION' ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => revisar(item, 'VALIDADO_NO_PENALIZA')}
                                    className="rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700 ring-1 ring-green-200"
                                  >
                                    No penaliza
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => revisar(item, 'RECHAZADO_PENALIZA')}
                                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200"
                                  >
                                    Penaliza
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => revisar(item, 'CANCELADO_DUPLICADO')}
                                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                                  >
                                    Duplicado
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">Revisado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))}

            {!loading && gruposNegados.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-bold text-slate-500">
                No hay negados con los filtros actuales.
              </div>
            ) : null}
          </div>
        </ReportPanel>
      </div>
    </AdminShell>
  );
}
