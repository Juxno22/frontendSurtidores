'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Loader2,
  PackageCheck,
  Play,
  PlusCircle,
  RotateCcw,
  Save,
  Square,
  Store,
  Trash2,
  XCircle
} from 'lucide-react';

import UserAccountMenu from '@/components/UserAccountMenu';
import AuthGuard from '@/components/AuthGuard';
import { getUser } from '@/lib/auth';
import { sesionesApi, sucursalesApi } from '@/lib/productividadApi';
import { negadosApi } from '@/lib/negadosApi';
import {
  deleteSessionDraft,
  getDraftKeyBySessionId,
  getSessionDraft,
  saveSessionDraft
} from '@/lib/sessionDraftDb';

const EMPTY_FORM = {
  partidas_surtidas: '',
  ceros: '',
  negados: '',
  observaciones: ''
};

const EMPTY_NEGADO = {
  codigo_producto: '',
  razon_codigo: 'NO_ENCONTRADO_UBICACION',
  linea: '',
  cantidad_negada: '1',
  comentario_surtidor: ''
};

const DEFAULT_MOTIVOS_NEGADO = [
  { codigo: 'NO_ENCONTRADO_UBICACION', nombre: 'No encontrado en ubicación' },
  { codigo: 'MAL_UBICADO', nombre: 'Mal ubicado' },
  { codigo: 'INVENTARIO_INCORRECTO', nombre: 'Inventario incorrecto' },
  { codigo: 'PRODUCTO_DANADO', nombre: 'Producto dañado' },
  { codigo: 'CODIGO_DESCONTINUADO', nombre: 'Código descontinuado / no manejado' },
  { codigo: 'DIFERENCIA_SISTEMA', nombre: 'Diferencia de sistema' },
  { codigo: 'OTRO', nombre: 'Otro' }
];

function numberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function secondsToClock(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);

  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].join(':');
}

function normalizeNegadosDetalle(items = []) {
  return items
    .map((item) => ({
      codigo_producto: String(item.codigo_producto || '').trim().toUpperCase().replace(/\s+/g, ''),
      razon_codigo: String(item.razon_codigo || item.razon || '').trim().toUpperCase(),
      linea: String(item.linea || '').trim(),
      cantidad_negada: numberOrZero(item.cantidad_negada ?? item.cantidad),
      comentario_surtidor: String(item.comentario_surtidor || item.comentario || '').trim()
    }))
    .filter((item) => (
      item.codigo_producto ||
      item.razon_codigo ||
      item.linea ||
      item.cantidad_negada ||
      item.comentario_surtidor
    ));
}

function getNegadosCantidadTotal(items = []) {
  return normalizeNegadosDetalle(items).reduce((acc, item) => acc + numberOrZero(item.cantidad_negada), 0);
}

function getSurtidoTotal(form, negadosDetalle = []) {
  return (
    numberOrZero(form.partidas_surtidas) +
    numberOrZero(form.ceros) +
    getNegadosCantidadTotal(negadosDetalle)
  );
}

function getFormFromSesionOrDraft(source = {}) {
  return {
    partidas_surtidas: source.partidas_surtidas ?? source.partidas ?? '',
    ceros: source.ceros ?? '',
    negados: source.negados ?? source.no_surtido ?? '',
    observaciones: source.observaciones ?? ''
  };
}

function getNegadosFromSesionOrDraft(source = {}) {
  const raw = Array.isArray(source.negados_detalle)
    ? source.negados_detalle
    : Array.isArray(source.negados_declarados)
      ? source.negados_declarados
      : [];

  return raw.map((item) => ({
    codigo_producto: item.codigo_producto || '',
    razon_codigo: item.razon_codigo || item.razon || 'NO_ENCONTRADO_UBICACION',
    linea: item.linea || '',
    cantidad_negada: item.cantidad_negada ?? item.cantidad ?? '1',
    comentario_surtidor: item.comentario_surtidor || item.comentario || ''
  }));
}

function buildPayload(form, negadosDetalle = []) {
  const partidasSurtidas = numberOrZero(form.partidas_surtidas);
  const ceros = numberOrZero(form.ceros);
  const detalleNormalizado = normalizeNegadosDetalle(negadosDetalle);
  const negados = detalleNormalizado.reduce((acc, item) => acc + numberOrZero(item.cantidad_negada), 0);
  const surtidoTotal = partidasSurtidas + ceros + negados;

  return {
    surtido_total: surtidoTotal,
    tickets: surtidoTotal,

    partidas_surtidas: partidasSurtidas,
    partidas: partidasSurtidas,

    ceros,

    negados,
    no_surtido: negados,
    negados_detalle: detalleNormalizado,

    monto: 0,
    observaciones: String(form.observaciones || '').trim()
  };
}

