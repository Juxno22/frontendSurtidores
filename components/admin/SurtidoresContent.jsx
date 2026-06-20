'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  UserPlus,
  Warehouse,
  XCircle
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { surtidoresApi } from '@/lib/productividadApi';
import { usuariosApi } from '@/lib/usuariosApi';

const EMPTY_FORM = {
  usuario_id: '',
  codigo: '',
  codigo_reporte: '',
  tipo_operacion: 'SUCURSAL',
  activo: 1
};

function number(value) {
  return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
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

function EstadoBadge({ activo }) {
  const isActive = Number(activo) === 1;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1',
        isActive
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-red-50 text-red-700 ring-red-200'
      ].join(' ')}
    >
      {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const isMayoreo = String(tipo || '').toUpperCase() === 'MAYOREO';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1',
        isMayoreo
          ? 'bg-blue-50 text-blue-700 ring-blue-200'
          : 'bg-red-50 text-red-700 ring-red-200'
      ].join(' ')}
    >
      {isMayoreo ? 'MAYOREO' : 'SUCURSAL'}
    </span>
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

function SurtidorForm({
  form,
  setForm,
  selected,
  usuariosDisponibles,
  onSubmit,
  onCancel,
  saving
}) {
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <ReportPanel
      title={selected ? 'Editar vínculo de surtidor' : 'Vincular usuario como surtidor'}
      subtitle="Los usuarios se crean únicamente en Usuarios. Aquí solo se asigna la función operativa de surtidor."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Usuario existente
          </span>

          {selected ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-black text-slate-950">{selected.nombre}</p>
              <p className="text-xs font-bold text-slate-500">
                {selected.usuario} · {selected.rol}
              </p>
            </div>
          ) : (
            <select
              name="usuario_id"
              value={form.usuario_id}
              onChange={handleChange}
              required
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Selecciona usuario...</option>
              {usuariosDisponibles.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} · {usuario.usuario} · {usuario.rol}
                </option>
              ))}
            </select>
          )}
        </label>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Tipo de operación
            </span>
            <select
              name="tipo_operacion"
              value={form.tipo_operacion}
              onChange={handleChange}
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="SUCURSAL">SUCURSAL</option>
              <option value="MAYOREO">MAYOREO</option>
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Estado
            </span>
            <select
              name="activo"
              value={form.activo}
              onChange={handleChange}
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </label>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Código interno
            </span>
            <input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              placeholder="Ej. S001"
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Código de reporte
            </span>
            <input
              name="codigo_reporte"
              value={form.codigo_reporte}
              onChange={handleChange}
              placeholder="Ej. AJMN, JMMC, IEG"
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </label>
        </div>

        <div className="rounded-3xl bg-blue-50 p-4 text-sm font-bold text-blue-700 ring-1 ring-blue-200">
          El código de reporte se usará para cruzar archivos externos. Si lo dejas vacío al crear, se usará el usuario de acceso.
        </div>

        {selected && selected.tipo_operacion !== form.tipo_operacion ? (
          <div className="rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            Si este surtidor ya tiene sesiones registradas, el backend bloqueará el cambio de tipo para no mezclar historial de sucursal con mayoreo.
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Vincular surtidor'}
          </button>

          {selected ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 sm:w-auto"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>
    </ReportPanel>
  );
}

function FiltrosSurtidores({ filtros, setFiltros, onRefresh, loading }) {
  function handleChange(e) {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <ReportPanel title="Filtros" subtitle="Busca por nombre, usuario, rol, código o tipo de operación.">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_180px_180px_auto]">
        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Búsqueda
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="search"
              value={filtros.search}
              onChange={handleChange}
              placeholder="Buscar surtidor..."
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </div>
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Tipo
          </span>
          <select
            name="tipo_operacion"
            value={filtros.tipo_operacion}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Todos</option>
            <option value="SUCURSAL">Sucursal</option>
            <option value="MAYOREO">Mayoreo</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Estado
          </span>
          <select
            name="activo"
            value={filtros.activo}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Todos</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex h-[46px] items-center justify-center gap-2 self-end rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCcw size={17} />}
          Actualizar
        </button>
      </div>
    </ReportPanel>
  );
}

