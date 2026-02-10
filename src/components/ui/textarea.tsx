import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  autoExpand?: boolean;
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, autoExpand = false, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Auto-expand logic
  React.useEffect(() => {
    if (!autoExpand) return;

    const textarea = innerRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Adjust on mount and when value changes
    adjustHeight();

    // Listen for input events to adjust height dynamically
    textarea.addEventListener('input', adjustHeight);

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [autoExpand, props.value]);

  // Handle ref forwarding
  React.useEffect(() => {
    if (typeof ref === 'function') {
      ref(innerRef.current);
    } else if (ref) {
      ref.current = innerRef.current;
    }
  }, [ref]);

  return (
    <textarea
      className={cn(
        "flex w-full bg-surface border border-border-subtle rounded-sm px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-border focus:border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        autoExpand && "resize-none overflow-hidden",
        className
      )}
      ref={innerRef}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