function validateNegadosDetalle(negadosDetalle = []) {
  const detalle = normalizeNegadosDetalle(negadosDetalle);

  for (let index = 0; index < detalle.length; index += 1) {
    const item = detalle[index];

    if (!item.codigo_producto) {
      return `Captura el código del producto en el negado ${index + 1}.`;
    }

    if (!item.razon_codigo) {
      return `Selecciona la razón del negado ${index + 1}.`;
    }

    if (!item.linea) {
      return `Captura la línea del negado ${index + 1}.`;
    }

    if (numberOrZero(item.cantidad_negada) <= 0) {
      return `La cantidad del negado ${index + 1} debe ser mayor a 0.`;
    }
  }

  return '';
}

function Header({ user }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow">
            <PackageCheck size={23} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Surtidor
            </p>
            <h1 className="text-base font-black leading-tight text-slate-950">
              {user?.nombre || 'Productividad'}
            </h1>
          </div>
        </div>

        <UserAccountMenu compact />
      </div>
    </header>
  );
}

function StatusMessage({ type = 'info', children }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700'
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {children}
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'number', placeholder = '0', readOnly = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        min={type === 'number' ? '0' : undefined}
        step="1"
        inputMode={type === 'number' ? 'numeric' : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100 read-only:bg-slate-100 read-only:text-slate-500"
      />
    </label>
  );
}

