---
name: Literary Precision
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#574142'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8a7172'
  outline-variant: '#ddbfc0'
  surface-tint: '#a73645'
  primary: '#a73645'
  on-primary: '#ffffff'
  primary-container: '#ed6b78'
  on-primary-container: '#620019'
  inverse-primary: '#ffb2b6'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#675c5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#9f9293'
  on-tertiary-container: '#342c2d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b6'
  on-primary-fixed: '#40000d'
  on-primary-fixed-variant: '#871e2f'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#eedfe0'
  tertiary-fixed-dim: '#d2c3c4'
  on-tertiary-fixed: '#211a1b'
  on-tertiary-fixed-variant: '#4e4445'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1280px
---

## Brand & Style

This design system is anchored in the concept of "Literary Precision," a philosophy that marries the intellectual rigor of publishing with a warm, accessible modernism. The brand personality is clear, focused, and sophisticated, designed to appeal to authors and creators who value both aesthetic clarity and functional excellence.

The visual style is **Minimalist** with a **Modern** edge. It utilizes expansive whitespace to allow content to breathe, mirroring the margins of a well-designed manuscript. By moving away from traditional indigo and corporate blues, the system adopts a warm coral-driven palette that feels human and inviting without sacrificing professional authority. The use of technical typography (Geist) against soft, warm colors creates a "Digital Atelier" vibe—precise tools for creative minds.

## Colors

The color strategy centers on a signature Coral primary hue, extracted from the brand’s core identity. This color is used purposefully for calls to action, progress indicators, and key brand moments.

- **Primary (Coral):** Used for primary buttons, active states, and high-priority highlights.
- **Secondary (Charcoal):** Provides a grounding contrast for text and structural elements, ensuring high legibility.
- **Tertiary (Blush Tint):** A very soft wash of the primary color, used for surface-level backgrounds, hover states, and subtle grouping.
- **Neutral:** A deep, near-black neutral is used for body text to maintain the "ink on paper" contrast, while a range of cool grays handles borders and disabled states.

The default mode is light, emphasizing a clean, airy environment that reflects the clarity of a fresh page.

## Typography

The design system utilizes **Geist** exclusively to achieve a mono-spaced influence within a highly legible sans-serif framework. This choice reinforces the "precision" aspect of the brand, offering a technical yet elegant character.

Headlines should utilize tighter letter-spacing and heavier weights to create a strong visual anchor. Body text is set with generous line-height to ensure maximum readability for long-form content. Labels and utility text leverage medium weights to maintain hierarchy without needing excessive size. For mobile devices, display and large headline sizes scale down to prevent awkward wrapping while maintaining their relative weight.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model based on an 8px base unit. This ensures a consistent vertical rhythm and predictable spacing between elements.

- **Desktop:** A 12-column grid with 24px gutters. Page margins are set to a generous 64px to create a premium, editorial feel. 
- **Tablet:** Transitions to an 8-column grid with 20px gutters.
- **Mobile:** A 4-column grid with 16px gutters and 20px side margins.

Content should be grouped using logical spacing increments (e.g., 16px for related items, 40px for distinct sections). This system prioritizes "macro-whitespace" to prevent the interface from feeling cluttered, directing the user's focus toward the literary content.

## Elevation & Depth

Hierarchy in this design system is primarily conveyed through **Tonal Layers** and **Low-Contrast Outlines**. Rather than aggressive shadows, the system uses subtle shifts in background color (using the Tertiary Blush Tint) to define surface containers.

When depth is required for interactive elements like modals or dropdowns, **Ambient Shadows** are used. These shadows are extra-diffused, with a 10% opacity using a tint of the primary Coral to keep the depth feeling warm rather than "dirty" gray. Cards and input fields utilize a subtle 1px border in a soft neutral tone, reinforcing the clean, minimalist aesthetic.

## Shapes

The shape language is defined by a **Rounded** (0.5rem) standard. This level of corner radius strikes a balance between the sharp precision of the "slash" logo and a friendly, modern interface.

- **Standard (0.5rem):** Applied to buttons, input fields, and small cards.
- **Large (1rem):** Applied to main content containers and featured sections.
- **Pill:** Reserved exclusively for tags, chips, and badges to distinguish them from actionable buttons.

This consistent rounding ensures that even with a minimalist layout, the UI feels approachable and soft to the touch.

## Components

### Buttons
Primary buttons use the solid Coral background with white text. Secondary buttons use a transparent background with a 1px Coral border. Hover states for both involve a subtle darkening of the hue or the addition of a Tertiary Blush background for ghost variants.

### Input Fields
Inputs are minimalist, featuring a 1px light gray border that transitions to Coral on focus. Labels sit clearly above the field in Geist Medium. Error states should use a distinct red, but maintain the same 8px spacing logic.

### Cards
Cards are used to group related information (e.g., book details). They should have no shadow by default, instead using a 1px border or a very light tonal background. On hover, they may lift slightly with a soft ambient shadow.

### Chips & Tags
Chips are pill-shaped and use the Tertiary Blush color with Primary Coral text. They are used for categorization (e.g., "Poetry", "New Release") and should never be confused with buttons.

### Lists & Navigation
Navigation links use Geist Medium with a Coral underline indicator for active states. List items should be separated by whitespace rather than heavy dividers, using 16px or 24px gaps to maintain the minimalist rhythm.