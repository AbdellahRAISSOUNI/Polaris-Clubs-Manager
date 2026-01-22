# Apple-Inspired Design System

This document serves as a comprehensive guide for maintaining consistent Apple-inspired design across all pages in the Polaris Clubs Manager application. Use this as context when updating or creating new pages.

## Design Philosophy

The design system is inspired by Apple's design language, emphasizing:
- **Clarity**: Clean, uncluttered interfaces with clear hierarchy
- **Elegance**: Subtle animations and smooth transitions
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Depth**: Layered shadows and elevation
- **Mobile-First**: Responsive design that feels native on mobile devices
- **Accessibility**: High contrast ratios and clear visual feedback

## Color Palette

### Backgrounds
- **Light Mode**: `bg-gradient-to-br from-gray-50 via-white to-gray-50`
- **Dark Mode**: `bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`

### Glass Effects
- **Standard Glass**: `.glass` class
  - Light: `rgba(255, 255, 255, 0.8)` with `backdrop-blur(20px)`
  - Dark: `rgba(0, 0, 0, 0.5)` with `backdrop-blur(20px)`

- **Strong Glass**: `.glass-strong` class
  - Light: `rgba(255, 255, 255, 0.9)` with `backdrop-blur(24px)`
  - Dark: `rgba(0, 0, 0, 0.6)` with `backdrop-blur(24px)`

- **Liquid Glass**: `.liquid-glass` class
  - Animated radial gradient overlay
  - Use for stat cards and featured content
  - Subtle animated blur effect

### Text Colors
- **Primary**: `text-gray-900 dark:text-gray-100`
- **Secondary**: `text-muted-foreground`
- **Gradient Text**: `bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent`

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

### Headings
- **H1**: `text-3xl sm:text-4xl font-semibold tracking-tight` (with gradient text)
- **H2**: `text-2xl sm:text-3xl font-semibold tracking-tight`
- **H3**: `text-xl sm:text-2xl font-medium`

### Body Text
- **Regular**: `text-sm sm:text-base`
- **Small**: `text-xs sm:text-sm`
- **Muted**: `text-muted-foreground`

## Spacing & Layout

### Container Padding
- **Mobile**: `p-4 sm:p-6 lg:p-8`
- **Card Padding**: `p-4 sm:p-6` or `p-5 sm:p-6`
- **Gap Between Elements**: `gap-4 sm:gap-6`

### Border Radius
- **Cards**: `rounded-3xl` (24px)
- **Buttons**: `rounded-2xl` (16px)
- **Inputs**: `rounded-2xl` (16px)
- **Small Elements**: `rounded-xl` (12px)

### Max Width
- **Page Container**: `max-w-7xl mx-auto`
- **Dialog/Modal**: `sm:max-w-[540px]`

## Component Patterns

### Buttons

#### Primary Button (Dark)
```tsx
<Button className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-2xl shadow-apple transition-apple">
  Button Text
</Button>
```

#### Primary Button (Gradient)
```tsx
<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple">
  Button Text
</Button>
```

#### Glass Button
```tsx
<Button className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple">
  Button Text
</Button>
```

#### Button with Animation
```tsx
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Button className="...">
    Button Text
  </Button>
</motion.div>
```

### Cards

#### Standard Card
```tsx
<Card className="glass shadow-apple border-0 rounded-3xl">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

#### Stat Card (with Liquid Glass)
```tsx
<Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
  <CardContent className="p-5 sm:p-6">...</CardContent>
</Card>
```

#### Card with Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <Card className="glass shadow-apple border-0 rounded-3xl">
    ...
  </Card>
</motion.div>
```

### Inputs

#### Search Input
```tsx
<Input
  className="pl-10 h-11 rounded-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-apple transition-apple focus:bg-white dark:focus:bg-gray-900/90"
  placeholder="Search..."
/>
```

#### Standard Input
```tsx
<Input className="rounded-2xl glass border-0 shadow-apple" />
```

#### Select/Dropdown
```tsx
<SelectTrigger className="h-10 text-xs rounded-2xl glass border-0 shadow-apple">
  <SelectValue />
</SelectTrigger>
```

### Dialogs & Modals

#### Dialog Overlay
- Background: `bg-black/20 backdrop-blur-md` (NOT `bg-black/80`)
- This creates the Apple-style blurred background effect

#### Dialog Content
```tsx
<DialogContent className="p-0 overflow-hidden w-[100dvw] h-[100dvh] max-w-none rounded-none sm:rounded-3xl sm:h-[90vh] sm:max-h-[90vh] sm:max-w-[540px] glass-strong shadow-apple-lg">
  ...
</DialogContent>
```

#### Dialog Header
```tsx
<DialogHeader className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl p-5 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
  <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
    Title
  </DialogTitle>
</DialogHeader>
```

### Badges

```tsx
<Badge className="glass border-0 shadow-apple">
  Status
</Badge>
```

### Scrollable Containers

```tsx
<div className="max-h-[500px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
  Content
</div>
```

## Shadows

### Standard Shadow
```css
.shadow-apple
```
- Light: `0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)`
- Dark: `0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2)`

