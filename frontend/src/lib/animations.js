/**
 * Shared Framer Motion animation presets for the MILZO project.
 * Import these in any component to keep animations consistent.
 */

// ─── Transition Presets ─────────────────────────────────────
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const smoothSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

export const gentleSpring = {
  type: 'spring',
  stiffness: 120,
  damping: 14,
};

export const easeTransition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const slowEase = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// ─── Variant Presets ────────────────────────────────────────

/** Fade in + slide up — pages, cards, sections */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Simple opacity fade — backdrops, overlays */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Scale in from slightly smaller — modals, dropdowns, tooltips */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Slide in from left — sidebar panel */
export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

/** Slide up from bottom — chat widget, bottom sheets */
export const slideInUp = {
  initial: { opacity: 0, y: 40, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.96 },
};

/** Dropdown from top — notification panels, profile menus */
export const dropdownVariants = {
  initial: { opacity: 0, scale: 0.92, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: -8 },
};

// ─── Stagger Container Variants ─────────────────────────────

/** Parent container that staggers its children */
export const staggerContainer = (staggerDelay = 0.06) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

/** Child item for stagger — fade+slide up */
export const staggerChild = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Child item for stagger — fade+slide from left */
export const staggerChildLeft = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Child item for stagger — fade+slide from right */
export const staggerChildRight = {
  initial: { opacity: 0, x: 16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Page Transition Wrapper ────────────────────────────────

/** Standard page transition variants for route changes */
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// ─── Interactive Hover / Tap Helpers ────────────────────────

export const hoverLift = {
  whileHover: { y: -3, scale: 1.01 },
  whileTap: { scale: 0.98 },
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const tapShrink = {
  whileTap: { scale: 0.96 },
};
