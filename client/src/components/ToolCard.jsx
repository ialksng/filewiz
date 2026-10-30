export default function ToolCard({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-0 w-full flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 sm:p-6"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-2xl" aria-hidden="true">
        {icon}
      </span>
      <span className="mt-4 flex w-full items-center justify-between gap-3 font-semibold text-slate-900 group-hover:text-violet-800">
        {title}
        <span aria-hidden="true" className="text-violet-700">→</span>
      </span>
      <span className="mt-1 text-sm leading-5 text-slate-500">{description}</span>
    </button>
  );
}
