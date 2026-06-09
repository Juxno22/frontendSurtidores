'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    BarChart3,
    Clock,
    Download,
    FileWarning,
    PackageCheck,
    RefreshCcw,
    Store,
    TrendingUp,
    Users,
    Warehouse
} from 'lucide-react';

import AdminShell from './AdminShell';
import PowerBiCard from './PowerBiCard';
import ReportPanel from './ReportPanel';
import DashboardSkeleton from './DashboardSkeleton';
import StatusBadge from './StatusBadge';

import { dashboardApi } from '@/lib/dashboardApi';
import { sucursalesApi } from '@/lib/productividadApi';

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

function money(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0
    }).format(Number(value || 0));
}

function number(value) {
    return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function decimal(value) {
    return new Intl.NumberFormat('es-MX', {
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}

function DashboardButton({ children, onClick, variant = 'default', disabled = false }) {
    const variants = {
        default: 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50',
        primary: 'bg-[var(--color-primary)] text-white ring-red-500 hover:brightness-95',
        dark: 'bg-slate-950 text-white ring-slate-900 hover:bg-slate-800'
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
        >
            {children}
        </button>
    );
}

function MiniBar({ value, max, label, suffix = '' }) {
    const pct = max > 0 ? Math.min(100, (Number(value || 0) / max) * 100) : 0;

    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-slate-600">{label}</span>
                <span className="font-black text-slate-950">
                    {number(value)}{suffix}
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function EmptyPanel({ text = 'Sin información para mostrar.' }) {
    return (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-500">{text}</p>
        </div>
    );
}

function Filters({
    fecha,
    setFecha,
    sucursalId,
    setSucursalId,
    sucursales,
    onRefresh,
    loading
}) {
    return (
        <ReportPanel
            title="Filtros"
            subtitle="Controla la fecha operativa y la sucursal surtida."
        >
            <div className="grid min-w-0 gap-3">
                <label className="min-w-0">
                    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                        Fecha
                    </span>

                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
                    />
                </label>

                <label className="min-w-0">
                    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                        Sucursal
                    </span>

                    <select
                        value={sucursalId}
                        onChange={(e) => setSucursalId(e.target.value)}
                        className="block w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
                    >
                        <option value="">Todas las sucursales</option>

                        {sucursales.map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>
                                {sucursal.nombre}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-white shadow-sm ring-1 ring-red-500 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCcw size={17} />
                        <span className="truncate">Actualizar</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFecha(todayLocal());
                            setSucursalId('');
                        }}
                        className="flex w-full min-w-0 items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                        Hoy
                    </button>
                </div>
            </div>
        </ReportPanel>
    );
}

function ComparativoResumen({ resumen }) {
    const estados = resumen?.comparativo?.estados || {
        CUADRADO: 0,
        CON_DIFERENCIAS: 0,
        SIN_REPORTE: 0,
        SIN_CAPTURA: 0
    };

    const diferencias = resumen?.comparativo?.diferencias || {
        tickets: 0,
        partidas: 0,
        ceros: 0,
        no_surtido: 0
    };

    return (
        <ReportPanel
            title="Estado del comparativo"
            subtitle="Resumen App vs reporte grupal."
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-green-50 p-4 ring-1 ring-green-200">
                    <p className="text-xs font-black uppercase tracking-widest text-green-700">
                        Cuadradas
                    </p>
                    <p className="mt-2 text-3xl font-black text-green-800">
                        {number(estados.CUADRADO)}
                    </p>
                </div>

                <div className="rounded-3xl bg-red-50 p-4 ring-1 ring-red-200">
                    <p className="text-xs font-black uppercase tracking-widest text-red-700">
                        Diferencias
                    </p>
                    <p className="mt-2 text-3xl font-black text-red-800">
                        {number(estados.CON_DIFERENCIAS)}
                    </p>
                </div>

                <div className="rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                        Sin reporte
                    </p>
                    <p className="mt-2 text-3xl font-black text-amber-800">
                        {number(estados.SIN_REPORTE)}
                    </p>
                </div>

                <div className="rounded-3xl bg-slate-100 p-4 ring-1 ring-slate-200">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Sin captura
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                        {number(estados.SIN_CAPTURA)}
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-2 rounded-3xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-600">Dif. tickets</span>
                    <span className="font-black text-slate-950">{number(diferencias.tickets)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-600">Dif. partidas</span>
                    <span className="font-black text-slate-950">{number(diferencias.partidas)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-600">Dif. ceros</span>
                    <span className="font-black text-slate-950">{number(diferencias.ceros)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-600">Dif. no surtido</span>
                    <span className="font-black text-slate-950">{number(diferencias.no_surtido)}</span>
                </div>
            </div>
        </ReportPanel>
    );
}

function RankingSurtidores({ rows }) {
    const maxPartidas = Math.max(...rows.map((row) => Number(row.partidas || 0)), 0);

    return (
        <ReportPanel
            title="Ranking de surtidores"
            subtitle="Ordenado por productividad de partidas por hora."
        >
            {rows.length === 0 ? (
                <EmptyPanel text="Sin surtidores con sesiones finalizadas en esta fecha." />
            ) : (
                <div className="space-y-3">
                    {rows.slice(0, 10).map((row) => (
                        <div
                            key={row.surtidor_id}
                            className="rounded-3xl border border-slate-200 bg-white p-4"
                        >
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-black text-slate-950">
                                        #{row.posicion} · {row.surtidor_nombre}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Código: {row.surtidor_codigo || 'N/A'} · Sesiones: {number(row.sesiones_finalizadas)}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
                                    <p className="text-[10px] font-black uppercase text-white/60">
                                        Partidas/h
                                    </p>
                                    <p className="text-sm font-black">
                                        {decimal(row.partidas_por_hora)}
                                    </p>
                                </div>
                            </div>

                            <MiniBar
                                label={`${number(row.partidas)} partidas`}
                                value={row.partidas}
                                max={maxPartidas}
                            />

                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="rounded-2xl bg-slate-50 p-2">
                                    <p className="font-bold text-slate-500">Tickets</p>
                                    <p className="font-black text-slate-950">{number(row.tickets)}</p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-2">
                                    <p className="font-bold text-slate-500">Monto</p>
                                    <p className="font-black text-slate-950">{money(row.monto)}</p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-2">
                                    <p className="font-bold text-slate-500">Horas</p>
                                    <p className="font-black text-slate-950">{decimal(row.duracion_horas)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ReportPanel>
    );
}

function SucursalesTable({ rows }) {
    return (
        <ReportPanel
            title="Ranking por sucursal surtida"
            subtitle="Carga de trabajo y estado del comparativo."
        >
            {rows.length === 0 ? (
                <EmptyPanel text="Sin información por sucursal en esta fecha." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full border-separate border-spacing-y-2 text-left text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-widest text-slate-400">
                                <th className="px-3 py-2">Sucursal</th>
                                <th className="px-3 py-2">Estado</th>
                                <th className="px-3 py-2 text-right">Tickets</th>
                                <th className="px-3 py-2 text-right">Partidas</th>
                                <th className="px-3 py-2 text-right">Monto</th>
                                <th className="px-3 py-2 text-right">Dif. tickets</th>
                                <th className="px-3 py-2 text-right">Dif. partidas</th>
                                <th className="px-3 py-2 text-right">Partidas/h</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.sucursal_id} className="bg-white shadow-sm ring-1 ring-slate-200">
                                    <td className="rounded-l-2xl px-3 py-4">
                                        <p className="font-black text-slate-950">{row.sucursal_nombre}</p>
                                        <p className="text-xs font-semibold text-slate-500">
                                            Sesiones: {number(row.app?.sesiones_finalizadas)}
                                        </p>
                                    </td>

                                    <td className="px-3 py-4">
                                        <StatusBadge status={row.estado_comparativo} />
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(row.app?.tickets)}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(row.app?.partidas)}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {money(row.app?.monto)}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(row.diferencias?.tickets)}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(row.diferencias?.partidas)}
                                    </td>

                                    <td className="rounded-r-2xl px-3 py-4 text-right font-black">
                                        {decimal(row.app?.partidas_por_hora)}
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

function PendientesPanel({ pendientes }) {
    const resumen = pendientes?.resumen || {};

    return (
        <ReportPanel
            title="Pendientes operativos"
            subtitle="Alertas del día que requieren revisión."
        >
            <div className="grid gap-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-600">Sesiones en proceso</span>
                        <span className="text-xl font-black text-slate-950">
                            {number(resumen.sesiones_en_proceso)}
                        </span>
                    </div>
                </div>

                <div className="rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-amber-700">Más de 4 horas</span>
                        <span className="text-xl font-black text-amber-800">
                            {number(resumen.sesiones_mas_4_horas)}
                        </span>
                    </div>
                </div>

                <div className="rounded-3xl bg-red-50 p-4 ring-1 ring-red-200">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-red-700">Con diferencias</span>
                        <span className="text-xl font-black text-red-800">
                            {number(resumen.sucursales_con_diferencias)}
                        </span>
                    </div>
                </div>

                <div className="rounded-3xl bg-blue-50 p-4 ring-1 ring-blue-200">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-blue-700">Sin reporte</span>
                        <span className="text-xl font-black text-blue-800">
                            {number(resumen.sucursales_sin_reporte)}
                        </span>
                    </div>
                </div>
            </div>
        </ReportPanel>
    );
}

function TendenciaPanel({ tendencia }) {
    const maxPartidas = Math.max(...tendencia.map((row) => Number(row.app?.partidas || 0)), 0);

    return (
        <ReportPanel
            title="Tendencia reciente"
            subtitle="Últimos 7 días de partidas capturadas en app."
        >
            {tendencia.length === 0 ? (
                <EmptyPanel text="Sin tendencia disponible." />
            ) : (
                <div className="space-y-3">
                    {tendencia.map((row) => (
                        <MiniBar
                            key={row.fecha}
                            label={row.fecha}
                            value={row.app?.partidas || 0}
                            max={maxPartidas}
                        />
                    ))}
                </div>
            )}
        </ReportPanel>
    );
}

export default function PowerBiDashboard({
    role = 'ADMIN',
    title = 'Dashboard ejecutivo',
    subtitle = 'Vista general de productividad.'
}) {
    const [fecha, setFecha] = useState(todayLocal());
    const [sucursalId, setSucursalId] = useState('');
    const [sucursales, setSucursales] = useState([]);

    const [resumen, setResumen] = useState(null);
    const [rankingSurtidores, setRankingSurtidores] = useState([]);
    const [rankingSucursales, setRankingSucursales] = useState([]);
    const [pendientes, setPendientes] = useState(null);
    const [tendencia, setTendencia] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const filtros = useMemo(() => ({
        fecha,
        sucursal_id: sucursalId
    }), [fecha, sucursalId]);

    async function cargarDashboard() {
        try {
            setLoading(true);
            setError('');

            const desde = addDays(fecha, -6);

            const [
                resumenRes,
                rankingSurtidoresRes,
                rankingSucursalesRes,
                pendientesRes,
                tendenciaRes
            ] = await Promise.all([
                dashboardApi.resumenDia(filtros),
                dashboardApi.surtidoresRanking({
                    ...filtros,
                    orden: 'partidas_por_hora',
                    limit: 20
                }),
                dashboardApi.sucursalesRanking({
                    ...filtros,
                    orden: 'partidas'
                }),
                dashboardApi.pendientes(filtros),
                dashboardApi.tendencia({
                    desde,
                    hasta: fecha,
                    sucursal_id: sucursalId
                })
            ]);

            setResumen(resumenRes);
            setRankingSurtidores(rankingSurtidoresRes.ranking || []);
            setRankingSucursales(rankingSucursalesRes.ranking || []);
            setPendientes(pendientesRes);
            setTendencia(tendenciaRes.tendencia || []);
        } catch (err) {
            setError(err.message || 'No se pudo cargar el dashboard.');
        } finally {
            setLoading(false);
        }
    }

    async function cargarSucursales() {
        try {
            const data = await sucursalesApi.listarActivas();
            setSucursales(data.sucursales || []);
        } catch {
            setSucursales([]);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarSucursales();
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarDashboard();
    }, [fecha, sucursalId]);

    const kpis = resumen?.kpis || {};
    const dif = resumen?.comparativo?.diferencias || {};

    return (
        <AdminShell
            role={role}
            title={title}
            subtitle={subtitle}
        >
            <div className="space-y-5">
                {error ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        {error}
                    </div>
                ) : null}

                {loading && !resumen ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <PowerBiCard
                                title="Tickets"
                                value={number(kpis.tickets)}
                                subtitle={`${number(kpis.sesiones_finalizadas)} sesiones finalizadas`}
                                icon={PackageCheck}
                                tone="dark"
                            />

                            <PowerBiCard
                                title="Partidas"
                                value={number(kpis.partidas)}
                                subtitle={`${decimal(kpis.partidas_por_hora)} partidas/hora`}
                                icon={BarChart3}
                                tone="red"
                            />

                            <PowerBiCard
                                title="Monto"
                                value={money(kpis.monto)}
                                subtitle={`${money(kpis.monto_por_hora)} por hora`}
                                icon={TrendingUp}
                                tone="blue"
                            />

                            <PowerBiCard
                                title="Tiempo"
                                value={`${decimal(kpis.duracion_horas)} h`}
                                subtitle={`${number(kpis.surtidores_con_captura)} surtidores con captura`}
                                icon={Clock}
                                tone="default"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <PowerBiCard
                                title="Ceros"
                                value={number(kpis.ceros)}
                                subtitle="Partidas en cero"
                                icon={AlertTriangle}
                                tone="soft"
                            />

                            <PowerBiCard
                                title="No surtido / Negados"
                                value={number(kpis.no_surtido)}
                                subtitle="Mismo campo operativo"
                                icon={FileWarning}
                                tone="soft"
                            />

                            <PowerBiCard
                                title="Dif. tickets"
                                value={number(dif.tickets)}
                                subtitle="App vs reporte"
                                icon={Store}
                                tone={Number(dif.tickets || 0) === 0 ? 'soft' : 'red'}
                            />

                            <PowerBiCard
                                title="Dif. partidas"
                                value={number(dif.partidas)}
                                subtitle="App vs reporte"
                                icon={Warehouse}
                                tone={Number(dif.partidas || 0) === 0 ? 'soft' : 'red'}
                            />
                        </div>

                        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                            <div className="min-w-0">
                                <SucursalesTable rows={rankingSucursales} />
                            </div>

                            <div className="min-w-0 space-y-4">
                                <Filters
                                    fecha={fecha}
                                    setFecha={setFecha}
                                    sucursalId={sucursalId}
                                    setSucursalId={setSucursalId}
                                    sucursales={sucursales}
                                    onRefresh={cargarDashboard}
                                    loading={loading}
                                />

                                <ComparativoResumen resumen={resumen} />
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_0.8fr]">
                            <RankingSurtidores rows={rankingSurtidores} />
                            <PendientesPanel pendientes={pendientes} />
                            <TendenciaPanel tendencia={tendencia} />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <DashboardButton onClick={cargarDashboard} variant="dark" disabled={loading}>
                                <RefreshCcw size={17} />
                                Actualizar dashboard
                            </DashboardButton>

                            <a
                                href={role === 'ADMIN' ? '/admin/exportaciones' : '/supervisor/exportaciones'}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                            >
                                <Download size={17} />
                                Exportar
                            </a>
                        </div>
                    </>
                )}
            </div>
        </AdminShell>
    );
}