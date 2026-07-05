"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarContextProps {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextProps>({
  state: "expanded",
  open: true,
  setOpen: () => {},
  toggleSidebar: () => {},
  isMobile: false,
});

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const setOpen = React.useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      setUncontrolledOpen(value);
    },
    [onOpenChange]
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const state = open ? "expanded" : "collapsed";

  return (
    <SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ side = "left", children, className, ...props }, ref) => {
    const { open, setOpen, isMobile } = useSidebar();

    if (isMobile) {
      return (
        <>
          {open && (
            <div
              className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
              onClick={() => setOpen(false)}
            />
          )}
          <div
            ref={ref}
            className={cn(
              "fixed inset-y-0 z-50 flex h-full w-[280px] flex-col bg-[#140E12] text-[#D3C2AB] border-r border-[#28242E] transition-transform duration-300",
              side === "left" ? "left-0" : "right-0",
              open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full",
              className
            )}
            {...props}
          >
            {children}
          </div>
        </>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-full flex flex-col bg-[#140E12] text-[#D3C2AB] border-r border-[#28242E] transition-all duration-300 shrink-0 overflow-hidden",
          className
        )}
        style={{ width: open ? "280px" : "72px" }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 border-b border-[#28242E] transition-all duration-300",
        open ? "p-4" : "p-2 items-center",
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        open ? "p-4" : "p-2",
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 border-t border-[#28242E] transition-all duration-300",
        open ? "p-4" : "p-2 items-center",
        className
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
));
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn("text-xs font-medium text-[#D3C2AB]/60 px-2 py-1", className)}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-col gap-1 list-none p-0 m-0", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("flex relative", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean;
    variant?: "default" | "outline";
    icon?: React.ReactNode;
  }
>(({ className, isActive, variant = "default", icon, children, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <button
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-md text-sm font-medium transition-colors",
        open ? "px-2 py-1.5 justify-start" : "px-0 py-2 justify-center",
        "hover:bg-[#28242E] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D3C2AB]/30",
        isActive && "bg-[#28242E] text-[#D3C2AB]",
        variant === "outline" && "border border-[#28242E]",
        className
      )}
      title={!open && typeof children === "string" ? children : undefined}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {open && <span className="truncate">{children}</span>}
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn("h-px bg-[#28242E] my-2", className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2 text-[#D3C2AB] hover:bg-[#28242E] transition-colors",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 4.5H16M2 9H16M2 13.5H16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 flex flex-col min-w-0", className)}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";
