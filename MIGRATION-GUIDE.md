# Migration Guide: calculator-consolidated.js to Modular Structure

This guide explains the changes made to refactor the monolithic `calculator-consolidated.js` into a modular structure.

## Key Changes

1. **New Directory Structure**
   ```
   js/
   ├── calculator/
   │   ├── base-calculator.js    # Shared utilities and base class
   │   ├── pricing-calculator.js  # Pricing and calculations
   │   └── main-calculator.js     # Main application logic
   └── integrations/
       └── copper-crm.js       # Copper CRM integration
   ```

2. **Core Modules**
   - `base-calculator.js`: Contains shared utilities and base functionality
   - `pricing-calculator.js`: Handles all pricing-related calculations
   - `main-calculator.js`: Main application class that coordinates between modules
   - `copper-crm.js`: Extracted Copper CRM integration

3. **Dependency Management**
   - Added Axios for HTTP requests
   - Better error handling and debugging
   - Improved initialization flow

## How to Update Your Code

1. **Update Script References**
   Replace the old script references in your HTML:
   ```html
   <!-- Old -->
   <script src="js/calculator-consolidated.js"></script>
   
   <!-- New -->
   <script src="js/calculator/base-calculator.js"></script>
   <script src="js/calculator/pricing-calculator.js"></script>
   <script src="js/calculator/main-calculator.js"></script>
   <script src="js/integrations/copper-crm.js"></script>
   ```

2. **API Changes**
   - The main calculator instance is still available as `window.calculator`
   - All public methods remain the same for backward compatibility
   - Internal methods have been reorganized into appropriate modules

3. **New Features**
   - Better error handling and user feedback
   - Improved code organization and maintainability
   - Easier to test individual components
   - Better separation of concerns

## Testing the Migration

1. Load the application in your browser
2. Open the browser's developer console (F12)
3. Check for any errors during initialization
4. Test all calculator functionality:
   - Adding/removing products
   - Updating quantities
   - Calculating totals
   - Admin features (if applicable)

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Verify all script files are loading correctly
3. Ensure the data files are in the correct location
4. Check network requests for failed API calls

## Next Steps

1. Consider adding unit tests for each module
2. Implement proper dependency injection
3. Add TypeScript for better type safety
4. Implement proper state management (e.g., Redux or Vuex)
