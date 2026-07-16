---
name: Level Up Fitness
description: An image-led Kenyan fitness marketplace connecting training, nutrition, recovery, and gear.
colors:
  kinetic-coral: "#F2553D"
  botanical-ink: "#14231D"
  mineral-blue: "#3F6E8C"
  training-white: "#FFFFFF"
  canvas: "#F6F8F5"
  botanical-mist: "#E9EEEA"
  muted-text: "#46564F"
  border: "#CDD6D0"
typography:
  display:
    fontFamily: "Anybody, Arial Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 7vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Anybody, Arial Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Anybody, Arial Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  surface: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.kinetic-coral}"
    textColor: "{colors.botanical-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.kinetic-coral}"
    textColor: "{colors.botanical-ink}"
    rounded: "{rounded.md}"
  button-soft:
    backgroundColor: "{colors.training-white}"
    textColor: "{colors.botanical-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "40px"
  input:
    backgroundColor: "{colors.training-white}"
    textColor: "{colors.botanical-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.training-white}"
    textColor: "{colors.botanical-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Level Up Fitness

## Overview

**Creative North Star: “The Nairobi Training Atelier”**

Level Up Fitness feels like a bright Nairobi training studio with a broad care team, not a software catalogue wearing gym imagery. The redesigned index pairs mineral-white daylight, botanical structure, kinetic-coral actions, expressive condensed display type, and clear transactional states. Its strongest qualities are the connected service story, responsive compositions, complete loading/error/empty states, and direct routes from discovery to purchase or booking.

The index rejects its previous formula of elevated cards, 24–32px radii, tracked eyebrows, purple actions, and equal-column grids. Each offer now earns its own composition while preserving functional clarity and taking only pacing, whitespace, and image-led storytelling cues from Core Atelier.

**Key Characteristics:**

- Image-led editorial pacing supported by concise, specific copy.
- A bright mineral canvas with botanical structure, one coral action color, and restrained mineral-blue support.
- Clear commerce and booking paths with complete loading, empty, error, and success states.
- Asymmetric layouts that distinguish training, care, social proof, and products.
- Kenyan context expressed through real people, locations, prices, and services.

**The One Journey Rule.** Training, nutrition, physiotherapy, membership, and equipment must read as connected stages of care rather than unrelated product categories.

**The 1280 Rule.** Public content stays within the existing 80rem maximum width, with 16px mobile and 24px tablet/desktop side padding. Prose remains within 65–75 characters.

## Colors

The committed palette pairs a kinetic coral action field with botanical ink, a mineral-white daylight canvas, and restrained mineral blue.

### Primary

- **Kinetic Coral:** The primary brand field and action color for conversion, emphasis, and connected-care sections.

### Secondary

- **Botanical Ink:** The authority color for display type, dark structural surfaces, and high-contrast sections.
- **Mineral Blue:** A restrained support tone for featured membership and care-related emphasis.

### Neutral

- **Training White:** Raised surfaces, form panels, cards, and inverse text.
- **Canvas:** The mineral-white page background and quietest surface.
- **Botanical Mist:** Secondary controls, skeletons, and grouped content.
- **Muted Text:** Supporting copy on light backgrounds.
- **Border:** Dividers and control outlines only where structure cannot be communicated by spacing.

**The Committed Coral Rule.** Kinetic Coral may carry a whole purposeful section, but within neutral sections it is reserved for action, focus, and essential emphasis.

**The No Fake Gradient Rule.** Compatibility variables remain flat fills. Do not introduce coral-to-blue gradients or gradient text.

**The Contrast Rule.** Body and placeholder text must reach 4.5:1; large text and essential graphical controls must reach 3:1. Never reduce opacity until copy becomes ornamental.

## Typography

**Display Font:** Anybody (with Arial Narrow and system sans-serif fallback)  
**Body Font:** Atkinson Hyperlegible Next (with system sans-serif fallback)

**Character:** Anybody supplies athletic width and strong physical presence; Atkinson Hyperlegible Next keeps commerce, booking, and supporting copy exceptionally readable.

### Hierarchy

- **Display** (800, up to 5.75rem, 0.92): Homepage hero only; balance lines and never exceed 6rem.
- **Headline** (700, 2.25rem, 1.15): Primary section and route headings.
- **Title** (600, 1.25rem, 1.25): Product, program, plan, and service titles.
- **Body** (400, 1rem, 1.6): Explanations and descriptive content; cap prose at 65–75ch.
- **Label** (600, 0.875rem, 1.25): Buttons, compact metadata, and controls. Use sentence case by default.

**The One Eyebrow Rule.** A small uppercase tracked label may orient one major page hero. Repeating it above every section is prohibited.

**The Data Rule.** Prices, counts, dates, and durations use tabular numerals so scanning remains stable as values update.

**The Real Hierarchy Rule.** Use size, weight, placement, and whitespace before color. Coral headings on every card flatten hierarchy instead of creating it.

## Elevation

The current system uses cool navy-tinted shadows and tonal layering. Low elevation combines a subtle 1–3px ambient shadow with white surfaces; high elevation uses a broad 30px shadow for heroes, featured plans, and hover. This vocabulary is coherent in color but over-applied through the global `card-elevated` pattern.

### Shadow Vocabulary

