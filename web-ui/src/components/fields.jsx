export function Champ({ label, children, hint }) {
  return (
    <label className="block text-sm font-medium text-black">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs font-normal text-[#555555]">{hint}</p>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm text-black " +
  "outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 " +
  "placeholder:text-gray-400";

export function BoutonPrincipal({ loading, children, ...props }) {
  return (
    <button
      type="button"
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d8f64] disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {children}
    </button>
  );
}
