import type { CategoryId, PackagingType } from "@/features/catalogue/types";
import { color } from "@/lib/design/tokens";

/**
 * DEVELOPMENT RENDER. A technical-drawing style illustration of a pack, used until Laddex
 * supplies real photography. It is intentionally schematic and always labelled, so it can
 * never be mistaken for the company's actual packaging. Replace by adding images to
 * `Product.photographs` (see docs/ASSETS.md); the gallery then prefers photographs.
 */
interface Props {
  packaging: PackagingType;
  category: CategoryId;
  /** Printed on the label, e.g. "25 L". */
  sizeLabel: string;
  /** Overall drawing scale, 0 to 1, used to show relative pack sizes in a lineup. */
  scale?: number;
  className?: string;
  /** Show the small "development render" caption inside the drawing. */
  caption?: boolean;
  title?: string;
}

const STROKE = color.ink;
const OIL = "#C65A1C";
const OIL_DEEP = "#A8470F";
const STARCH = "#F1ECE0";
const SLATE = color.slate;

export function PackVisual({ packaging, category, sizeLabel, scale = 1, className, caption = true, title }: Props) {
  const palm = category === "palm-oil";
  const fill = palm ? OIL : STARCH;
  const accent = palm ? OIL_DEEP : SLATE;
  const name = palm ? "PALM OIL" : "TAPIOCA";
  const s = Math.max(0.3, Math.min(1, scale));
  const label = title ?? `Development render of ${sizeLabel} ${palm ? "palm oil" : "tapioca"} ${packaging}`;

  return (
    <svg viewBox="0 0 240 300" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMax meet">
      <title>{label}</title>
      <line x1="20" y1="268" x2="220" y2="268" stroke={STROKE} strokeWidth="1" opacity="0.35" />
      <g transform={`translate(120 268) scale(${s}) translate(-120 -268)`} stroke={STROKE} strokeWidth={1.6 / s} strokeLinejoin="round">
        {packaging === "bottle" && (
          <g>
            <rect x="104" y="40" width="32" height="16" fill={STROKE} />
            <rect x="107" y="56" width="26" height="28" fill={fill} />
            <path d="M107 84 C107 102 70 104 70 132 L70 256 Q70 268 82 268 L158 268 Q170 268 170 256 L170 132 C170 104 133 102 133 84 Z" fill={fill} />
            <Label x={76} y={150} w={88} h={74} name={name} size={sizeLabel} accent={accent} />
          </g>
        )}
        {packaging === "jerrycan" && (
          <g>
            <path d="M78 76 V48 Q78 38 88 38 H126 Q136 38 136 48 V76" fill="none" strokeWidth={3 / s} />
            <rect x="146" y="52" width="26" height="24" fill={STROKE} />
            <rect x="46" y="76" width="148" height="192" rx="10" fill={fill} />
            <path d="M46 104 H194 M46 240 H194" fill="none" opacity="0.5" />
            <Label x={62} y={128} w={116} h={90} name={name} size={sizeLabel} accent={accent} />
          </g>
        )}
        {packaging === "drum" && (
          <g>
            <ellipse cx="120" cy="64" rx="64" ry="14" fill={fill} />
            <path d="M56 64 V248 A64 14 0 0 0 184 248 V64" fill={fill} />
            <path d="M56 112 A64 14 0 0 0 184 112 M56 190 A64 14 0 0 0 184 190" fill="none" opacity="0.55" />
            <ellipse cx="120" cy="64" rx="64" ry="14" fill="none" />
            <circle cx="150" cy="62" r="5" fill={STROKE} />
            <Label x={72} y={122} w={96} h={70} name={name} size={sizeLabel} accent={accent} />
          </g>
        )}
        {packaging === "pouch" && (
          <g>
            <path d="M72 62 H168 L172 268 H68 Z" fill={fill} />
            <path d="M72 62 H168 M72 70 H168 M72 78 H168" fill="none" opacity="0.55" />
            <Label x={80} y={118} w={80} h={104} name={name} size={sizeLabel} accent={accent} />
          </g>
        )}
        {packaging === "bag" && (
          <g>
            <path d="M58 54 H182 L190 268 H50 Z" fill={fill} />
            <path d="M58 54 L50 90 M182 54 L190 90 M58 66 H182" fill="none" opacity="0.5" />
            <Label x={72} y={112} w={96} h={112} name={name} size={sizeLabel} accent={accent} />
          </g>
        )}
        {packaging === "sack" && (
          <g>
            <path d="M54 44 C50 44 44 52 44 64 L40 258 Q40 268 52 268 H188 Q200 268 200 258 L196 64 C196 52 190 44 186 44 Z" fill={fill} />
            <path d="M46 74 H194" strokeDasharray="5 4" fill="none" />
            <path d="M54 44 L60 74 M186 44 L180 74" fill="none" />
            <Label x={66} y={104} w={108} h={120} name={name} size={sizeLabel} accent={accent} />
          </g>
        )}
      </g>
      {caption && (
        <text x="120" y="290" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" letterSpacing="0.6" fill={color.ink3}>
          DEVELOPMENT RENDER, NOT PRODUCT PHOTO
        </text>
      )}
    </svg>
  );
}

function Label({ x, y, w, h, name, size, accent }: { x: number; y: number; w: number; h: number; name: string; size: string; accent: string }) {
  return (
    <g stroke="none">
      <rect x={x} y={y} width={w} height={h} fill={color.card} stroke={STROKE} strokeWidth="1.2" />
      <rect x={x} y={y} width={w} height={7} fill={accent} />
      <text x={x + w / 2} y={y + 23} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" letterSpacing="1.2" fill={color.ink2}>
        LADDEX
      </text>
      <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="600" fontSize={Math.min(30, w / 3.2)} fill={color.ink}>
        {size}
      </text>
      <text x={x + w / 2} y={y + h - 9} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" letterSpacing="1" fill={color.ink2}>
        {name}
      </text>
    </g>
  );
}
