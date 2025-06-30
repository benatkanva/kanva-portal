# CSS Migration Guide

This document outlines the steps to migrate from the old monolithic CSS structure to the new modular architecture.

## Migration Status

✅ Core structure created  
✅ Base utilities migrated  
✅ Component styles migrated  
✅ Layout styles migrated  
⏳ Legacy styles being migrated  
⏳ Documentation in progress  

## Migration Steps

1. **Update HTML**
   - Keep using existing class names
   - No immediate changes required to HTML structure

2. **New Components**
   - Use the new component classes when creating new elements
   - Reference the component documentation for usage examples

3. **Deprecation Notice**
   - Old styles in `legacy/` will be gradually removed
   - Update existing code to use new component classes when possible

## Breaking Changes

- Some utility class names have been updated for consistency
- Color variables now use HSL format
- Responsive prefixes have been standardized

## Common Tasks

### Adding a New Component
1. Create a new file in `/components`
2. Follow the BEM naming convention
3. Import the file in `main.css`

### Theming
Use CSS custom properties in `utilities/variables.css` for theming.

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE11 (with polyfills)
