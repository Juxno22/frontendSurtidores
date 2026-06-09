'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Store,
  XCircle
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { sucursalesApi } from '@/lib/productividadApi';

const EMPTY_FORM = {
  nombre: '',
  clave: '',
  activo: 1
};

function number(value) {
  return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function generarClave(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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
      {isActive ? 'Activa' : 'Inactiva'}
    </span>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
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

function SucursalForm({
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

  function handleGenerateClave() {
    setForm((prev) => ({
      ...prev,
      clave: generarClave(prev.nombre)
    }));
  }

  return (
    <ReportPanel
      title={selected ? 'Editar sucursal' : 'Nueva sucursal'}
      subtitle="Estas sucursales se usan como destino de surtido y para el reporte grupal."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej. Matriz"
          required
        />

        <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            label="Clave"
            name="clave"
            value={form.clave}
            onChange={handleChange}
            placeholder="Ej. MATRIZ"
          />

          <button
            type="button"
            onClick={handleGenerateClave}
            className="flex h-[46px] items-center justify-center self-end rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
          >
            Generar
          </button>
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
            <option value={1}>Activa</option>
            <option value={0}>Inactiva</option>
          </select>
        </label>

        <div className="rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
          Inactivar una sucursal evita nuevas capturas en ella, pero no borra sesiones ni reportes históricos.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear sucursal'}
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

function FiltrosSucursales({
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
      subtitle="Busca por nombre o clave."
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
              placeholder="Buscar sucursal..."
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
            <option value="">Todas</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
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

function SucursalesTable({
  sucursales,
  loading,
  onEdit
}) {
  return (
    <ReportPanel
      title="Sucursales"
      subtitle="Catálogo utilizado en sesiones de surtido y reportes grupales."
      right={loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : null}
    >
      {sucursales.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No hay sucursales con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Sucursal</th>
                <th className="px-3 py-2">Clave</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Creada</th>
                <th className="px-3 py-2">Actualizada</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {sucursales.map((sucursal) => (
                <tr key={sucursal.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4">
                    <p className="font-black text-slate-950">
                      {sucursal.nombre}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      ID: {sucursal.id}
                    </p>
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-700">
                    {sucursal.clave || '-'}
                  </td>

                  <td className="px-3 py-4">
                    <EstadoBadge activo={sucursal.activo} />
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                    {formatDateTime(sucursal.created_at)}
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                    {formatDateTime(sucursal.updated_at)}
                  </td>

                  <td className="rounded-r-2xl px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onEdit(sucursal)}
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

export default function SucursalesContent() {
  const [sucursales, setSucursales] = useState([]);
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
    return sucursales.reduce((acc, item) => {
      acc.total += 1;

      if (Number(item.activo) === 1) acc.activas += 1;
      else acc.inactivas += 1;

      return acc;
    }, {
      total: 0,
      activas: 0,
      inactivas: 0
    });
  }, [sucursales]);

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function cargarSucursales() {
    try {
      setLoading(true);

      const data = await sucursalesApi.listar(filtros);
      setSucursales(data.sucursales || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudieron cargar las sucursales.');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(sucursal) {
    setSelected(sucursal);

    setForm({
      nombre: sucursal.nombre || '',
      clave: sucursal.clave || '',
      activo: Number(sucursal.activo) === 1 ? 1 : 0
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

    if (!form.nombre.trim()) {
      showMessage('warning', 'El nombre de la sucursal es obligatorio.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nombre: form.nombre.trim(),
        clave: form.clave.trim() || generarClave(form.nombre),
        activo: Number(form.activo) === 1 ? 1 : 0
      };

      if (selected) {
        await sucursalesApi.actualizar(selected.id, payload);
        showMessage('success', 'Sucursal actualizada correctamente.');
      } else {
        await sucursalesApi.crear(payload);
        showMessage('success', 'Sucursal creada correctamente.');
      }

      setForm(EMPTY_FORM);
      setSelected(null);

      await cargarSucursales();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar la sucursal.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarSucursales();
  }, [filtros.activo]);

  return (
    <AdminShell
      role="ADMIN"
      title="Catálogo de sucursales"
      subtitle="Administra las sucursales que se usan para sesiones de surtido y reportes grupales."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <MiniKpi label="Total" value={number(resumen.total)} icon={Store} />
          <MiniKpi label="Activas" value={number(resumen.activas)} icon={CheckCircle2} />
          <MiniKpi label="Inactivas" value={number(resumen.inactivas)} icon={XCircle} />
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-w-0">
            <SucursalForm
              form={form}
              setForm={setForm}
              selected={selected}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              saving={saving}
            />
          </div>

          <div className="min-w-0 space-y-4">
            <FiltrosSucursales
              filtros={filtros}
              setFiltros={setFiltros}
              onRefresh={cargarSucursales}
              loading={loading}
            />

            <SucursalesTable
              sucursales={sucursales}
              loading={loading}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}