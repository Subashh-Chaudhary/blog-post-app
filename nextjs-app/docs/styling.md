# Styling Architecture & Design Tokens

This document describes the design tokens, typography, CSS layouts, and animation themes of the styling engine.

---

## 1. Tailwind CSS v4 & Global CSS Integration

The application leverages **Tailwind CSS v4** alongside vanilla CSS custom variables in `/app/globals.css` to build a maintainable, high-performance styling engine:

```css
@theme {
  /* Sleek, Premium Color Palette */
  --color-primary-50: hsl(220, 100%, 97%);
  --color-primary-500: hsl(224, 76%, 48%);
  --color-primary-900: hsl(222, 47%, 11%);
  
  --color-slate-50: hsl(210, 40%, 98%);
  --color-slate-900: hsl(222, 47%, 11%);

  /* Modern Sans Typography */
  --font-sans: 'Outfit', 'Inter', system-ui, sans-serif;

  /* Smooth Animation Tokens */
  --transition-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

* **Tailwind Utility Classes**: We use utility classes for standard layout and spacing tasks, keeping CSS bundles lean and fast.
* **Component-Level CSS Modules**: For complex UI components that require precise custom layouts, we use scoped CSS Modules (`*.module.css`) to prevent styles from leaking into other parts of the application.

---

## 2. Dynamic Spacing & Responsive Grid Layouts

Layouts are designed from the ground up to be responsive, adapting fluidly across screen sizes from mobile to desktop:

* **Grid Systems**: Pages use flexible CSS grids to arrange cards and columns:
  ```html
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Grid items mount here -->
  </div>
  ```
* **Dynamic Spacing**: Spacing rules are strictly derived from our HSL spacing tokens, ensuring consistent margins and padding across all layouts.

---

## 3. Dark Mode & Interactive States

The application features built-in support for dark mode and dynamic interactive styles:

* **Glassmorphism Panels**: UI cards use semi-transparent backgrounds and backdrop filters to create a sleek, premium, layered visual hierarchy:
  ```html
  <div class="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
    <!-- Component card content -->
  </div>
  ```
* **Interactive Micro-Transitions**: Links and buttons use CSS spring transitions (`transition-all duration-300 ease-[var(--transition-spring)]`) to animate hover states smoothly, providing clean, responsive feedback to user interactions.
* **Semantic Hover States**: Buttons use color shifts on hover, styling active focus states with accessible, high-contrast outlines.
