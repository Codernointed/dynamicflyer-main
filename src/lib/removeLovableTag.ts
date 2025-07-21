
/**
 * Utility to remove the Lovable branding tag from the page
 * With enhanced safety checks to prevent DOM manipulation errors
 */
export function removeLovableTag() {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Use MutationObserver to safely handle DOM changes
  const setupObserver = () => {
    try {
      if (typeof MutationObserver === 'undefined') return;
      
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldCheck = true;
            break;
          }
        }
        
        if (shouldCheck) {
          setTimeout(removeElements, 100);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
      });
      
      // Cleanup observer after some time to avoid performance issues
      setTimeout(() => observer.disconnect(), 15000);
      
      return observer;
    } catch (e) {
      console.log('Observer setup error:', e);
      return null;
    }
  };

  // Safe element removal with proper parent-child verification
  const safeRemoveElement = (element: Element) => {
    try {
      if (!element || !element.parentNode) return;
      
      // Ensure the parent-child relationship is valid
      const parent = element.parentNode;
      let isChild = false;
      
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i] === element) {
          isChild = true;
          break;
        }
      }
      
      if (isChild) {
        parent.removeChild(element);
      }
    } catch (e) {
      // Just log the error and continue - don't let it break the app
      console.log('Element removal error (non-critical):', e);
    }
  };

  // Find and remove elements that match Lovable branding
  const removeElements = () => {
    try {
      if (!document || !document.body) return;
      
      // Target specific elements with lovable in their attributes
      const selectors = [
        'a[href*="lovable"]',
        'div[class*="lovable"]',
        'div[id*="lovable"]',
        'span[class*="lovable"]',
        'button[class*="lovable"]',
        '[data-lovable]',
        'iframe[src*="lovable"]',
        'iframe.lov'
      ];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length) {
            elements.forEach(safeRemoveElement);
          }
        } catch (e) {
          // Non-critical error, just log
          console.log(`Error with selector "${selector}":`, e);
        }
      });
      
      // Look for fixed position elements at corners that might be branding
      try {
        const divs = document.querySelectorAll('div');
        divs.forEach(div => {
          try {
            const style = window.getComputedStyle(div);
            if (
              style.position === 'fixed' && 
              (style.bottom === '0px' || style.bottom === '5px' || style.bottom === '10px') &&
              (style.right === '0px' || style.right === '5px' || style.right === '10px')
            ) {
              // Check if it has an iframe child or lovable-related class/id
              const hasLovableIdentifier = 
                div.id?.includes('lovable') || 
                div.className?.includes('lovable') ||
                div.querySelector('iframe') !== null;
              
              if (hasLovableIdentifier) {
                safeRemoveElement(div);
              }
            }
          } catch (e) {
            // Silent fail - skip problematic elements
          }
        });
      } catch (e) {
        console.log('Error processing divs:', e);
      }
    } catch (e) {
      console.log('Error in removeElements:', e);
    }
  };

  // Main execution with safety delays
  const executeRemoval = () => {
    // Initial delay to ensure DOM is ready
    setTimeout(() => {
      removeElements();
      
      // Set up observer for dynamic elements
      const observer = setupObserver();
      
      // Follow-up check after short delay to catch any missed elements
      setTimeout(() => {
        removeElements();
      }, 2000);
    }, 500);
  };

  // Execute after document is ready
  if (document.readyState === 'complete') {
    executeRemoval();
  } else {
    // Use the safe load event
    window.addEventListener('load', executeRemoval, { once: true });
  }
}
