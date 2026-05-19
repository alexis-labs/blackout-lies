"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type OrnateFrameProps = {
  title?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function OrnateFrame({
  title,
  eyebrow,
  icon: Icon,
  children,
  className = "",
  contentClassName = "",
}: OrnateFrameProps) {
  return (
    <section className={`ornate-frame ${className}`}>
      <span className="corner corner-tl" aria-hidden="true" />
      <span className="corner corner-tr" aria-hidden="true" />
      <span className="corner corner-bl" aria-hidden="true" />
      <span className="corner corner-br" aria-hidden="true" />
      {(title || eyebrow) && (
        <header className="ornate-header">
          <div>
            {eyebrow && <p className="ornate-eyebrow">{eyebrow}</p>}
            {title && (
              <h2 className="ornate-title">
                {Icon && <Icon size={17} strokeWidth={1.8} />}
                {title}
              </h2>
            )}
          </div>
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
