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

function number(value) {
    return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

function decimal(value) {
    return new Intl.NumberFormat('es-MX', {
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}

function pct(value) {
    return `${decimal(value)}%`;
}

function surtidoTotal(row = {}) {
    return Number(row.surtido_total ?? row.tickets ?? 0);
}

function partidasSurtidas(row = {}) {
    return Number(row.partidas_surtidas ?? row.partidas ?? 0);
}

function horasActivas(row = {}) {
    return Number(row.tiempo_activo_laboral_horas ?? row.duracion_laboral_horas ?? row.duracion_horas ?? 0);
}

function horasMuertas(row = {}) {
    return Number(row.tiempo_muerto_operativo_horas ?? row.tiempo_muerto_laboral_horas ?? 0);
}

function partidasPorHora(row = {}) {
    return Number(row.partidas_por_hora_laboral ?? row.partidas_por_hora ?? 0);
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
                    <span className="font-bold text-slate-600">Dif. surtido total</span>
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
    const maxPartidas = Math.max(...rows.map((row) => partidasSurtidas(row)), 0);

    return (
        <ReportPanel
            title="Ranking de surtidores"
            subtitle="Ordenado por productividad de partidas surtidas por hora laboral."
        >
            {rows.length === 0 ? (
                <EmptyPanel text="Sin surtidores con sesiones finalizadas en esta fecha." />
            ) : (
                <div className="space-y-3">
                    {rows.slice(0, 10).map((row, index) => (
                        <div
                            key={row.surtidor_id}
                            className="rounded-3xl border border-slate-200 bg-white p-4"
                        >
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-black text-slate-950">
                                        #{row.posicion || index + 1} · {row.surtidor_nombre}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Código: {row.surtidor_codigo || 'N/A'} · Sesiones: {number(row.sesiones_finalizadas)}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
                                    <p className="text-[10px] font-black uppercase text-white/60">
                                        Partidas/h laboral
                                    </p>
                                    <p className="text-sm font-black">
                                        {decimal(partidasPorHora(row))}
                                    </p>
                                </div>
                            </div>

                            <MiniBar
                                label={`${number(partidasSurtidas(row))} partidas surtidas`}
                                value={partidasSurtidas(row)}
                                max={maxPartidas}
                            />

                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="rounded-2xl bg-slate-50 p-2">
                                    <p className="font-bold text-slate-500">Surtido total</p>
                                    <p className="font-black text-slate-950">{number(surtidoTotal(row))}</p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-2">
                                    <p className="font-bold text-slate-500">Negados</p>
                                    <p className="font-black text-slate-950">{number(row.negados ?? row.no_surtido)}</p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-2">
                                    <p className="font-bold text-slate-500">Activo / muerto</p>
                                    <p className="font-black text-slate-950">
                                        {decimal(horasActivas(row))} / {decimal(horasMuertas(row))}
                                    </p>
                                </div>
                            </div>

                            {'cumplimiento_partidas_vs_esperado_pct' in row ? (
                                <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs ring-1 ring-blue-100">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-blue-700">Vs promedio equipo</span>
                                        <span className="font-black text-blue-900">{pct(row.cumplimiento_partidas_vs_esperado_pct)}</span>
                                    </div>
                                    <p className="mt-1 font-semibold text-blue-700/80">
                                        Esperado: {decimal(row.esperado_partidas_surtidas)} partidas · Dif: {decimal(row.diferencia_partidas_vs_esperado)}
                                    </p>
                                </div>
                            ) : null}
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
                                <th className="px-3 py-2 text-right">Surtido total</th>
                                <th className="px-3 py-2 text-right">Partidas surtidas</th>
                                <th className="px-3 py-2 text-right">Dif. surtido total</th>
                                <th className="px-3 py-2 text-right">Dif. partidas</th>
                                <th className="px-3 py-2 text-right">Partidas/h laboral</th>
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
                                        {number(surtidoTotal(row.app))}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(partidasSurtidas(row.app))}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(row.diferencias?.tickets)}
                                    </td>

                                    <td className="px-3 py-4 text-right font-black">
                                        {number(row.diferencias?.partidas)}
                                    </td>

                                    <td className="rounded-r-2xl px-3 py-4 text-right font-black">
                                        {decimal(partidasPorHora(row.app))}
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
    const maxPartidas = Math.max(...tendencia.map((row) => partidasSurtidas(row.app)), 0);

    return (
        <ReportPanel
            title="Tendencia reciente"
            subtitle="Últimos 7 días de partidas surtidas capturadas en app."
        >
            {tendencia.length === 0 ? (
                <EmptyPanel text="Sin tendencia disponible." />
            ) : (
                <div className="space-y-3">
                    {tendencia.map((row) => (
                        <MiniBar
                            key={row.fecha}
                            label={row.fecha}
                            value={partidasSurtidas(row.app)}
                            max={maxPartidas}
                        />
                    ))}
                </div>
            )}
        </ReportPanel>
    );
}


function ProductividadJornadaPanel({ productividad }) {
    const resumen = productividad?.resumen;

    if (!resumen) {
        return null;
    }

    const jornada = resumen.jornada || {};
    const aprovechamiento = Number(resumen.aprovechamiento_operativo_pct ?? resumen.aprovechamiento_turno_pct ?? 0);
    const aprovechamientoJornada = Number(resumen.aprovechamiento_jornada_pct || 0);

    return (
        <ReportPanel
            title="Productividad por jornada"
            subtitle="Horas de inicio/fin, tiempo activo y tiempo muerto entre surtidos."
        >
            <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Jornada</p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                            {jornada.es_laboral ? `${jornada.inicio} - ${jornada.fin}` : 'Descanso'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Comida: {jornada.comida_inicio || '--'} - {jornada.comida_fin || '--'}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Horas-equipo transcurridas</p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                            {decimal(jornada.horas_equipo_transcurridas_horas ?? jornada.jornada_disponible_equipo_horas)} h
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            {number(resumen.surtidores_activos)} surtidores activos
                        </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Promedio esperado</p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                            {decimal(resumen.esperado_equipo?.partidas_surtidas_por_surtidor)} partidas
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Según reporte grupal / activos
                        </p>
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-black text-slate-700">Aprovechamiento operativo</span>
                        <span className="font-black text-slate-950">{pct(aprovechamiento)}</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-[var(--color-primary)]"
                            style={{ width: `${Math.min(100, aprovechamiento)}%` }}
                        />
                    </div>
                    <div className="mt-2 grid gap-1 text-xs font-bold text-slate-500 sm:grid-cols-3">
                        <span>Activo: {decimal(resumen.tiempo_activo_laboral_horas)} h</span>
                        <span>Muerto entre surtidos: {decimal(resumen.tiempo_muerto_operativo_horas ?? resumen.tiempo_muerto_laboral_horas)} h</span>
                        <span>Jornada: {pct(aprovechamientoJornada)}</span>
                    </div>
                </div>
            </div>
        </ReportPanel>
    );
}

function HorasPicoPanel({ productividad }) {
    const horasPico = productividad?.horas_pico;
    const horasSurtido = horasPico?.horas_surtido || [];
    const horasMuerto = horasPico?.horas_tiempo_muerto || [];
    const maxPartidas = Math.max(...horasSurtido.map((row) => Number(row.partidas_surtidas || 0)), 0);
    const maxMuerto = Math.max(...horasMuerto.map((row) => Number(row.tiempo_muerto_laboral_minutos || 0)), 0);

    return (
        <ReportPanel
            title="Horas pico"
            subtitle="Picos de surtido y de tiempo muerto dentro de jornada."
        >
            <div className="space-y-5">
                <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-700">Pico de surtido</p>
                        <p className="text-sm font-black text-slate-950">
                            {horasPico?.pico_surtido?.hora || '--'}
                        </p>
                    </div>

                    {horasSurtido.length === 0 ? (
                        <EmptyPanel text="Sin horas de surtido todavía." />
                    ) : (
                        <div className="space-y-3">
                            {horasSurtido.slice(0, 8).map((row) => (
                                <MiniBar
                                    key={`surtido-${row.hora}`}
                                    label={`${row.hora} · ${number(row.sesiones)} sesiones`}
                                    value={row.partidas_surtidas}
                                    max={maxPartidas}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-700">Pico de tiempo muerto</p>
                        <p className="text-sm font-black text-slate-950">
                            {horasPico?.pico_tiempo_muerto?.hora || '--'}
                        </p>
                    </div>

                    {horasMuerto.length === 0 ? (
                        <div className="rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                            Sin espacios muertos entre sesiones todavía.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {horasMuerto.slice(0, 8).map((row) => (
                                <MiniBar
                                    key={`muerto-${row.hora}`}
                                    label={row.hora}
                                    value={row.tiempo_muerto_laboral_minutos}
                                    max={maxMuerto}
                                    suffix=" min"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
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
    const [productividad, setProductividad] = useState(null);

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
                rankingSucursalesRes,
                pendientesRes,
                tendenciaRes,
                productividadRes
            ] = await Promise.all([
                dashboardApi.resumenDia(filtros),
                dashboardApi.sucursalesRanking({
                    ...filtros,
                    orden: 'partidas'
                }),
                dashboardApi.pendientes(filtros),
                dashboardApi.tendencia({
                    desde,
                    hasta: fecha,
                    sucursal_id: sucursalId
                }),
                dashboardApi.productividadJornada(filtros)
            ]);

            setResumen(resumenRes);
            setRankingSurtidores(productividadRes.surtidores || []);
            setRankingSucursales(rankingSucursalesRes.ranking || []);
            setPendientes(pendientesRes);
            setTendencia(tendenciaRes.tendencia || []);
            setProductividad(productividadRes);
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

    const kpis = productividad?.resumen || resumen?.kpis || {};
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
                                title="Surtido total"
                                value={number(kpis.surtido_total ?? kpis.tickets)}
                                subtitle={`${number(kpis.sesiones_finalizadas)} sesiones finalizadas`}
                                icon={PackageCheck}
                                tone="dark"
                            />

                            <PowerBiCard
                                title="Partidas surtidas"
                                value={number(kpis.partidas_surtidas ?? kpis.partidas)}
                                subtitle={`${decimal(kpis.partidas_por_hora_laboral ?? kpis.partidas_por_hora)} partidas/h laboral`}
                                icon={BarChart3}
                                tone="red"
                            />

                            <PowerBiCard
                                title="Aprovechamiento operativo"
                                value={pct(kpis.aprovechamiento_operativo_pct ?? kpis.aprovechamiento_turno_pct)}
                                subtitle="Activo / activo + muerto entre surtidos"
                                icon={TrendingUp}
                                tone="blue"
                            />

                            <PowerBiCard
                                title="Tiempo muerto"
                                value={`${decimal(kpis.tiempo_muerto_operativo_horas ?? kpis.tiempo_muerto_laboral_horas)} h`}
                                subtitle="Entre fin de surtido e inicio del siguiente"
                                icon={Clock}
                                tone="default"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <PowerBiCard
                                title="Tiempo activo"
                                value={`${decimal(kpis.tiempo_activo_laboral_horas)} h`}
                                subtitle={`${decimal(kpis.partidas_por_hora_activa)} partidas/h activa`}
                                icon={Warehouse}
                                tone="soft"
                            />

                            <PowerBiCard
                                title="Ceros"
                                value={number(kpis.ceros)}
                                subtitle="Partidas en cero"
                                icon={AlertTriangle}
                                tone="soft"
                            />

                            <PowerBiCard
                                title="Negados"
                                value={number(kpis.negados ?? kpis.no_surtido)}
                                subtitle="Mismo campo operativo"
                                icon={FileWarning}
                                tone="soft"
                            />

                            <PowerBiCard
                                title="Dif. partidas"
                                value={number(dif.partidas)}
                                subtitle="App vs reporte"
                                icon={Store}
                                tone={Number(dif.partidas || 0) === 0 ? 'soft' : 'red'}
                            />
                        </div>

                        <ProductividadJornadaPanel productividad={productividad} />

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
                            <HorasPicoPanel productividad={productividad} />
                            <div className="space-y-4">
                                <PendientesPanel pendientes={pendientes} />
                                <TendenciaPanel tendencia={tendencia} />
                            </div>
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