### Large Shadow
```css
.shadow-apple-lg
```
- Light: `0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)`
- Dark: `0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)`

### Hover Shadow
- Use `hover:shadow-apple-lg` for interactive elements

## Animations

### Transitions
- **Standard**: `.transition-apple` (0.3s cubic-bezier(0.4, 0, 0.2, 1))
- **Hover Lift**: `.hover-lift` (translateY(-2px) on hover)

### Framer Motion Patterns

#### Fade In
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

#### Slide In from Top
```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

#### Stagger Children
```tsx
<AnimatePresence>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

#### Button Hover/Tap
```tsx
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Button>Click</Button>
</motion.div>
```

**IMPORTANT**: Avoid `scale` transforms on list items that might cause scrollbars. Use `y: -1` or shadow changes instead.

## Mobile Responsiveness

### Breakpoints
- **Mobile**: Default (no prefix)
- **Tablet**: `sm:` (640px+)
- **Desktop**: `lg:` (1024px+)

### Mobile-Specific Patterns

#### Mobile Search (Hidden on Desktop)
```tsx
<div className="md:hidden mb-2">
  <Input className="..." />
</div>
```

#### Responsive Padding
```tsx
className="p-4 sm:p-6 lg:p-8"
```

#### Responsive Text
```tsx
className="text-sm sm:text-base"
```

#### Responsive Spacing
```tsx
className="gap-3 sm:gap-4"
```

### Mobile Scrolling
- Always use `overscroll-contain` to prevent scroll chaining
- Add `WebkitOverflowScrolling: 'touch'` for smooth iOS scrolling
- Use `scrollbar-thin` classes for custom scrollbars

### Touch Feedback
- Use `whileTap={{ scale: 0.98 }}` for buttons on mobile
- The `.hover-lift:active` class provides iOS-like touch feedback

## Page Layout Structure

### Standard Page Container
```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-8 sm:pb-12 overflow-x-hidden">
  <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    {/* Page Content */}
  </div>
</div>
```

### Header Section
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
    Page Title
  </h1>
</motion.div>
```

## Common Patterns

### Filter Section (Collapsible)
```tsx
<AnimatePresence>
  {showFilters && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="mb-4 sm:mb-6 overflow-hidden"
    >
      <Card className="glass shadow-apple border-0 rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          {/* Filter Content */}
        </CardContent>
      </Card>
    </motion.div>
  )}
</AnimatePresence>
```

### Stat Cards Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
  {stats.map((stat, index) => (
    <motion.div
      key={stat.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          {/* Stat Content */}
        </CardContent>
      </Card>
    </motion.div>
  ))}
</div>
```

### List Items (No Hover Scale)
```tsx
<motion.div
  key={item.id}
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3, delay: index * 0.1 }}
  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg cursor-pointer transition-apple"
  onClick={handleClick}
>
  {/* Item Content */}
</motion.div>
```

## CSS Utility Classes

All utility classes are defined in `app/globals.css`:

- `.glass` - Standard glass effect
- `.glass-strong` - Stronger glass effect
- `.liquid-glass` - Animated liquid glass effect
- `.shadow-apple` - Standard Apple-style shadow
- `.shadow-apple-lg` - Large Apple-style shadow
- `.transition-apple` - Smooth transition
- `.hover-lift` - Hover lift effect
- `.scrollbar-thin` - Custom thin scrollbar

## Implementation Checklist

When updating or creating a new page, ensure:

- [ ] Page uses gradient background (`bg-gradient-to-br from-gray-50...`)
- [ ] Cards use `glass` or `liquid-glass` with `rounded-3xl`
- [ ] Buttons use `rounded-2xl` with appropriate styling
- [ ] Shadows use `shadow-apple` or `shadow-apple-lg`
- [ ] Transitions use `transition-apple`
- [ ] Mobile responsiveness with `sm:` and `lg:` breakpoints
- [ ] Animations use Framer Motion with appropriate easing
- [ ] Dialog overlays use `bg-black/20 backdrop-blur-md` (NOT dark backgrounds)
- [ ] Scrollable containers use `overscroll-contain` and `scrollbar-thin`
- [ ] Text uses Apple system fonts
- [ ] Headings use gradient text where appropriate
- [ ] No hover scale effects on list items (use shadow changes instead)
- [ ] Touch feedback on mobile (scale 0.98 on tap)

## Examples

### Complete Page Example
See `app/admin/dashboard/page.tsx` for a complete implementation example.

### Component Example
See `components/reservation-details.tsx` for a complete dialog/modal example.

## Notes

- **Never use `bg-black/80` for dialog overlays** - Use `bg-black/20 backdrop-blur-md` instead
- **Avoid `scale` transforms on scrollable list items** - They cause scrollbar issues
- **Always use `overscroll-contain`** on scrollable containers for better mobile UX
- **Liquid glass should be used sparingly** - Only on stat cards or featured content
- **Maintain consistent spacing** - Use the spacing scale (4, 6, 8, etc.)
- **Test on mobile** - Always verify mobile responsiveness and touch interactions
