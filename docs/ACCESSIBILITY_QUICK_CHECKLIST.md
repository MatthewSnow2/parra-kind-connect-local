# Para Connect - Accessibility Quick Reference Checklist

## Before Every Code Commit

### Visual Design
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Color contrast ratio ≥ 3:1 for UI components
- [ ] No information conveyed by color alone
- [ ] Touch targets minimum 44x44px

### Keyboard & Focus
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (3px coral outline)
- [ ] No keyboard traps
- [ ] Logical tab order
- [ ] Skip navigation link present

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Landmarks used (nav, main, aside, footer)
- [ ] Buttons are `<button>`, not `<div>`
- [ ] Links are `<a>` with href

### ARIA
- [ ] Images have alt text or aria-label
- [ ] Buttons have accessible names
- [ ] Form inputs have labels
- [ ] Live regions for dynamic content
- [ ] Status messages announced

### Forms
- [ ] Labels associated with inputs (htmlFor)
- [ ] Required fields marked (aria-required)
- [ ] Error messages linked (aria-describedby)
- [ ] Error states indicated (aria-invalid)

### Motion
- [ ] Respects prefers-reduced-motion
- [ ] No flashing content (< 3 per second)
- [ ] Animations can be disabled

---

## Component Checklist

### New Button Component
```tsx
<button
  aria-label="Descriptive action"
  className="min-h-[44px] min-w-[44px]"
>
  <Icon aria-hidden="true" />
  <span className="sr-only">Send</span>
</button>
```

### New Image Component
```tsx
<img
  src={image}
  alt="Descriptive alt text"
  width="40"
  height="40"
  loading="lazy"
/>
```

### New Form Input
```tsx
<Label htmlFor="email">Email</Label>
<Input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" className="text-destructive">
    {errors.email.message}
  </p>
)}
```

### New Page
```tsx
<div>
  <SkipNavigation />
  <Navigation />
  <main id="main-content" tabIndex={-1}>
    <h1>Page Title</h1>
    {/* Content */}
  </main>
  <Footer />
</div>
```

---

## Testing Commands

```bash
# Run accessibility tests
npm run test:a11y

# Lint for accessibility issues
npm run lint:a11y

# Run Lighthouse audit
npm run audit:lighthouse

# Test with pa11y
npx pa11y http://localhost:5173/
```

---

## Quick Resources

- **WCAG Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Patterns**: https://www.w3.org/WAI/ARIA/apg/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Full Documentation**: `/docs/ACCESSIBILITY_TESTING.md`
- **Audit Report**: `/docs/WCAG_2.1_AA_AUDIT_REPORT.md`

---

## Common Mistakes to Avoid

❌ `<div onClick={}>` → ✅ `<button>`
❌ `<img>` no alt → ✅ `<img alt="description">`
❌ Color only status → ✅ Color + icon + text
❌ `outline: none` → ✅ Proper focus-visible styles
❌ Unlabeled form → ✅ Label with htmlFor
❌ Keyboard trap → ✅ Allow focus escape
❌ Auto-play animation → ✅ Respect reduced motion
❌ Low contrast text → ✅ 4.5:1 ratio minimum
