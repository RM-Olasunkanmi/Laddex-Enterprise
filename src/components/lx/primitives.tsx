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

/** Storefront stock line: a coloured dot plus words, lighter than a tag. */
export function StockLine({
  status,
  className,
}: {
  status: StockStatus;
  className?: string;
}) {
  const tone =
    status === "in-stock"
      ? "stock-in"
      : status === "low-stock"
        ? "stock-low"
        : "stock-out";
  return (
    <span className={cx("stock", tone, className)}>{STOCK_LABEL[status]}</span>
  );
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
  variant?: "primary" | "ink" | "line" | "quiet" | "on-dark" | "line-on-dark";
  size?: "sm" | "lg";
}) {
  return (
    <Link
      {...props}
      className={cx(
        "btn",
        `btn-${variant}`,
        size && `btn-${size}`,
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
      <As className="text-[2rem] leading-[1.08] md:text-[2.75rem]">{title}</As>
      {children && <p className="lede mt-4">{children}</p>}
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
    info: "border-forest",
  }[tone];
  const bg = {
    default: "bg-paper-2",
    sample: "bg-ochre-tint/60",
    warning: "bg-warning-tint/60",
    info: "bg-forest-tint/60",
  }[tone];
  return (
    <div
      role="note"
      className={cx("rounded-r-md border-l-[3px] px-4 py-3 text-sm", border, bg, className)}
    >
      {title && <p className="font-semibold text-ink">{title}</p>}
      <div className="text-ink-2">{children}</div>
    </div>
  );
}
