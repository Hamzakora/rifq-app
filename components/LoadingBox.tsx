export function LoadingBox({ text = "جاري التحميل..." }: { text?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      {text}
    </div>
  );
}