function SurtidoresTable({ surtidores, loading, onEdit }) {
  return (
    <ReportPanel
      title="Surtidores"
      subtitle="Usuarios existentes vinculados a la función de surtido."
      right={loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : null}
    >
      {surtidores.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No hay surtidores con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Surtidor</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Código interno</th>
                <th className="px-3 py-2">Código reporte</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Último login</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {surtidores.map((surtidor) => (
                <tr key={surtidor.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4">
                    <p className="font-black text-slate-950">{surtidor.nombre}</p>
                    <p className="text-xs font-semibold text-slate-500">ID surtidor: {surtidor.id}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-bold text-slate-700">{surtidor.usuario}</p>
                    <p className="text-xs font-semibold text-slate-500">{surtidor.rol}</p>
                  </td>
                  <td className="px-3 py-4"><TipoBadge tipo={surtidor.tipo_operacion} /></td>
                  <td className="px-3 py-4 font-bold text-slate-700">{surtidor.codigo || '-'}</td>
                  <td className="px-3 py-4 font-bold text-slate-700">{surtidor.codigo_reporte || '-'}</td>
                  <td className="px-3 py-4"><EstadoBadge activo={surtidor.activo} /></td>
                  <td className="px-3 py-4 text-xs font-semibold text-slate-500">{formatDateTime(surtidor.ultimo_login)}</td>
                  <td className="rounded-r-2xl px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onEdit(surtidor)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800"
                    >
                      <Edit size={15} />
                      Editar
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

export default function SurtidoresContent({ role = 'ADMIN' }) {
  const [surtidores, setSurtidores] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [filtros, setFiltros] = useState({ search: '', activo: '', tipo_operacion: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const resumen = useMemo(() => surtidores.reduce((acc, item) => {
    acc.total += 1;
    if (Number(item.activo) === 1) acc.activos += 1;
    else acc.inactivos += 1;
    if (item.tipo_operacion === 'MAYOREO') acc.mayoreo += 1;
    else acc.sucursal += 1;
    return acc;
  }, { total: 0, activos: 0, inactivos: 0, sucursal: 0, mayoreo: 0 }), [surtidores]);

  function showMessage(type, text) {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4500);
  }

  async function cargarSurtidores() {
    try {
      setLoading(true);
      const data = await surtidoresApi.listar(filtros);
      setSurtidores(data.surtidores || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudieron cargar los surtidores.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarUsuariosDisponibles() {
    try {
      const data = await usuariosApi.listar({ activo: 1, disponibles_surtidor: 1 });
      setUsuariosDisponibles(data.usuarios || []);
    } catch {
      setUsuariosDisponibles([]);
    }
  }

  function handleEdit(surtidor) {
    setSelected(surtidor);
    setForm({
      usuario_id: surtidor.usuario_id || '',
      codigo: surtidor.codigo || '',
      codigo_reporte: surtidor.codigo_reporte || '',
      tipo_operacion: surtidor.tipo_operacion || 'SUCURSAL',
      activo: Number(surtidor.activo) === 1 ? 1 : 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setSelected(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selected && !form.usuario_id) {
      showMessage('warning', 'Selecciona un usuario existente.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        codigo: form.codigo.trim() || null,
        codigo_reporte: form.codigo_reporte.trim() || null,
        tipo_operacion: form.tipo_operacion,
        activo: Number(form.activo) === 1 ? 1 : 0
      };

      if (selected) {
        await surtidoresApi.actualizar(selected.id, payload);
        showMessage('success', 'Surtidor actualizado correctamente.');
      } else {
        await surtidoresApi.crear({
          ...payload,
          usuario_id: Number(form.usuario_id)
        });
        showMessage('success', 'Usuario vinculado como surtidor correctamente.');
      }

      setForm(EMPTY_FORM);
      setSelected(null);
      await Promise.all([cargarSurtidores(), cargarUsuariosDisponibles()]);
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar el surtidor.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuariosDisponibles();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarSurtidores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.activo, filtros.tipo_operacion]);

  const title = role === 'ADMIN' ? 'Catálogo de surtidores' : 'Surtidores';

  return (
    <AdminShell
      role={role}
      title={title}
      subtitle="Vinculación de usuarios existentes a la función operativa de surtido."
    >
      <div className="space-y-5">
        {message ? <Message type={message.type}>{message.text}</Message> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniKpi label="Total" value={number(resumen.total)} icon={Warehouse} />
          <MiniKpi label="Activos" value={number(resumen.activos)} icon={CheckCircle2} />
          <MiniKpi label="Sucursal" value={number(resumen.sucursal)} icon={Warehouse} />
          <MiniKpi label="Mayoreo" value={number(resumen.mayoreo)} icon={Warehouse} />
          <MiniKpi label="Disponibles" value={number(usuariosDisponibles.length)} icon={UserPlus} />
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-w-0">
            <SurtidorForm
              form={form}
              setForm={setForm}
              selected={selected}
              usuariosDisponibles={usuariosDisponibles}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              saving={saving}
            />
          </div>

          <div className="min-w-0 space-y-4">
            <FiltrosSurtidores
              filtros={filtros}
              setFiltros={setFiltros}
              onRefresh={cargarSurtidores}
              loading={loading}
            />

            <SurtidoresTable surtidores={surtidores} loading={loading} onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
