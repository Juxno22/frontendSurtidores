'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit,
  Eye,
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

const EMPTY_FORM = {
  nombre: '',
  usuario: '',
  password: '',
  codigo: '',
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

function Input({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false
}) {
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
        placeholder={placeholder}
        required={required}
        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
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
  onSubmit,
  onCancel,
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
      title={selected ? 'Editar surtidor' : 'Nuevo surtidor'}
      subtitle="Los surtidores pertenecen a almacén. La sucursal se captura solo cuando inician una sesión."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej. Juan Pérez"
            required
          />

          <Input
            label="Usuario"
            name="usuario"
            value={form.usuario}
            onChange={handleChange}
            placeholder="Ej. juanp"
            required
          />
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label={selected ? 'Nueva contraseña opcional' : 'Contraseña'}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={selected ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
            required={!selected}
          />

          <Input
            label="Código"
            name="codigo"
            value={form.codigo}
            onChange={handleChange}
            placeholder="Ej. S001"
          />
        </div>

        <label className="block min-w-0">
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear surtidor'}
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

function FiltrosSurtidores({
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
      subtitle="Busca por nombre, usuario o código."
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_180px_auto]">
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

function SurtidoresTable({
  surtidores,
  loading,
  onEdit
}) {
  return (
    <ReportPanel
      title="Surtidores"
      subtitle="Personal de almacén que captura sesiones de productividad."
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
          <table className="min-w-[850px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Surtidor</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Último login</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {surtidores.map((surtidor) => (
                <tr key={surtidor.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4">
                    <p className="font-black text-slate-950">
                      {surtidor.nombre}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      ID surtidor: {surtidor.id}
                    </p>
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-700">
                    {surtidor.usuario}
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-700">
                    {surtidor.codigo || '-'}
                  </td>

                  <td className="px-3 py-4">
                    <EstadoBadge activo={surtidor.activo} />
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                    {formatDateTime(surtidor.ultimo_login)}
                  </td>

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);

  const [filtros, setFiltros] = useState({
    search: '',
    activo: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState(null);

  const resumen = useMemo(() => {
    return surtidores.reduce((acc, item) => {
      acc.total += 1;

      if (Number(item.activo) === 1) acc.activos += 1;
      else acc.inactivos += 1;

      return acc;
    }, {
      total: 0,
      activos: 0,
      inactivos: 0
    });
  }, [surtidores]);

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
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

  function handleEdit(surtidor) {
    setSelected(surtidor);

    setForm({
      nombre: surtidor.nombre || '',
      usuario: surtidor.usuario || '',
      password: '',
      codigo: surtidor.codigo || '',
      activo: Number(surtidor.activo) === 1 ? 1 : 0
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function handleCancelEdit() {
    setSelected(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nombre.trim() || !form.usuario.trim()) {
      showMessage('warning', 'Nombre y usuario son obligatorios.');
      return;
    }

    if (!selected && (!form.password || form.password.length < 6)) {
      showMessage('warning', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (selected && form.password && form.password.length < 6) {
      showMessage('warning', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nombre: form.nombre.trim(),
        usuario: form.usuario.trim(),
        codigo: form.codigo.trim() || null,
        activo: Number(form.activo) === 1 ? 1 : 0
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (selected) {
        await surtidoresApi.actualizar(selected.id, payload);
        showMessage('success', 'Surtidor actualizado correctamente.');
      } else {
        await surtidoresApi.crear(payload);
        showMessage('success', 'Surtidor creado correctamente.');
      }

      setForm(EMPTY_FORM);
      setSelected(null);

      await cargarSurtidores();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar el surtidor.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarSurtidores();
  }, [filtros.activo]);

  const title = role === 'ADMIN'
    ? 'Catálogo de surtidores'
    : 'Surtidores';

  return (
    <AdminShell
      role={role}
      title={title}
      subtitle="Alta, edición y control de usuarios surtidores de almacén."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <MiniKpi label="Total" value={number(resumen.total)} icon={Warehouse} />
          <MiniKpi label="Activos" value={number(resumen.activos)} icon={CheckCircle2} />
          <MiniKpi label="Inactivos" value={number(resumen.inactivos)} icon={XCircle} />
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-w-0">
            <SurtidorForm
              form={form}
              setForm={setForm}
              selected={selected}
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

            <SurtidoresTable
              surtidores={surtidores}
              loading={loading}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}