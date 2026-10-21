# Frontend Performance Optimization and Core Web Vitals

## Core Web Vitals (CWV)
Google's user-centric performance metrics for measuring web health:
1. Largest Contentful Paint (LCP): measures loading performance (target < 2.5s). Improved by optimizing critical rendering path, preloading hero images, and modern CDNs.
2. Interaction to Next Paint (INP): measures page responsiveness to user input (target < 200ms). Improved by breaking long tasks with `requestIdleCallback` or web workers.
3. Cumulative Layout Shift (CLS): measures visual stability (target < 0.1). Prevented by setting explicit dimensions on images and dynamic embeds.

## Rendering Pipeline Optimization
- Virtual DOM Reconciliation: avoiding unnecessary re-renders using `React.memo`, `useMemo`, and `useCallback` selectively where computations are non-trivial.
- Virtualization & Windowing: rendering only visible viewport rows for large datasets (e.g., `react-window`, `react-virtualized`) to minimize DOM node overhead.
- Code Splitting & Dynamic Imports: route-based and component-based code chunking using `React.lazy` and `Suspense`.
- Asset Delivery: modern image formats (AVIF, WebP), responsive `srcset`, font display swapping (`font-display: swap`), and HTTP/2 or HTTP/3 multiplexing.

## Rendering Paradigms
- Client-Side Rendering (CSR): single-page app architecture; fast transitions after initial bundle load, but slower First Contentful Paint.
- Server-Side Rendering (SSR): dynamic HTML generation per request; excellent SEO and fast FCP, requires server infrastructure.
- Static Site Generation (SSG): pre-rendered HTML at build time; optimal CDN edge caching.
- Incremental Static Regeneration (ISR): background cache revalidation of static pages on cadence or on-demand.
