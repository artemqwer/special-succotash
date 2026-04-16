export default function DataRocksLogo() {
  return (
    <div className="flex items-center gap-3 mb-6">
      {/* SVG bar chart icon */}
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background rounded square */}
        <rect width="42" height="42" rx="10" fill="#EFF4FF" />

        {/* Bar 1 — short */}
        <rect x="7" y="26" width="6" height="10" rx="1.5" fill="#2563EB" />
        {/* Bar 2 — medium */}
        <rect x="15" y="19" width="6" height="17" rx="1.5" fill="#2563EB" />
        {/* Bar 3 — tall */}
        <rect x="23" y="11" width="6" height="25" rx="1.5" fill="#1D4ED8" />
        {/* Bar 4 — medium-short */}
        <rect x="31" y="22" width="4" height="14" rx="1.5" fill="#93C5FD" />
      </svg>

      <div>
        <div
          className="text-[16px] font-black text-gray-900 leading-tight"
          style={{ letterSpacing: "0.12em" }}
        >
          DATA ROCKS
        </div>
        <div
          className="text-[10.5px] text-gray-400 leading-tight mt-[1px]"
          style={{ letterSpacing: "0.03em" }}
        >
          E-commerce Intelligence
        </div>
      </div>
    </div>
  );
}
