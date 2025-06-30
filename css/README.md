# Kanva Quotes - CSS Architecture

This directory follows a modern, modular CSS architecture for better maintainability and scalability. The structure is organized by feature and function, making it easier to manage styles across the application.

## Directory Structure

```
css/
├── admin/           # Admin-specific styles
│   ├── dashboard.css
│   ├── forms.css
│   └── tables.css
├── components/      # Reusable UI components
│   ├── alerts.css
│   ├── buttons.css
│   ├── cards.css
│   ├── modals.css
│   ├── product-tile.css
│   ├── tabs.css
│   └── tables.css
├── integrations/    # Third-party integration styles
│   ├── copper-crm.css
│   └── hybrid.css
├── layouts/         # Layout-specific styles
│   ├── footer.css
│   ├── grid.css
│   ├── header.css
│   └── sidebar.css
├── utilities/       # Variables, mixins, and helper classes
│   ├── _animations.css
│   ├── _base.css
│   ├── _utilities.css
│   └── _variables.css
└── main.css         # Main entry point (imports all other files)
```

## File Organization

### Admin (`/admin`)
Styles specific to the admin interface.
- `dashboard.css` - Admin dashboard layout and widgets
- `forms.css` - Admin form styles and validation
- `tables.css` - Data tables and grid views

### Components (`/components`)
Contains styles for reusable UI components. Each component is self-contained.
- `alerts.css` - Notification and alert styles
- `buttons.css` - Button styles and variants
- `cards.css` - Card components and panels
- `modals.css` - Modal dialogs and overlays
- `product-tile.css` - Product card component with hover/active states
- `tabs.css` - Tab navigation components
- `tables.css` - Standard table styles

### Integrations (`/integrations`)
Styles for third-party integrations.
- `copper-crm.css` - Copper CRM interface styles
- `hybrid.css` - Hybrid app integration styles

### Layouts (`/layouts`)
Page-level layout styles.
- `footer.css` - Footer styles and layout
- `grid.css` - Grid systems and responsive layouts
- `header.css` - Header and navigation styles
- `sidebar.css` - Sidebar navigation styles

### Utilities (`/utilities`)
Global variables, mixins, and helper classes.
- `_animations.css` - Keyframe animations and transitions
- `_base.css` - Base styles and resets
- `_utilities.css` - Utility classes (spacing, typography, etc.)
- `_variables.css` - CSS custom properties and design tokens

## Usage

### Import Order
Always import files in this specific order to ensure proper cascade:
1. Utilities (variables, base, etc.)
2. Components
3. Layouts
4. Admin/Integration specific styles

### Main Import Files
- `main.css` - Main entry point (imports all other files)

### Best Practices
1. **Use CSS Custom Properties** for theming and consistent values
2. **Follow BEM Naming** for component classes
3. **Mobile-First** responsive design approach
4. **Document** complex styles with comments
5. **Keep Specificity Low** to avoid !important overrides
6. **Use Utility Classes** for common patterns

### Dark Mode Support
All components should include dark mode variants using the `[data-theme="dark"]` selector.

### Performance Considerations
- Minimize use of expensive CSS properties (box-shadow, blur, etc.)
- Use CSS containment for complex components
- Leverage CSS variables for runtime theming
- Consider critical CSS for above-the-fold content
   4. Legacy styles

2. **Adding New Styles**
   - Create a new file in the appropriate directory
   - Import it in `main.css`
   - Follow the BEM naming convention for new components

3. **Best Practices**
   - Use CSS custom properties for theming
   - Keep selectors shallow (max 2 levels deep)
   - Use utility classes for one-off styles
   - Document complex components with comments
