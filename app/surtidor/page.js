'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Loader2,
  PackageCheck,
  Play,
  RotateCcw,
  Save,
  Square,
  Store,
  XCircle
} from 'lucide-react';

import UserAccountMenu from '@/components/UserAccountMenu';
import AuthGuard from '@/components/AuthGuard';
import { getUser } from '@/lib/auth';
import { sesionesApi, sucursalesApi } from '@/lib/productividadApi';
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

function getSurtidoTotal(form) {
  return (
    numberOrZero(form.partidas_surtidas) +
    numberOrZero(form.ceros) +
    numberOrZero(form.negados)
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

function buildPayload(form) {
  const partidasSurtidas = numberOrZero(form.partidas_surtidas);
  const ceros = numberOrZero(form.ceros);
  const negados = numberOrZero(form.negados);
  const surtidoTotal = partidasSurtidas + ceros + negados;

  return {
    surtido_total: surtidoTotal,
    tickets: surtidoTotal,

    partidas_surtidas: partidasSurtidas,
    partidas: partidasSurtidas,

    ceros,

    negados,
    no_surtido: negados,

    monto: 0,
    observaciones: String(form.observaciones || '').trim()
  };
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

function Field({ label, name, value, onChange, type = 'number', placeholder = '0' }) {
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
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
      />
    </label>
  );
}

function StartSessionView({
  sucursales,
  sucursalId,
  setSucursalId,
  onStart,
  loading
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Store size={24} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">
            Iniciar surtido
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecciona la sucursal que vas a surtir. El tiempo oficial lo toma el servidor con horario de Ciudad de México.
          </p>
        </div>
      </div>

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

      <button
        type="button"
        onClick={onStart}
        disabled={loading || !sucursalId}
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
  onChange,
  onSave,
  onFinish,
  onCancel,
  saving,
  finishing,
  elapsedSeconds,
  lastLocalSave
}) {
  const surtidoTotal = getSurtidoTotal(form);

  const metricas = useMemo(() => {
    const horas = elapsedSeconds / 3600;
    const partidasSurtidas = numberOrZero(form.partidas_surtidas);
    const negados = numberOrZero(form.negados);

    return {
      surtidoHora: horas > 0 ? (surtidoTotal / horas).toFixed(2) : '0.00',
      partidasHora: horas > 0 ? (partidasSurtidas / horas).toFixed(2) : '0.00',
      negadosHora: horas > 0 ? (negados / horas).toFixed(2) : '0.00'
    };
  }, [elapsedSeconds, form, surtidoTotal]);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Sesión en proceso
            </p>
            <h2 className="mt-1 text-xl font-black">
              {sesion.sucursal_nombre}
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
              Surtido total se calcula automático: partidas surtidas + ceros + negados.
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
            {formatNumber(numberOrZero(form.partidas_surtidas))} partidas + {formatNumber(numberOrZero(form.ceros))} ceros + {formatNumber(numberOrZero(form.negados))} negados
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
            value={form.negados}
            onChange={onChange}
          />
        </div>

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
  const [sucursalId, setSucursalId] = useState('');
  const [sesion, setSesion] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

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

      const [sucursalesRes, activaRes] = await Promise.all([
        sucursalesApi.listarActivas(),
        sesionesApi.obtenerActiva()
      ]);

      setSucursales(sucursalesRes.sucursales || []);

      if (activaRes.sesion) {
        const active = activaRes.sesion;
        setSesion(active);

        setElapsedBase(Number(active.segundos_transcurridos || 0));
        setElapsedExtra(0);

        const draftKey = getDraftKeyBySessionId(active.id);
        const draft = await getSessionDraft(draftKey);

        if (draft) {
          setForm(getFormFromSesionOrDraft(draft));
          showMessage('success', 'Se recuperó tu borrador local.');
        } else {
          setForm(getFormFromSesionOrDraft(active));
        }
      } else {
        setSesion(null);
        setForm(EMPTY_FORM);
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
        await saveSessionDraft(draftKey, form);
        setLastLocalSave(new Date().toISOString());
      } catch {
        // No bloqueamos captura si IndexedDB falla.
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [form, sesion]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleStart() {
    if (!sucursalId) {
      showMessage('warning', 'Selecciona una sucursal.');
      return;
    }

    try {
      setLoadingAction(true);

      const data = await sesionesApi.iniciar({
        sucursal_id: Number(sucursalId)
      });

      setSesion(data.sesion);
      setForm(EMPTY_FORM);
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

      const payload = buildPayload(form);
      const data = await sesionesApi.guardarAvance(sesion.id, payload);

      setSesion((prev) => ({
        ...prev,
        ...data.sesion
      }));

      const draftKey = getDraftKeyBySessionId(sesion.id);
      await saveSessionDraft(draftKey, form);

      showMessage('success', 'Avance guardado correctamente.');
    } catch (error) {
      showMessage('error', error.message || 'No se pudo guardar el avance.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    if (!sesion) return;

    const payload = buildPayload(form);

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
            onChange={handleChange}
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
