import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

interface CrisisBannerProps {
  visible: boolean;
  message?: string | null;
  flags?: Array<{ rule_id: string; severity: string }>;
}

const severityStyles: Record<string, string> = {
  critical: "bg-rose-500/10 border-rose-400/20 text-rose-200",
  high: "bg-rose-400/8 border-rose-400/15 text-rose-200",
  medium: "bg-moon-400/8 border-moon-400/15 text-moon-200",
};

export default function CrisisBanner({ visible, message, flags }: CrisisBannerProps) {
  const highestSeverity =
    flags?.reduce((max, f) => {
      const order: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
      return order[f.severity] > (order[max] ?? 0) ? f.severity : max;
    }, "medium") ?? "high";

  const colorClass = severityStyles[highestSeverity] ?? severityStyles.high;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
          className={cn("border rounded-2xl p-4 mb-4 text-sm", colorClass)}
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p className="font-medium mb-1">安全提示</p>
              {message ? (
                <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
              ) : (
                <p>
                  我注意到你可能正经历一些困难的时刻。如果你需要即时支持，请联系：
                  <br />
                  <strong>全国心理援助热线：400-161-9995</strong>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
