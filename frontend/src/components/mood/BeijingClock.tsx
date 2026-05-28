import { useState, useEffect } from "react";

export default function BeijingClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("zh-CN", {
          timeZone: "Asia/Shanghai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-right shrink-0">
      <div className="text-[10px] text-gray-400 leading-tight">
        <p>北京时间</p>
        <p className="text-sm font-mono font-semibold text-gray-700 tabular-nums">{time || "--:--:--"}</p>
      </div>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-xs shadow-soft">
        🕐
      </div>
    </div>
  );
}
