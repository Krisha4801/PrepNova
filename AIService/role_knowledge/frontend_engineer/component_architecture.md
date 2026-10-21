# Frontend Component Architecture and Modern Design Patterns

## Core Principles
Frontend engineering requires building modular, accessible, testable, and maintainable user interfaces using modern frameworks (such as React, Vue, or Next.js).

### Component Decomposition
1. Presentational vs Container components: separate UI rendering logic from data fetching and state side-effects.
2. Compound Components: build flexible, composable component interfaces (e.g., `<Select><Option /></Select>`) using React Context or slot-based mechanisms.
3. Custom Hooks: encapsulate reusable business logic, DOM event listeners, and side-effects outside of view hierarchies.
4. Render Props & Higher-Order Components: historical and specialized patterns for cross-cutting view concerns.

### Design Systems and Reusability
- Design Tokens: standardize typography, spacing units, color scales, and elevation tokens across CSS variables or theme providers.
- Atomic Design Methodology: structure component libraries from atoms (buttons, inputs) to molecules (search bars), organisms (headers, data tables), and page templates.
- Accessibility (a11y): WCAG 2.1 AA compliance, ARIA attributes, semantic HTML elements, keyboard navigation, focus trapping in modals, and screen reader announcements.
- Resilient Component Contracts: robust TypeScript interfaces for props, controlled vs uncontrolled component patterns, and sensible default props.

### Technical Interview Discussion Points
- When to choose controlled versus uncontrolled form inputs and form libraries (React Hook Form, Formik).
- Designing a scalable modal / dialog system that handles portals, z-index stacking, and focus traps.
- Trade-offs between CSS Modules, Tailwind utility classes, CSS-in-JS, and vanilla CSS variables.
