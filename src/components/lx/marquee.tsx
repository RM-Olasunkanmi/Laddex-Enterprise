/** Endless ticker. The list is repeated for a seamless loop; the duplicate is hidden from assistive tech. */
export function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const row = (hidden: boolean) => (
    <ul
      className="flex shrink-0 items-center list-none p-0 m-0"
      aria-hidden={hidden || undefined}
    >
      {items.map((t, i) => (
        <li
          key={`${t}-${i}`}
          className="flex items-center whitespace-nowrap font-display font-bold text-xl sm:text-2xl tracking-tight"
        >
          <span className="px-6 sm:px-8">{t}</span>
          <span aria-hidden="true" className="text-ochre">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={`marquee overflow-hidden ${className}`}
      role="region"
      aria-label="What Laddex supplies"
    >
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
