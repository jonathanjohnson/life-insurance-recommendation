import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  tight?: boolean;
  as?: "section" | "div" | "main" | "article" | "header" | "footer";
}

export function SectionContainer({
  tight,
  as: Tag = "section",
  className,
  children,
  ...props
}: SectionContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        tight ? "py-6" : "py-12",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
