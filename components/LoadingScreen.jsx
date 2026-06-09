export default function LoadingScreen({ text = 'Cargando...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm text-slate-300">{text}</p>
      </div>
    </div>
  );
}