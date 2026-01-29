import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override spacing scale (8pt grid with 4pt sub-steps)
    spacing: {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "5": "20px",
      "6": "24px",
      "7": "32px",
      "8": "40px",
      "9": "48px",
      "10": "64px",
      "11": "44px", // Table row height (Tailwind default for h-11)
      "12": "48px",
      "14": "56px",
      "16": "64px",
      "20": "80px",
      "24": "96px",
      "28": "112px",
      "32": "128px",
      "36": "144px",
      "40": "160px",
      "44": "176px",
      "48": "192px",
      "52": "208px",
      "56": "224px",
      "60": "240px",
      "64": "256px",
      "72": "288px",
      "80": "320px",
      "96": "384px",
      "px": "1px",
      "0.5": "2px",
      "1.5": "6px",
      "2.5": "10px",
      "3.5": "14px",
    },
    extend: {
      colors: {
        // === NEUTRALS ===
        "canvas": "#F5F7FB",
        "surface": "#FFFFFF",
        "surface-alt": "#F9FAFC",
        "border-subtle": "#E6EAF2",
        "border-strong": "#D6DCE8",
        "text-primary": "#111827",
        "text-secondary": "#4B5563",
        "text-muted": "#6B7280",
        "icon-default": "#6B7280",
        "icon-strong": "#374151",

        // === BRAND ===
        "primary": {
          50: "#E6F0FF",
          600: "#0061FF",
          700: "#0050D6",
          border: "#80B0FF",
          DEFAULT: "#0061FF",
        },

        // === SEMANTIC ===
        "success": {
          50: "#ECFDF5",
          600: "#10B981",
          700: "#059669",
        },
        "warning": {
          50: "#FFFBEB",
          600: "#F59E0B",
        },
        "danger": {
          50: "#FEF2F2",
          600: "#EF4444",
        },
        "info": {
          50: "#F0F9FF",
          600: "#0EA5E9",
        },

        // === DATA VIZ ===
        "viz": {
          blue: "#0061FF",
          green: "#10B981",
          teal: "#14B8A6",
          indigo: "#6366F1",
          gridline: "#E9EDF5",
          "axis-text": "#6B7280",
        },

        // === DARK CHROME (Topbar) ===
        "topbar": {
          bg: "#0F172A",
          text: "#E5E7EB",
          icon: "#CBD5E1",
        },

        // === TABLE ===
        "table": {
          hover: "#F3F6FB",
        },
        "selected-row": "#EEF2FF",

        // === shadcn/ui compatibility (mapped to project tokens) ===
        background: "#F5F7FB",
        foreground: "#111827",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        secondary: {
          DEFAULT: "#F9FAFC",
          foreground: "#111827",
        },
        muted: {
          DEFAULT: "#F9FAFC",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#F9FAFC",
          foreground: "#111827",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "#E6EAF2",
        input: "#E6EAF2",
        ring: "#80B0FF",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(16, 24, 40, 0.06)",
        md: "0 4px 10px rgba(16, 24, 40, 0.10)",
        lg: "0 12px 24px rgba(16, 24, 40, 0.14)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        // Typography scale from design system
        "display": ["28px", { lineHeight: "34px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h1": ["24px", { lineHeight: "30px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h2": ["20px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h3": ["16px", { lineHeight: "22px", letterSpacing: "0", fontWeight: "600" }],
        "body": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-strong": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "caption": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "400" }],
        "label": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
