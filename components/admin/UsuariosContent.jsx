'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit,
  KeyRound,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle
} from 'lucide-react';

import AdminShell from './AdminShell';
import ReportPanel from './ReportPanel';
import { usuariosApi } from '@/lib/usuariosApi';
import { sucursalesApi } from '@/lib/productividadApi';

const EMPTY_FORM = {
  nombre: '',
  usuario: '',
  password: '',
  rol: 'SUPERVISOR',
  sucursal_id: '',
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

function RolBadge({ rol }) {
  const isAdmin = rol === 'ADMIN';

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1',
        isAdmin
          ? 'bg-slate-950 text-white ring-slate-900'
          : 'bg-blue-50 text-blue-700 ring-blue-200'
      ].join(' ')}
    >
      <ShieldCheck size={13} />
      {rol}
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

function UsuarioForm({
  form,
  setForm,
  selected,
  sucursales,
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
      title={selected ? 'Editar usuario' : 'Nuevo usuario administrativo'}
      subtitle="Administra usuarios ADMIN y SUPERVISOR. Los surtidores se manejan en su catálogo."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej. Supervisor Almacén"
            required
          />

          <Input
            label="Usuario"
            name="usuario"
            value={form.usuario}
            onChange={handleChange}
            placeholder="Ej. supervisor"
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

          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Rol
            </span>

            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="SUPERVISOR">SUPERVISOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Sucursal opcional
            </span>

            <select
              name="sucursal_id"
              value={form.sucursal_id}
              onChange={handleChange}
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Sin sucursal asignada</option>

              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
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

        <div className="rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
          No podrás desactivar tu propio usuario ni quitarte el rol ADMIN. El backend también protege que no se quede el sistema sin administradores activos.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear usuario'}
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

function FiltrosUsuarios({
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
      subtitle="Busca por nombre, usuario, rol o sucursal asignada."
    >
      <div className="grid min-w-0 gap-3 md:grid-cols-[1fr_180px_180px_auto]">
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
              placeholder="Buscar usuario..."
              className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
            />
          </div>
        </label>

        <label className="min-w-0">
          <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Rol
          </span>

          <select
            name="rol"
            value={filtros.rol}
            onChange={handleChange}
            className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Todos</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
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

function PasswordModal({
  usuario,
  onClose,
  onSubmit,
  saving
}) {
  const [password, setPassword] = useState('');

  if (!usuario) return null;

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit(usuario, password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Cambiar contraseña
          </p>

          <h3 className="mt-1 text-xl font-black text-slate-950">
            {usuario.nombre}
          </h3>

          <p className="text-sm font-semibold text-slate-500">
            Usuario: {usuario.usuario}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nueva contraseña"
            name="password_modal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
              {saving ? 'Guardando...' : 'Cambiar contraseña'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsuariosTable({
  usuarios,
  loading,
  onEdit,
  onPassword
}) {
  return (
    <ReportPanel
      title="Usuarios administrativos"
      subtitle="Usuarios con acceso a panel administrador o supervisor."
      right={loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : null}
    >
      {usuarios.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No hay usuarios con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Acceso</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Sucursal</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Último login</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="bg-white shadow-sm ring-1 ring-slate-200">
                  <td className="rounded-l-2xl px-3 py-4">
                    <p className="font-black text-slate-950">
                      {usuario.nombre}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                      ID: {usuario.id}
                    </p>
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-700">
                    {usuario.usuario}
                  </td>

                  <td className="px-3 py-4">
                    <RolBadge rol={usuario.rol} />
                  </td>

                  <td className="px-3 py-4 font-bold text-slate-700">
                    {usuario.sucursal_nombre || 'Sin sucursal'}
                  </td>

                  <td className="px-3 py-4">
                    <EstadoBadge activo={usuario.activo} />
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                    {formatDateTime(usuario.ultimo_login)}
                  </td>

                  <td className="rounded-r-2xl px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(usuario)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800"
                      >
                        <Edit size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onPassword(usuario)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-200"
                      >
                        <KeyRound size={15} />
                        Password
                      </button>
                    </div>
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

export default function UsuariosContent() {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);

  const [filtros, setFiltros] = useState({
    search: '',
    rol: '',
    activo: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState(null);

  const resumen = useMemo(() => {
    return usuarios.reduce((acc, item) => {
      acc.total += 1;

      if (item.rol === 'ADMIN') acc.admins += 1;
      if (item.rol === 'SUPERVISOR') acc.supervisores += 1;

      if (Number(item.activo) === 1) acc.activos += 1;
      else acc.inactivos += 1;

      return acc;
    }, {
      total: 0,
      admins: 0,
      supervisores: 0,
      activos: 0,
      inactivos: 0
    });
  }, [usuarios]);

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function cargarUsuarios() {
    try {
      setLoading(true);

      const data = await usuariosApi.listar(filtros);
      setUsuarios(data.usuarios || []);
    } catch (error) {
      showMessage('error', error.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarCatalogos() {
    try {
      const data = await sucursalesApi.listarActivas();
      setSucursales(data.sucursales || []);
    } catch {
      setSucursales([]);
    }
  }

  function handleEdit(usuario) {
    setSelected(usuario);

    setForm({
      nombre: usuario.nombre || '',
      usuario: usuario.usuario || '',
      password: '',
      rol: usuario.rol || 'SUPERVISOR',
      sucursal_id: usuario.sucursal_id || '',
      activo: Number(usuario.activo) === 1 ? 1 : 0
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

    try {
      setSaving(true);

      const payload = {
        nombre: form.nombre.trim(),
        usuario: form.usuario.trim(),
        rol: form.rol,
        sucursal_id: form.sucursal_id ? Number(form.sucursal_id) : null,
        activo: Number(form.activo) === 1 ? 1 : 0
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (selected) {
        await usuariosApi.actualizar(selected.id, payload);

        if (form.password) {
          await usuariosApi.cambiarPassword(selected.id, {
            password: form.password
          });
        }

        showMessage('success', 'Usuario actualizado correctamente.');
      } else {
        await usuariosApi.crear(payload);
        showMessage('success', 'Usuario creado correctamente.');
      }

      setForm(EMPTY_FORM);
      setSelected(null);

      await cargarUsuarios();
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(usuario, password) {
    if (!password || password.length < 6) {
      showMessage('warning', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setSavingPassword(true);

      await usuariosApi.cambiarPassword(usuario.id, {
        password
      });

      setPasswordUser(null);
      showMessage('success', 'Contraseña actualizada correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogos();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios();
  }, [filtros.rol, filtros.activo]);

  return (
    <AdminShell
      role="ADMIN"
      title="Usuarios administrativos"
      subtitle="Administra accesos ADMIN y SUPERVISOR para el sistema."
    >
      <div className="space-y-5">
        {message ? (
          <Message type={message.type}>
            {message.text}
          </Message>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniKpi label="Total" value={number(resumen.total)} icon={Users} />
          <MiniKpi label="Admins" value={number(resumen.admins)} icon={ShieldCheck} />
          <MiniKpi label="Supervisores" value={number(resumen.supervisores)} icon={UserPlus} />
          <MiniKpi label="Activos" value={number(resumen.activos)} icon={CheckCircle2} />
          <MiniKpi label="Inactivos" value={number(resumen.inactivos)} icon={XCircle} />
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0">
            <UsuarioForm
              form={form}
              setForm={setForm}
              selected={selected}
              sucursales={sucursales}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              saving={saving}
            />
          </div>

          <div className="min-w-0 space-y-4">
            <FiltrosUsuarios
              filtros={filtros}
              setFiltros={setFiltros}
              onRefresh={cargarUsuarios}
              loading={loading}
            />

            <UsuariosTable
              usuarios={usuarios}
              loading={loading}
              onEdit={handleEdit}
              onPassword={setPasswordUser}
            />
          </div>
        </div>

        <PasswordModal
          usuario={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSubmit={handlePasswordSubmit}
          saving={savingPassword}
        />
      </div>
    </AdminShell>
  );
}