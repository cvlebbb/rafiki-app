import { useAppState } from "../state/AppState";

export default function ToastStack() {
  const { toasts } = useAppState();

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item pointer-events-auto rounded-2xl border border-[rgba(0,200,81,0.35)] bg-[#101010] p-3 shadow-[0_0_24px_rgba(0,200,81,0.2)]">
          <p className="text-sm font-semibold text-white">
            <span className="mr-2">{toast.icon}</span>
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  );
}
