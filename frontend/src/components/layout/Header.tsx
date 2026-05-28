import { useAuthStore } from "../../stores/useAuthStore";

export default function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-lg border-b border-cream-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
      <div className="relative w-40 sm:w-60 lg:w-80">
        <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索..."
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-cream-100 border border-cream-200 rounded-full text-sm
                     focus:outline-none focus:ring-2 focus:ring-mint-200 focus:border-transparent
                     placeholder:text-gray-400 transition-all"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-cream-100 transition-colors relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blush-400" />
        </button>
        <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-cream-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-mint-300 to-sky-300 flex items-center justify-center text-white font-semibold text-xs ml-1 shadow-soft">
          {user?.nickname?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
