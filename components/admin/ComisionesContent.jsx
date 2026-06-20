'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  RefreshCcw,
  Save,
  ShieldAlert,
  XCircle
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { comisionesApi } from '@/lib/comisionesApi';
import { usuariosApi } from '@/lib/usuariosApi';
import { formatDurationHHMMSS } from '@/lib/timeFormat';

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstDayMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function money(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  });
}

function number(value) {
  return Number(value || 0).toLocaleString('es-MX');
}

function tipoLabel(tipo) {
  const labels = {
    SURTIDOR_SUCURSAL: 'Surtidor sucursal',
    CHECADOR_SUCURSAL: 'Checador sucursal',
    SURTIDOR_MAYOREO: 'Surtidor mayoreo',
    ENCARGADO: 'Encargado'
  };

  return labels[tipo] || tipo;
}

function tipoIncidenciaLabel(tipo) {
  const labels = {
    MAL_EMPAQUE: 'Mal empaque',
    FALTANTE_SOBRANTE: 'Faltante / sobrante',
    ASISTENCIA: 'Asistencia',
    ORDEN: 'Orden',
    PUNTUALIDAD: 'Puntualidad',
    OTRO: 'Otro'
  };

  return labels[tipo] || tipo;
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
          <p className={`mt-2 text-sm font-bold ${dark ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Message({ type = 'info', children }) {
  const classes = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-red-200 bg-red-50 text-red-700'
  };

  return (
    <div className={`rounded-3xl border px-5 py-4 text-sm font-bold ${classes[type] || classes.info}`}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function IncidenciaForm({ usuarios, filtros, onSaved }) {
  const [form, setForm] = useState({
    usuario_id: '',
    fecha: filtros.hasta || todayLocal(),
    tipo_operacion: 'CHECADOR_SUCURSAL',
    tipo_incidencia: 'MAL_EMPAQUE',
    descripcion: '',
    bloquea: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function setValue(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function guardar(e) {
    e.preventDefault();

    if (!form.usuario_id) {
      setMessage({ type: 'warning', text: 'Selecciona un usuario.' });
      return;
    }

    try {
      setLoading(true);
      await comisionesApi.crearIncidencia(form);
      setForm((prev) => ({ ...prev, descripcion: '' }));
      setMessage({ type: 'success', text: 'Incidencia guardada.' });
      onSaved?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'No se pudo guardar la incidencia.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReportPanel
      title="Incidencias operativas"
      subtitle="Mal empaque, faltante/sobrante, asistencia, orden o puntualidad afectan el bloque correspondiente."
    >
      <form onSubmit={guardar} className="space-y-4">
        {message ? <Message type={message.type}>{message.text}</Message> : null}

        <div className="grid gap-4 xl:grid-cols-5">
          <Field label="Usuario">
            <select
              value={form.usuario_id}
              onChange={(e) => setValue('usuario_id', e.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Selecciona</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} · {usuario.usuario}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha">
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setValue('fecha', e.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </Field>

          <Field label="Área">
            <select
              value={form.tipo_operacion}
              onChange={(e) => setValue('tipo_operacion', e.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="SURTIDOR_SUCURSAL">Surtidor sucursal</option>
              <option value="CHECADOR_SUCURSAL">Checador sucursal</option>
              <option value="SURTIDOR_MAYOREO">Surtidor mayoreo</option>
              <option value="ENCARGADO">Encargado</option>
            </select>
          </Field>

          <Field label="Incidencia">
            <select
              value={form.tipo_incidencia}
              onChange={(e) => setValue('tipo_incidencia', e.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="MAL_EMPAQUE">Mal empaque</option>
              <option value="FALTANTE_SOBRANTE">Faltante / sobrante</option>
              <option value="ASISTENCIA">Asistencia</option>
              <option value="ORDEN">Orden</option>
              <option value="PUNTUALIDAD">Puntualidad</option>
              <option value="OTRO">Otro</option>
            </select>
          </Field>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <ShieldAlert size={17} />}
              Guardar
            </button>
          </div>
        </div>

        <textarea
          value={form.descripcion}
          onChange={(e) => setValue('descripcion', e.target.value)}
          placeholder="Comentario del supervisor..."
          className="block min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
        />
      </form>
    </ReportPanel>
  );
}

export default function ComisionesContent({ role = 'ADMIN' }) {
  const [filtros, setFiltros] = useState({ desde: firstDayMonth(), hasta: todayLocal() });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  function setValue(key, value) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  async function cargarAuxiliares() {
    const [periodosRes, incidenciasRes, usuariosRes] = await Promise.all([
      comisionesApi.periodos({ limit: 10 }),
      comisionesApi.incidencias(filtros),
      usuariosApi.listar({ activo: 1 })
    ]);

    setPeriodos(periodosRes.periodos || []);
    setIncidencias(incidenciasRes.incidencias || []);
    setUsuarios(usuariosRes.usuarios || []);
  }

  async function calcular(dryRun = true) {
    try {
      setError('');
      if (dryRun) setLoading(true);
      if (!dryRun) setSaving(true);

      const res = await comisionesApi.calcular({
        ...filtros,
        dry_run: dryRun,
        motivo: dryRun ? '' : 'Cálculo de comisiones individuales desde panel'
      });

      setData(res);
      await cargarAuxiliares();
    } catch (err) {
      setError(err.message || 'No se pudo calcular comisiones.');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  }

  useEffect(() => {
    cargarAuxiliares().catch((err) => setError(err.message || 'No se pudo cargar información auxiliar.'));
  }, []);

  const resumen = data?.resumen || {};
  const comisiones = data?.comisiones || [];

  const grouped = useMemo(() => {
    return comisiones.reduce((acc, item) => {
      if (!acc[item.tipo_comision]) acc[item.tipo_comision] = [];
      acc[item.tipo_comision].push(item);
      return acc;
    }, {});
  }, [comisiones]);

  return (
    <AdminShell
      role={role}
      title="Comisiones individuales"
      subtitle="Calcula surtidores sucursal, checadores sucursal, surtidores mayoreo y encargados."
    >
      <div className="space-y-5">
        <ReportPanel
          title="Periodo de cálculo"
          subtitle="Primero ejecuta una prueba. Si se ve correcto, guarda el cálculo en BORRADOR."
          right={
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => calcular(true)}
                disabled={loading || saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Calculator size={17} />}
                Probar cálculo
              </button>

              {role === 'ADMIN' ? (
                <button
                  type="button"
                  onClick={() => calcular(false)}
                  disabled={loading || saving || !data}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                  Guardar BORRADOR
                </button>
              ) : null}
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Desde">
              <input
                type="date"
                value={filtros.desde}
                onChange={(e) => setValue('desde', e.target.value)}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                value={filtros.hasta}
                onChange={(e) => setValue('hasta', e.target.value)}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              />
            </Field>
          </div>
        </ReportPanel>

        {error ? <Message type="error">{error}</Message> : null}
        {data?.dry_run === false ? <Message type="success">Cálculo guardado como BORRADOR.</Message> : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <Kpi title="Registros" value={number(resumen.total_registros)} subtitle={`${number(resumen.comisionan)} comisionan`} icon={Calculator} dark />
          <Kpi title="Monto final" value={money(resumen.total_monto_final)} subtitle="Después de bloqueos" icon={CircleDollarSign} />
          <Kpi title="Bloqueados" value={number(resumen.bloqueados)} subtitle="Revisar negados/incidencias" icon={AlertTriangle} />
          <Kpi title="Incidencias" value={number(incidencias.filter((i) => i.activa).length)} subtitle="Activas en el periodo" icon={ShieldAlert} />
        </div>

        {role === 'ADMIN' || role === 'SUPERVISOR' ? (
          <IncidenciaForm usuarios={usuarios} filtros={filtros} onSaved={cargarAuxiliares} />
        ) : null}

        <ReportPanel title="Resultados por persona" subtitle="Los bloqueos dejan monto final en $0 hasta corregir pendientes.">
          <div className="space-y-6">
            {Object.entries(grouped).map(([tipo, items]) => (
              <div key={tipo} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{tipoLabel(tipo)}</h3>
                    <p className="text-sm font-bold text-slate-500">{items.length} registros</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1150px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                        <th className="px-3 py-3">Usuario</th>
                        <th className="px-3 py-3 text-right">Monto acumulado</th>
                        <th className="px-3 py-3 text-right">Monto final</th>
                        <th className="px-3 py-3">Estado</th>
                        <th className="px-3 py-3">Métricas clave</th>
                        <th className="px-3 py-3">Bloqueos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={`${item.tipo_comision}-${item.usuario_id}`} className="border-b border-slate-200 bg-white">
                          <td className="px-3 py-4">
                            <p className="font-black text-slate-950">{item.usuario_nombre}</p>
                            <p className="text-xs font-bold text-slate-500">{item.usuario}</p>
                          </td>
                          <td className="px-3 py-4 text-right font-black">{money(item.monto_acumulado)}</td>
                          <td className="px-3 py-4 text-right font-black">{money(item.monto_final)}</td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1 ${
                              item.comisiona
                                ? 'bg-green-50 text-green-700 ring-green-200'
                                : item.bloqueado
                                  ? 'bg-red-50 text-red-700 ring-red-200'
                                  : 'bg-amber-50 text-amber-700 ring-amber-200'
                            }`}>
                              {item.comisiona ? <CheckCircle2 size={14} /> : item.bloqueado ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                              {item.comisiona ? 'Comisiona' : item.bloqueado ? 'Bloqueado' : 'No comisiona'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-xs font-bold text-slate-600">
                            {tipo === 'SURTIDOR_MAYOREO' ? (
                              <>
                                <p>Partidas netas: {number(item.metricas?.partidas_netas)}</p>
                                <p>Activo: {formatDurationHHMMSS(item.metricas?.tiempo_activo_segundos)}</p>
                                <p>Partidas/h activa: {number(item.metricas?.partidas_netas_por_hora_activa)}</p>
                              </>
                            ) : tipo === 'CHECADOR_SUCURSAL' ? (
                              <>
                                <p>TP: {number(item.metricas?.tp)}</p>
                                <p>Meta: {number(item.metricas?.meta_individual)}</p>
                                <p>Cumplimiento: {number(item.metricas?.cumplimiento_meta_pct)}%</p>
                              </>
                            ) : tipo === 'ENCARGADO' ? (
                              <>
                                <p>Equipo: {number(item.metricas?.integrantes_equipo)}</p>
                                <p>Comisionan: {number(item.metricas?.integrantes_comisionan)}</p>
                                <p>Mayoría: {item.metricas?.mayoria ? 'Sí' : 'No'}</p>
                              </>
                            ) : (
                              <>
                                <p>Partidas: {number(item.metricas?.partidas_surtidas)}</p>
                                <p>Efectividad: {number(item.metricas?.efectividad_pct)}%</p>
                                <p>Negados penalizables: {number(item.metricas?.negados_penalizables)}</p>
                              </>
                            )}
                          </td>
                          <td className="px-3 py-4 text-xs font-bold text-red-700">
                            {item.bloqueos?.length ? item.bloqueos.map((b) => (
                              <p key={b.codigo}>{b.message}</p>
                            )) : <span className="text-slate-400">Sin bloqueos</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {!comisiones.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
                Ejecuta una prueba de cálculo para ver resultados.
              </div>
            ) : null}
          </div>
        </ReportPanel>

        <ReportPanel
          title="Incidencias activas / históricas"
          subtitle="Desactiva una incidencia cuando ya no deba afectar cálculos futuros."
          right={
            <button
              type="button"
              onClick={cargarAuxiliares}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200"
            >
              <RefreshCcw size={16} />
              Actualizar
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Usuario</th>
                  <th className="px-3 py-3">Área</th>
                  <th className="px-3 py-3">Incidencia</th>
                  <th className="px-3 py-3">Descripción</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {incidencias.map((inc) => (
                  <tr key={inc.id} className="border-b border-slate-100">
                    <td className="px-3 py-4 font-black">{inc.fecha}</td>
                    <td className="px-3 py-4">
                      <p className="font-black text-slate-950">{inc.usuario_nombre}</p>
                      <p className="text-xs font-bold text-slate-500">{inc.usuario}</p>
                    </td>
                    <td className="px-3 py-4 font-bold">{tipoLabel(inc.tipo_operacion)}</td>
                    <td className="px-3 py-4 font-bold">{tipoIncidenciaLabel(inc.tipo_incidencia)}</td>
                    <td className="px-3 py-4 text-slate-600">{inc.descripcion || '-'}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${inc.activa ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-slate-50 text-slate-500 ring-slate-200'}`}>
                        {inc.activa ? 'Activa' : 'Resuelta'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      {inc.activa ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await comisionesApi.resolverIncidencia(inc.id, { activa: false, comentario_resolucion: 'Resuelta desde panel' });
                            await cargarAuxiliares();
                          }}
                          className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
                        >
                          Resolver
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPanel>

        <ReportPanel title="Últimos periodos guardados" subtitle="Los cálculos guardados quedan como BORRADOR.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {periodos.map((periodo) => (
              <div key={periodo.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{periodo.codigo}</p>
                <p className="mt-2 text-lg font-black text-slate-950">{periodo.desde} → {periodo.hasta}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{periodo.estado}</p>
                <p className="mt-3 text-2xl font-black text-slate-950">{money(periodo.resumen?.total_monto_final)}</p>
              </div>
            ))}
          </div>
        </ReportPanel>
      </div>
    </AdminShell>
  );
}
