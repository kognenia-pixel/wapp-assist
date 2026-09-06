import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function Toast({ toast }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22 }}
            className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.ok ? "bg-brand" : "bg-red-600"
            }`}
          >
            {toast.ok ? <FiCheckCircle size={18} className="mt-0.5 shrink-0" /> : <FiAlertCircle size={18} className="mt-0.5 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