function NegadosDeclaradosPanel({
  negadosDetalle,
  motivos,
  onAdd,
  onRemove,
  onChange
}) {
  return (
    <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-amber-950">
            Negados declarados
          </h4>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            Captura código, razón, línea y cantidad. El supervisor los revisará diario.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-amber-600 px-3 py-2 text-xs font-black text-white shadow-sm active:scale-[0.99]"
        >
          <PlusCircle size={16} />
          Agregar
        </button>
      </div>

      {negadosDetalle.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-white/70 px-4 py-4 text-sm font-bold text-amber-700">
          Sin negados declarados. Si no agregas registros, el total de negados será 0.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {negadosDetalle.map((item, index) => (
            <div key={`${index}-${item.codigo_producto}`} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-amber-200">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-amber-600">
                  Negado {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
                    Código producto
                  </span>
                  <input
                    value={item.codigo_producto}
                    onChange={(e) => onChange(index, 'codigo_producto', e.target.value)}
                    placeholder="Ej. MK6335"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
                    Razón
                  </span>
                  <select
                    value={item.razon_codigo}
                    onChange={(e) => onChange(index, 'razon_codigo', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  >
                    {motivos.map((motivo) => (
                      <option key={motivo.codigo} value={motivo.codigo}>
                        {motivo.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
                    Línea
                  </span>
                  <input
                    value={item.linea}
                    onChange={(e) => onChange(index, 'linea', e.target.value)}
                    placeholder="Ej. GRÖB / línea producto"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
                    Cantidad negada
                  </span>
                  <input
                    value={item.cantidad_negada}
                    onChange={(e) => onChange(index, 'cantidad_negada', e.target.value)}
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
                  Comentario opcional
                </span>
                <input
                  value={item.comentario_surtidor}
                  onChange={(e) => onChange(index, 'comentario_surtidor', e.target.value)}
                  placeholder="Detalle opcional para supervisor"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StartSessionView({
  sucursales,
  sucursalId,
  setSucursalId,
  surtidorPerfil,
  onStart,
  loading
}) {
  const tipoOperacion = surtidorPerfil?.tipo_operacion || 'SUCURSAL';
  const esMayoreo = tipoOperacion === 'MAYOREO';

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Store size={24} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">
            {esMayoreo ? 'Iniciar surtido mayoreo' : 'Iniciar surtido sucursal'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {esMayoreo
              ? 'Mayoreo usa jornada 17:00 a 02:00, con comida de 22:00 a 23:00. El tiempo oficial lo toma el servidor.'
              : 'Selecciona la sucursal que vas a surtir. El tiempo oficial lo toma el servidor con horario de Ciudad de México.'}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Perfil operativo
        </p>
        <p className="mt-1 text-lg font-black text-slate-950">
          {esMayoreo ? 'Mayoreo' : 'Sucursales'}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Código reporte: {surtidorPerfil?.codigo_reporte || surtidorPerfil?.codigo || '-'}
        </p>
      </div>

      {!esMayoreo ? (
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Sucursal surtida
          </span>

          <select
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          >
            <option value="">Selecciona una sucursal</option>

            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <StatusMessage type="info">
          No se selecciona sucursal destino para mayoreo. La producción oficial se cruzará después con el reporte de mayoreo.
        </StatusMessage>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={loading || (!esMayoreo && !sucursalId)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
        {loading ? 'Iniciando...' : 'Iniciar surtido'}
      </button>
    </section>
  );
}

function ActiveSessionView({
  sesion,
  form,
  negadosDetalle,
  motivosNegado,
  onChange,
  onNegadoChange,
  onAddNegado,
  onRemoveNegado,
  onSave,
  onFinish,
  onCancel,
  saving,
  finishing,
  elapsedSeconds,
  lastLocalSave
}) {
  const negadosTotal = getNegadosCantidadTotal(negadosDetalle);
  const surtidoTotal = getSurtidoTotal(form, negadosDetalle);

  const metricas = useMemo(() => {
    const horas = elapsedSeconds / 3600;
    const partidasSurtidas = numberOrZero(form.partidas_surtidas);

    return {
      surtidoHora: horas > 0 ? (surtidoTotal / horas).toFixed(2) : '0.00',
      partidasHora: horas > 0 ? (partidasSurtidas / horas).toFixed(2) : '0.00',
      negadosHora: horas > 0 ? (negadosTotal / horas).toFixed(2) : '0.00'
    };
  }, [elapsedSeconds, form.partidas_surtidas, surtidoTotal, negadosTotal]);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Sesión en proceso
            </p>
            <h2 className="mt-1 text-xl font-black">
              {sesion.tipo_operacion === 'MAYOREO' ? 'Mayoreo' : sesion.sucursal_nombre}
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Clock size={24} />
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-white/10 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
            Tiempo transcurrido
          </p>
          <p className="mt-1 font-mono text-4xl font-black">
            {secondsToClock(elapsedSeconds)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-slate-400">Surtido/h</p>
            <p className="mt-1 text-base font-black">{metricas.surtidoHora}</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-slate-400">Partidas/h</p>
            <p className="mt-1 text-base font-black">{metricas.partidasHora}</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-slate-400">Negados/h</p>
            <p className="mt-1 text-base font-black">{metricas.negadosHora}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">
              Captura del proceso
            </h3>
            <p className="text-xs text-slate-500">
              Surtido total se calcula automático: partidas surtidas + ceros + negados declarados.
            </p>
          </div>

          {lastLocalSave ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
              Borrador guardado
            </span>
          ) : null}
        </div>

        <div className="mb-4 rounded-3xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-black uppercase tracking-widest text-white/50">
            Surtido total
          </p>
          <p className="mt-1 text-4xl font-black">
            {formatNumber(surtidoTotal)}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/60">
            {formatNumber(numberOrZero(form.partidas_surtidas))} partidas + {formatNumber(numberOrZero(form.ceros))} ceros + {formatNumber(negadosTotal)} negados
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Partidas surtidas"
            name="partidas_surtidas"
            value={form.partidas_surtidas}
            onChange={onChange}
          />
          <Field
            label="Ceros"
            name="ceros"
            value={form.ceros}
            onChange={onChange}
          />
          <Field
            label="Negados"
            name="negados"
            value={String(negadosTotal)}
            onChange={onChange}
            readOnly
          />
        </div>

        <NegadosDeclaradosPanel
          negadosDetalle={negadosDetalle}
          motivos={motivosNegado}
          onAdd={onAddNegado}
          onRemove={onRemoveNegado}
          onChange={onNegadoChange}
        />

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Observaciones
          </span>

          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={onChange}
            rows={3}
            placeholder="Opcional"
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
          />
        </label>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || finishing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base font-black text-slate-800 shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Guardando...' : 'Guardar avance'}
          </button>

          <button
            type="button"
            onClick={onFinish}
            disabled={saving || finishing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
          >
            {finishing ? <Loader2 className="animate-spin" size={20} /> : <Square size={20} />}
            {finishing ? 'Finalizando...' : 'Finalizar surtido'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving || finishing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-4 text-base font-black text-slate-700 transition active:scale-[0.99] disabled:opacity-60"
          >
            <XCircle size={20} />
            Cancelar proceso
          </button>
        </div>
      </div>
    </section>
  );
}

function SurtidorContent() {
  const [user, setUser] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [surtidorPerfil, setSurtidorPerfil] = useState(null);
  const [sucursalId, setSucursalId] = useState('');
  const [sesion, setSesion] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [negadosDetalle, setNegadosDetalle] = useState([]);
  const [motivosNegado, setMotivosNegado] = useState(DEFAULT_MOTIVOS_NEGADO);

  const [elapsedBase, setElapsedBase] = useState(0);
  const [elapsedExtra, setElapsedExtra] = useState(0);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [message, setMessage] = useState(null);
  const [lastLocalSave, setLastLocalSave] = useState(null);

  const elapsedSeconds = elapsedBase + elapsedExtra;

  function showMessage(type, text) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function cargarDatosIniciales() {
    try {
      setLoadingPage(true);

      const currentUser = getUser();
      setUser(currentUser);

      const [sucursalesRes, activaRes, motivosRes] = await Promise.all([
        sucursalesApi.listarActivas(),
        sesionesApi.obtenerActiva(),
        negadosApi.motivos().catch(() => ({ motivos: DEFAULT_MOTIVOS_NEGADO }))
      ]);

      setSucursales(sucursalesRes.sucursales || []);
      setSurtidorPerfil(activaRes.surtidor || null);
      setMotivosNegado(motivosRes.motivos?.length ? motivosRes.motivos : DEFAULT_MOTIVOS_NEGADO);

      if (activaRes.sesion) {
        const active = activaRes.sesion;
        setSesion(active);

        setElapsedBase(Number(active.segundos_transcurridos || 0));
        setElapsedExtra(0);

        const draftKey = getDraftKeyBySessionId(active.id);
        const draft = await getSessionDraft(draftKey);

        if (draft) {
          setForm(getFormFromSesionOrDraft(draft));
          setNegadosDetalle(getNegadosFromSesionOrDraft(draft));
          showMessage('success', 'Se recuperó tu borrador local.');
        } else {
          setForm(getFormFromSesionOrDraft(active));
          setNegadosDetalle(getNegadosFromSesionOrDraft(active));
        }
      } else {
        setSesion(null);
        setForm(EMPTY_FORM);
        setNegadosDetalle([]);
        setElapsedBase(0);
        setElapsedExtra(0);
      }
    } catch (error) {
      showMessage('error', error.message || 'No se pudo cargar la información.');
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (!sesion) return undefined;

    const interval = window.setInterval(() => {
      setElapsedExtra((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [sesion]);

  useEffect(() => {
    if (!sesion) return undefined;

    const timeout = window.setTimeout(async () => {
      try {
        const draftKey = getDraftKeyBySessionId(sesion.id);
        await saveSessionDraft(draftKey, {
          ...form,
          negados: getNegadosCantidadTotal(negadosDetalle),
          negados_detalle: negadosDetalle
        });
        setLastLocalSave(new Date().toISOString());
      } catch {
        // No bloqueamos captura si IndexedDB falla.
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [form, negadosDetalle, sesion]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === 'negados') return;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleAddNegado() {
    setNegadosDetalle((prev) => [
      ...prev,
      { ...EMPTY_NEGADO }
    ]);
  }

  function handleRemoveNegado(index) {
    setNegadosDetalle((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleNegadoChange(index, key, value) {
    setNegadosDetalle((prev) => prev.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, [key]: value }
        : item
    )));
  }

  async function handleStart() {
    const esMayoreo = surtidorPerfil?.tipo_operacion === 'MAYOREO';

    if (!esMayoreo && !sucursalId) {
      showMessage('warning', 'Selecciona una sucursal.');
      return;
    }

    try {
      setLoadingAction(true);

      const data = await sesionesApi.iniciar(
        esMayoreo
          ? {}
          : { sucursal_id: Number(sucursalId) }
      );

      setSesion(data.sesion);
      setForm(EMPTY_FORM);
      setNegadosDetalle([]);
      setElapsedBase(0);
      setElapsedExtra(0);
      setLastLocalSave(null);

      showMessage('success', 'Sesión iniciada correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo iniciar la sesión.');
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleSave() {
    if (!sesion) return;

    try {
      setSaving(true);

      const payload = buildPayload(form, negadosDetalle);
      const data = await sesionesApi.guardarAvance(sesion.id, payload);

      setSesion((prev) => ({
        ...prev,
        ...data.sesion
      }));

      const draftKey = getDraftKeyBySessionId(sesion.id);
      await saveSessionDraft(draftKey, {
        ...form,
        negados: getNegadosCantidadTotal(negadosDetalle),
        negados_detalle: negadosDetalle
      });

      showMessage('success', 'Avance guardado correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar el avance.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    if (!sesion) return;

    const validationError = validateNegadosDetalle(negadosDetalle);

    if (validationError) {
      showMessage('warning', validationError);
      return;
    }

    const payload = buildPayload(form, negadosDetalle);

    if (payload.surtido_total === 0) {
      const confirmEmpty = window.confirm(
        'La sesión está en ceros. ¿Seguro que quieres finalizarla así?'
      );

      if (!confirmEmpty) return;
    }

    const confirmFinish = window.confirm('¿Confirmas finalizar este surtido?');

    if (!confirmFinish) return;

    try {
      setFinishing(true);

      await sesionesApi.finalizar(sesion.id, payload);

      const draftKey = getDraftKeyBySessionId(sesion.id);
      await deleteSessionDraft(draftKey);

      setSesion(null);
      setForm(EMPTY_FORM);
      setNegadosDetalle([]);
      setSucursalId('');
      setElapsedBase(0);
      setElapsedExtra(0);
      setLastLocalSave(null);

      showMessage('success', 'Surtido finalizado correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo finalizar.');
    } finally {
      setFinishing(false);
    }
  }

  async function handleCancel() {
    if (!sesion) return;

    const motivo = window.prompt('Escribe el motivo de cancelación:');

    if (!motivo || motivo.trim().length < 3) {
      showMessage('warning', 'El motivo de cancelación es obligatorio.');
      return;
    }

    const confirmCancel = window.confirm('¿Seguro que quieres cancelar este proceso?');

    if (!confirmCancel) return;

    try {
      setFinishing(true);

      await sesionesApi.cancelar(sesion.id, {
        motivo: motivo.trim()
      });

      const draftKey = getDraftKeyBySessionId(sesion.id);
      await deleteSessionDraft(draftKey);

      setSesion(null);
      setForm(EMPTY_FORM);
      setNegadosDetalle([]);
      setSucursalId('');
      setElapsedBase(0);
      setElapsedExtra(0);
      setLastLocalSave(null);

      showMessage('success', 'Sesión cancelada correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo cancelar.');
    } finally {
      setFinishing(false);
    }
  }

  if (loadingPage) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Header user={user} />

        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-20">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-[var(--color-primary)]" size={36} />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Cargando sesión...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-8">
      <Header user={user} />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        {message ? (
          <StatusMessage type={message.type}>
            {message.text}
          </StatusMessage>
        ) : null}

        {sesion ? (
          <ActiveSessionView
            sesion={sesion}
            form={form}
            negadosDetalle={negadosDetalle}
            motivosNegado={motivosNegado}
            onChange={handleChange}
            onNegadoChange={handleNegadoChange}
            onAddNegado={handleAddNegado}
            onRemoveNegado={handleRemoveNegado}
            onSave={handleSave}
            onFinish={handleFinish}
            onCancel={handleCancel}
            saving={saving}
            finishing={finishing}
            elapsedSeconds={elapsedSeconds}
            lastLocalSave={lastLocalSave}
          />
        ) : (
          <>
            <StatusMessage type="info">
              No tienes una sesión activa. Inicia un nuevo proceso cuando comiences a surtir.
            </StatusMessage>

            <StartSessionView
              sucursales={sucursales}
              sucursalId={sucursalId}
              setSucursalId={setSucursalId}
              surtidorPerfil={surtidorPerfil}
              onStart={handleStart}
              loading={loadingAction}
            />
          </>
        )}

        <button
          type="button"
          onClick={cargarDatosIniciales}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm active:scale-[0.99]"
        >
          <RotateCcw size={17} />
          Actualizar información
        </button>

        <div className="rounded-3xl bg-white p-4 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={17} />
            <p>
              El tiempo oficial lo calcula el servidor en horario de Ciudad de México. La información local solo sirve para recuperar tu captura si se cierra la página o se pierde conexión momentáneamente.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SurtidorPage() {
  return (
    <AuthGuard roles={['SURTIDOR']}>
      <SurtidorContent />
    </AuthGuard>
  );
}
