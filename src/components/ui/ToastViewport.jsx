import { useToastStore } from "../../stores/useToastStore";

export default function ToastViewport() {
  const { toasts } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item pointer-events-auto rounded-2xl border border-[rgba(0,200,81,0.45)] bg-[#101010] p-3">
          <p className="text-sm font-semibold text-white">
            <span className="mr-2">{toast.icon}</span>
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  );
}
