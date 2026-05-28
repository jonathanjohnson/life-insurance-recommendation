"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PhoneCTA } from "@/components/ui/PhoneCTA";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: MobileNavLink[];
  phoneNumber: string;
  phoneDisplay: string;
  className?: string;
}

export function MobileNav({
  links,
  phoneNumber,
  phoneDisplay,
  className,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className={cn(className)}
        >
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-lg">Menu</DialogTitle>
        <nav className="mt-2 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t pt-4">
          <PhoneCTA
            phoneNumber={phoneNumber}
            displayNumber={phoneDisplay}
            location="mobile-menu"
            variant="primary"
            size="lg"
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
