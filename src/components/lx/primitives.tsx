import Link from "next/link";

import type { StockStatus } from "@/features/catalogue/types";
import type { ComponentProps, ReactNode } from "react";

import { STOCK_LABEL } from "@/components/lx/labels";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Tone = "default" | "success" | "warning" | "danger" | "info" | "sample";

export function Tag({
  tone = "default",
  children,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      className={cx("tag", tone !== "default" && `tag-${tone}`)}
      title={title}
    >
      {children}
    </span>
  );
}

export function StockTag({ status }: { status: StockStatus }) {
  const tone: Tone =
    status === "in-stock"
      ? "success"
      : status === "low-stock"
        ? "warning"
        : "danger";
  return <Tag tone={tone}>{STOCK_LABEL[status]}</Tag>;
}

export function SampleTag({
  children = "Sample data",
}: {
  children?: ReactNode;
}) {
  return <Tag tone="sample">{children}</Tag>;
}

type LinkProps = ComponentProps<typeof Link>;
export function ButtonLink({
  variant = "primary",
  size,
  className,
  ...props
}: LinkProps & {
  variant?: "primary" | "ink" | "line" | "quiet";
  size?: "sm";
}) {
  return (
    <Link
      {...props}
      className={cx(
        "btn",
        `btn-${variant}`,
        size === "sm" && "btn-sm",
        className,
      )}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  as: As = "h2",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cx("max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <As className="text-3xl md:text-4xl">{title}</As>
      {children && (
        <p className="mt-3 text-ink-2 text-base md:text-lg">{children}</p>
      )}
    </div>
  );
}

/** Inline notice with an icon-free left rule. Used for sample-data and eligibility statements. */
export function Notice({
  tone = "default",
  title,
  children,
  className,
}: {
  tone?: "default" | "sample" | "warning" | "info";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const border = {
    default: "border-line-strong",
    sample: "border-ochre",
    warning: "border-warning",
    info: "border-sky",
  }[tone];
  const bg = {
    default: "bg-paper-2",
    sample: "bg-ochre-tint/60",
    warning: "bg-warning-tint/60",
    info: "bg-sky-tint/50",
  }[tone];
  return (
    <div
      role="note"
      className={cx("border-l-4 px-4 py-3 text-sm", border, bg, className)}
    >
      {title && <p className="font-semibold text-ink">{title}</p>}
      <div className="text-ink-2">{children}</div>
    </div>
  );
}
