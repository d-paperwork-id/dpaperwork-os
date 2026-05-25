import * as React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

const Item = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-accent cursor-pointer transition-colors",
        className
      )}
      {...props}
    />
  );
});
Item.displayName = "Item";

const ItemMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "icon" | "avatar" }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("shrink-0 flex items-center justify-center", className)} {...props} />
));
ItemMedia.displayName = "ItemMedia";

const ItemContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 min-w-0", className)} {...props} />
  )
);
ItemContent.displayName = "ItemContent";

const ItemTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-medium text-foreground truncate", className)} {...props} />
  )
);
ItemTitle.displayName = "ItemTitle";

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground truncate mt-0.5", className)}
    {...props}
  />
));
ItemDescription.displayName = "ItemDescription";

const ItemTrailing = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("shrink-0 text-muted-foreground", className)}
      {...props}
    />
  )
);
ItemTrailing.displayName = "ItemTrailing";

export { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemTrailing };
