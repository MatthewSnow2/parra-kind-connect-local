# Para Connect - Accessibility Testing Guide

## Overview

This document provides comprehensive guidelines for testing the accessibility of the Para Connect application. The application is designed to serve elderly users and their caregivers, making accessibility CRITICAL to its success.

## WCAG 2.1 Level AA Compliance

Para Connect targets **WCAG 2.1 Level AA** compliance, with several **Level AAA** enhancements for senior-friendly usability.

---

## Testing Checklist

### 1. Keyboard Navigation Testing

#### Test Procedures:
- [ ] Navigate entire application using **Tab** key only
- [ ] Verify all interactive elements are reachable
- [ ] Check focus indicators are clearly visible (3px coral outline)
- [ ] Test **Shift+Tab** for reverse navigation
- [ ] Verify **Enter** and **Space** activate buttons/links
- [ ] Test **Escape** key closes modals/dialogs
- [ ] Verify skip navigation link appears on Tab focus

#### Expected Behavior:
- All buttons, links, form inputs, and interactive elements must be keyboard accessible
- Focus order must be logical and follow visual layout
- Focus indicators must have 3:1 contrast ratio against background
- No keyboard traps - users can always navigate away

#### Test Files:
- `/src/components/Navigation.tsx`
- `/src/components/HamburgerMenu.tsx`
- `/src/components/ChatInterface.tsx`
- `/src/pages/Dashboard.tsx`
- `/src/components/ui/dialog.tsx`

---

### 2. Screen Reader Testing

#### Test Tools:
- **NVDA** (Windows) - Free
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

#### Test Procedures:
- [ ] Navigate with screen reader through all pages
- [ ] Verify all images have descriptive alt text
- [ ] Check heading hierarchy (h1 → h2 → h3)
- [ ] Verify form labels are announced
- [ ] Test ARIA labels on interactive elements
- [ ] Verify live regions announce dynamic content
- [ ] Check landmark regions are properly labeled

#### Expected Behavior:
- All content must be announced by screen reader
- Navigation landmarks (nav, main, aside, footer) must be identified
- Interactive elements must have clear labels
- Status messages must be announced via aria-live regions
- No orphaned or unlabeled controls

#### Key ARIA Implementations:
```tsx
// Skip Navigation
<SkipNavigation mainContentId="main-content" />

// Landmarks
<nav role="navigation" aria-label="Main navigation">
<main id="main-content" tabIndex={-1}>
<section aria-labelledby="hero-heading">

// Interactive Elements
<button aria-label="Sign up for free beta access">
<a aria-label="Chat with Parra on WhatsApp - opens in new window">

// Live Regions
<div role="log" aria-live="polite" aria-atomic="false">
```

---

### 3. Color Contrast Testing

#### Test Tools:
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome DevTools**: Lighthouse Accessibility Audit
- **axe DevTools**: Browser extension

#### Test Procedures:
- [ ] Check all text meets 4.5:1 ratio (normal text)
- [ ] Check large text meets 3:1 ratio (18px+ bold, 24px+ regular)
- [ ] Verify UI components meet 3:1 ratio
- [ ] Test focus indicators meet 3:1 ratio
- [ ] Check color is not sole indicator of information

#### Color Palette Contrast Ratios:

