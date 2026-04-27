export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}