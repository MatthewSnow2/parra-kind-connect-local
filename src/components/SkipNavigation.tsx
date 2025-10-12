/**
 * Skip Navigation Component
 *
 * WCAG 2.1 Level A - Success Criterion 2.4.1: Bypass Blocks
 * Provides keyboard users with the ability to skip repeated navigation content
 * and jump directly to main content.
 *
 * Features:
 * - Keyboard accessible (visible on focus)
 * - High contrast styling for visibility
 * - Large touch target (44x44px minimum)
 * - Screen reader friendly
 * - Senior-friendly font size (18px)
 *
 * @component
 * @example
 * <SkipNavigation />
 */

import { cn } from "@/lib/utils";

interface SkipNavigationProps {
  mainContentId?: string;
  className?: string;
}

const SkipNavigation = ({
  mainContentId = "main-content",
  className
}: SkipNavigationProps) => {
  return (
    <a
      href={`#${mainContentId}`}
      className={cn(
        // Positioning - hidden until focused
        "fixed top-0 left-0 z-[100]",
        "translate-y-[-100%]",
        "focus:translate-y-0",

        // Visual styling
        "bg-accent text-accent-foreground",
        "px-6 py-4",
        "text-lg font-semibold",
        "rounded-br-lg",
        "shadow-lg",

        // Accessibility
        "focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2",

        // Transitions
        "transition-transform duration-200 ease-in-out",

        // Ensure minimum touch target
        "min-h-[44px] min-w-[44px]",

        // High contrast for visibility
        "border-2 border-foreground",

        className
      )}
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default SkipNavigation;