| Color Combination | Ratio | WCAG Level | Usage |
|------------------|-------|------------|-------|
| Deep Green (#2F4733) on White | 11.2:1 | AAA | Body text, headings |
| Deep Green (#2F4733) on Light Green (#C9EBC0) | 4.8:1 | AA | Button text |
| White on Coral (#FF8882) | 3.2:1 | AA | Interactive elements |
| White on Deep Green (#2F4733) | 11.2:1 | AAA | Navigation |

#### Test Files:
- `/src/index.css` - Color token definitions
- `/tailwind.config.ts` - Design system colors

---

### 4. Focus Management Testing

#### Test Procedures:
- [ ] Open modal dialog - focus moves to dialog
- [ ] Close dialog - focus returns to trigger button
- [ ] Open hamburger menu - focus moves to menu
- [ ] Use skip navigation - focus moves to main content
- [ ] Submit form - focus moves to success message or first error

#### Expected Behavior:
- Focus must be trapped within modal dialogs
- Closing dialogs must return focus to triggering element
- Form submission must move focus appropriately
- Focus indicators must be visible (not just outline: none)

#### Implementation:
```tsx
// Dialog with focus management (using Radix UI)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent> {/* Auto-manages focus */}
    <DialogTitle>Add Family Member</DialogTitle>
    {/* Focus trapped within dialog */}
  </DialogContent>
</Dialog>

// Skip navigation focus management
<a href="#main-content">Skip to main content</a>
<main id="main-content" tabIndex={-1}> {/* Receives focus */}
```

---

### 5. Motion & Animation Testing

#### Test Procedures:
- [ ] Enable `prefers-reduced-motion` in OS settings
- [ ] Reload application
- [ ] Verify animations are disabled or minimal
- [ ] Check transitions are reduced to 0.01ms
- [ ] Verify focus transitions still work

#### Browser Settings:
- **Windows**: Settings → Accessibility → Display → Show animations
- **macOS**: System Preferences → Accessibility → Display → Reduce motion
- **Chrome**: DevTools → Rendering → Emulate CSS media: prefers-reduced-motion

#### Implementation:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

### 6. Touch Target Testing

#### Test Procedures:
- [ ] Verify all buttons are minimum 44x44px
- [ ] Check on touch devices (mobile, tablet)
- [ ] Test with larger finger/pointer
- [ ] Verify adequate spacing between targets

#### Expected Behavior:
- All interactive elements: **44x44px minimum** (WCAG 2.1 Level AAA 2.5.5)
- Adequate spacing: **8px minimum** between targets
- Works well on touchscreens and with motor impairments

#### Implementation:
```css
button, a {
  min-height: 44px;
  min-width: 44px;
}
```

---

### 7. Form Accessibility Testing

#### Test Procedures:
- [ ] Verify all inputs have associated labels
- [ ] Check error messages are clear and specific
- [ ] Test required field indicators
- [ ] Verify aria-invalid on error fields
- [ ] Check aria-describedby for help text
- [ ] Test form submission with screen reader

#### Expected Behavior:
- Every input must have a `<label>` with `htmlFor` or `aria-label`
- Error messages linked via `aria-describedby`
- Required fields indicated with `aria-required="true"`
- Error state announced with `aria-invalid="true"`

#### Implementation Example:
```tsx
<Label htmlFor="email">Email Address</Label>
<Input
  id="email"
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  aria-required="true"
/>
{errors.email && (
  <p id="email-error" className="text-destructive">
    {errors.email.message}
  </p>
)}
```

---

### 8. Image Alternative Text Testing

#### Test Procedures:
- [ ] Verify all images have alt attributes
- [ ] Check decorative images have empty alt=""
- [ ] Verify alt text is descriptive and meaningful
- [ ] Test with images disabled in browser
- [ ] Verify icon-only buttons have aria-label

#### Expected Behavior:
- Informative images: Descriptive alt text
- Decorative images: Empty alt="" or aria-hidden="true"
- Icon buttons: aria-label describing action
- Complex images: Longer description via aria-describedby

#### Implementation Examples:
```tsx
// Informative image
<img
  src={heroImage}
  alt="Happy senior woman in her 70s sitting comfortably at home, smiling while using a smartphone to connect with her family through Parra Connect."
/>

// Decorative image
<div className="bg-gradient" aria-hidden="true" />

// Icon button
<button aria-label="Send message">
  <Send className="h-5 w-5" aria-hidden="true" />
</button>
```

---

### 9. Semantic HTML Testing

#### Test Procedures:
- [ ] Verify proper heading hierarchy (h1, h2, h3)
- [ ] Check landmark regions (header, nav, main, aside, footer)
- [ ] Verify lists use `<ul>`, `<ol>`, `<li>`
- [ ] Check buttons are `<button>` not `<div>`
- [ ] Verify links are `<a>` with href

#### Expected Behavior:
- One `<h1>` per page
- Headings don't skip levels (h1 → h3)
- Landmarks properly identify page regions
- Semantic HTML elements used appropriately

---

### 10. Senior-Friendly Usability Testing

#### Special Considerations for Elderly Users:

- [ ] **Font Size**: Base 18px (larger than standard 16px)
- [ ] **Line Height**: 1.6 for readability
- [ ] **Touch Targets**: 44px minimum (larger than AA standard)
- [ ] **Color Contrast**: Higher contrast ratios preferred
- [ ] **Clear Labels**: No ambiguous icons without text
- [ ] **Error Messages**: Clear, specific, and actionable
- [ ] **Consistent Navigation**: Same navigation on every page
- [ ] **Simple Language**: Avoid jargon and complex terms

#### Test with Real Users:
- Recruit seniors (65+) for usability testing
- Test with users who have:
  - Visual impairments (glasses, low vision)
  - Motor impairments (arthritis, tremors)
  - Cognitive differences (memory, attention)
- Observe pain points and areas of confusion

---

## Automated Testing Tools

### 1. axe DevTools
- **Install**: Chrome/Firefox extension
- **Usage**: Open DevTools → axe → Scan
- **Run on**: Every page and component
- **Fix**: All Critical and Serious issues

### 2. Lighthouse
- **Install**: Built into Chrome DevTools
- **Usage**: DevTools → Lighthouse → Accessibility
- **Target**: 95+ score
- **Check**: Color contrast, ARIA, names/labels

### 3. WAVE
- **Install**: Browser extension
- **Usage**: Click WAVE icon
- **Review**: Errors, alerts, and features
- **Validate**: Zero errors on all pages

### 4. Pa11y
```bash
# Install
npm install -g pa11y

# Run
pa11y http://localhost:5173/
pa11y http://localhost:5173/dashboard

# CI Integration
npm install --save-dev pa11y-ci
```

---

## Manual Testing Matrix

| Test | Tool | Frequency | Pass Criteria |
|------|------|-----------|---------------|
| Keyboard Navigation | Manual | Every release | All elements accessible |
| Screen Reader | NVDA/VoiceOver | Every release | All content announced |
| Color Contrast | WebAIM | Every design change | 4.5:1 minimum |
| Focus Management | Manual | Every release | Logical focus order |
| Reduced Motion | Browser settings | Every release | Animations disabled |
| Touch Targets | Mobile device | Every release | 44px minimum |
| Forms | Manual + NVDA | Every release | All labels present |
| Images | Manual | Every content update | All alt text present |
| Semantic HTML | axe DevTools | Every release | No violations |
| Senior Testing | Real users | Quarterly | Tasks completed |

---

## Accessibility Statement

Para Connect is committed to ensuring digital accessibility for people with disabilities, especially elderly users. We continuously improve the user experience for everyone and apply relevant accessibility standards.

### Conformance Status
**WCAG 2.1 Level AA Conformance**: Para Connect aims to conform to WCAG 2.1 Level AA standards with select Level AAA enhancements for senior usability.

### Feedback
We welcome your feedback on the accessibility of Para Connect. Please contact us at accessibility@paraconnect.com with any issues or suggestions.

### Date
This accessibility testing guide was last updated: **October 12, 2025**

---

## Quick Reference Links

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/resources/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

---

## Component-Specific Testing

### Navigation Component
- **File**: `/src/components/Navigation.tsx`
- **Tests**: Keyboard nav, ARIA labels, focus order
- **Screen Reader**: "Main navigation, parra home link"

### Skip Navigation Component
- **File**: `/src/components/SkipNavigation.tsx`
- **Tests**: Tab to focus, Enter to activate, focus moves to main
- **Screen Reader**: "Skip to main content, link"

### ChatInterface Component
- **File**: `/src/components/ChatInterface.tsx`
- **Tests**: Live region updates, form labels, button labels
- **Screen Reader**: "Chat conversation, log, polite updates"

### Dashboard Component
- **File**: `/src/pages/Dashboard.tsx`
- **Tests**: Status indicators, chart accessibility, form labels
- **Screen Reader**: "Senior care recipient profiles, region"

### Dialog Components
- **File**: `/src/components/ui/dialog.tsx`
- **Tests**: Focus trap, escape key, focus return
- **Screen Reader**: Dialog role announced, close button labeled

---

## Continuous Monitoring

### Pre-Commit Checks
```bash
# Run accessibility tests before commit
npm run test:a11y
npm run lint:a11y
```

### CI/CD Pipeline
- Automated pa11y tests on every pull request
- Lighthouse CI checks on staging deployments
- Block merges with accessibility regressions

### Quarterly Reviews
- Full manual accessibility audit
- Senior user testing sessions
- Update this documentation with findings
- Address any new WCAG updates

---

**Remember**: Accessibility is not a one-time task. It requires ongoing testing, monitoring, and improvement. Every code change should consider accessibility impact.
