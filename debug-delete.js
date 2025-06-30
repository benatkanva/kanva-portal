// Debug script for testing delete functionality
console.log('🐛 Debug script loaded');

// Add a global click listener to debug all clicks
document.addEventListener('click', function(e) {
    console.log('🖱️ Global click on:', e.target);
    console.log('🖱️ Target classes:', e.target.className);
    console.log('🖱️ Target closest .remove-line-item:', e.target.closest('.remove-line-item'));
    
    if (e.target.closest('.remove-line-item')) {
        console.log('🎯 FOUND DELETE BUTTON CLICK!');
        const button = e.target.closest('.remove-line-item');
        const lineId = button.dataset.lineId;
        console.log('🔑 Line ID from button:', lineId);
        
        // Try to call remove function directly
        if (window.ProductManager && window.ProductManager.removeLine) {
            console.log('📞 Calling ProductManager.removeLine directly');
            window.ProductManager.removeLine(lineId);
        } else {
            console.error('❌ ProductManager.removeLine not available');
        }
    }
});

// Function to test if buttons exist
function testDeleteButtons() {
    const buttons = document.querySelectorAll('.remove-line-item');
    console.log('🔍 Found delete buttons:', buttons.length);
    buttons.forEach((btn, index) => {
        console.log(`🔸 Button ${index + 1}:`, btn);
        console.log(`🔸 Button ${index + 1} data-line-id:`, btn.dataset.lineId);
    });
}

// Function to debug lineItems array
function debugLineItems() {
    console.log('🔍 Current lineItems array:', window.calculator?.lineItems);
    if (window.calculator?.lineItems) {
        window.calculator.lineItems.forEach((item, index) => {
            console.log(`🔸 Item ${index + 1}:`, item);
            console.log(`🔸 Item ${index + 1} ID:`, item.id);
            console.log(`🔸 Item ${index + 1} type:`, typeof item, item.constructor?.name);
        });
    }
}

// Make functions available globally
window.testDeleteButtons = testDeleteButtons;
window.debugLineItems = debugLineItems;

console.log('🎯 Debug script ready. Run testDeleteButtons() to check buttons.');
