export default function StatusBadge({ status }) {
  const value = String(status || '').toUpperCase();

  const config = {
    CUADRADO: {
      label: 'Cuadrado',
      className: 'bg-green-50 text-green-700 ring-green-200'
    },
    CON_DIFERENCIAS: {
      label: 'Con diferencias',
      className: 'bg-red-50 text-red-700 ring-red-200'
    },
    SIN_REPORTE: {
      label: 'Sin reporte',
      className: 'bg-amber-50 text-amber-700 ring-amber-200'
    },
    SIN_CAPTURA: {
      label: 'Sin captura',
      className: 'bg-slate-100 text-slate-700 ring-slate-200'
    }
  };

  const item = config[value] || {
    label: value || 'Sin estado',
    className: 'bg-slate-100 text-slate-700 ring-slate-200'
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${item.className}`}>
      {item.label}
    </span>
  );
}