- **Ambient low** (`0 1px 2px rgb(17 28 48 / 0.04), 0 1px 3px rgb(17 28 48 / 0.06)`): Small floating navigation and controls.
- **Editorial lift** (`0 10px 30px -12px rgb(17 28 48 / 0.18)`): One focal image, sticky summary, or selected commercial tier per viewport.
- **Coral focus edge** (`0 0 0 1px rgb(242 85 61 / 0.28)`): Supplemental accent edge; never the only focus indicator.

**The Flat-by-Default Rule.** Most public content sits directly on the canvas. Elevation communicates overlap, stickiness, selection, or interaction—not the mere existence of a section.

**The Single Light Rule.** Shadows fall downward and remain navy-tinted. Do not mix hard black shadows, glow halos, and ambient shadows on the same screen.

## Components

Components are direct and task-oriented. They inherit the current Radix primitives and Tailwind v4 token layer but should avoid presenting every content group as a floating rounded card.

### Buttons

- **Shape:** Compact controls use gently curved 8px corners; standard actions use 12px corners. Full pills are reserved for tags, not actions.
- **Primary:** Kinetic Coral with Botanical Ink text, semibold weight, and 10px by 20px padding. This pairing reaches 4.77:1 contrast.
- **Hover / Focus / Active:** Hover shifts tone and may rise no more than 2px; active returns to the baseline with a subtle 0.98 scale. Focus uses a visible 2px ring with offset. Transitions run 150–250ms and respect reduced motion.
- **Secondary / Ghost / Tertiary:** Soft white buttons support secondary actions; text links handle low-priority navigation. Do not pair filled and ghost buttons by reflex in every section.

### Chips

- **Style:** 8px corners, compact padding, sentence case, and neutral fill. Use pills only when the chip represents a filter or status with a rounded semantic shape.
- **State:** Selected chips use Kinetic Coral plus a non-color cue; status chips use semantic color and explicit text.

### Cards / Containers

- **Corner Style:** 12–16px for reusable cards. The existing 24–32px route-level radii are legacy and must not spread.
- **Background:** Training White on Canvas; Botanical Ink is reserved for high-emphasis brand surfaces.
- **Shadow Strategy:** Flat by default; use ambient low only when elevation communicates hierarchy.
- **Border:** Use either a low-contrast border or a shadow, never both as decoration.
- **Internal Padding:** 16px compact, 24px standard, and 40px only for large editorial containers.

### Inputs / Fields

- **Style:** Training White or transparent background, 1px Border outline, 8px corners, 36–44px height depending on context.
- **Focus:** 2px deep-coral ring with visible offset. Do not use a color-only border change.
- **Error / Disabled:** Place direct error copy beside the field; preserve readable disabled text and do not rely on opacity alone.

### Navigation

The public navigation is sticky, width-constrained, and marks the active route. Desktop uses a horizontal list; mobile collapses to a controlled menu. Preserve route awareness, close the mobile menu after navigation, and expose expanded state with `aria-expanded`. The brand mark remains compact so navigation never competes with the hero.

### Loading, Empty, and Error States

Use shape-matched skeletons for content collections. Reserve small inline progress indicators for button mutations; page-level circular spinners are prohibited. Empty states must identify the next useful action. Error states use direct language, a retry when recovery is possible, and a route back when it is not.

### Marketplace Sections

Programs, plans, care services, testimonials, and products require different compositions. Programs may use image-led split rows; plans need aligned comparison anatomy; care services should foreground practitioner and location; testimonials should use one focused reflection or an irregular editorial wall; products may remain a dense commerce grid.

## Do's and Don'ts

### Do:

- **Do** make the index page the primary brand surface and give it one dominant conversion path.
- **Do** borrow Core Atelier’s editorial pacing, confident whitespace, image-led storytelling, and direct booking paths without copying its identity.
- **Do** use Kinetic Coral as a committed brand field or for action, focus, selection, and essential emphasis.
- **Do** replace repeated spinners with skeletons shaped like the content they represent.
- **Do** show real Nairobi context, KES pricing, practitioner credentials, locations, and credible member outcomes.
- **Do** align plan features, prices, and calls to action across comparison layouts.
- **Do** provide hover, focus-visible, active, disabled, loading, empty, error, and success states for every interactive pattern.
- **Do** use `min-height: 100dvh` for full-screen authentication and error layouts, with a safe fallback.
- **Do** preserve WCAG 2.2 AA contrast, keyboard access, reduced motion, and meaningful alt text.

### Don't:

- **Don't** use generic purple SaaS landing-page patterns, repetitive equal-card grids, neon gym aggression, stock-photo transformation clichés, or decorative glassmorphism.
- **Don't** make every service compete at the same visual volume.
- **Don't** apply 24–32px radii to cards, sections, images, inputs, and buttons indiscriminately.
- **Don't** combine a 1px border with a wide soft shadow on the same element as decoration.
- **Don't** repeat tiny uppercase tracked eyebrows above every section.
- **Don't** use gradient text, coral-to-blue gradients, or fake gradient variables as a reason to add visual effects.
- **Don't** use Lucide icons as the primary personality of every card; photography, typography, and content should carry the brand.
- **Don't** use page-level circular spinners when the eventual layout is known.
- **Don't** use generic claims such as “premium,” “beautifully simple,” or “next level” without specific evidence.
- **Don't** leave legal links pointing to the homepage, omit a skip link, use empty alt text on meaningful program imagery, or ship mobile menu buttons without expanded-state semantics.
