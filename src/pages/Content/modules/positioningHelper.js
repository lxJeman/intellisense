/**
 * Positioning Helper Module
 * Advanced positioning system for UI elements using label detection and smart positioning
 */

class PositioningHelper {
  constructor() {
    this.positionCache = new Map();
    this.observers = new Map();
  }

  /**
   * Get optimal position for UI element relative to input
   * Uses label positioning as fallback for better accuracy
   */
  getOptimalPosition(element, boxWidth = 300, boxHeight = 100) {
    const elementRect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };

    // Try to find associated label for better positioning
    const labelInfo = this.findAssociatedLabel(element);

    let baseRect = elementRect;
    if (labelInfo.label) {
      const labelRect = labelInfo.label.getBoundingClientRect();
      console.log('📍 Using label for positioning:', labelInfo.text);

      // Use label position as reference if it's above the input
      if (labelRect.bottom <= elementRect.top) {
        baseRect = {
          ...elementRect,
          top: labelRect.top,
          bottom: elementRect.bottom,
          height: elementRect.bottom - labelRect.top,
        };
      }
    }

    // Calculate initial position
    let left = baseRect.left + viewport.scrollX;
    let top = baseRect.bottom + viewport.scrollY + 8;

    // Mobile-specific adjustments
    if (viewport.width < 768) {
      return this.getMobilePosition(baseRect, boxWidth, boxHeight, viewport);
    }

    // Desktop positioning with collision detection
    return this.getDesktopPosition(baseRect, boxWidth, boxHeight, viewport, {
      left,
      top,
    });
  }

  /**
   * Find associated label for an input element
   */
  findAssociatedLabel(element) {
    let label = null;
    let labelText = '';

    // Method 1: Direct label association via 'for' attribute
    if (element.id) {
      label = document.querySelector(`label[for="${element.id}"]`);
    }

    // Method 2: Parent label (input inside label)
    if (!label) {
      label = element.closest('label');
    }

    // Method 3: Previous sibling label
    if (!label) {
      let sibling = element.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === 'LABEL') {
          label = sibling;
          break;
        }
        sibling = sibling.previousElementSibling;
      }
    }

    // Method 4: Look for nearby text that might be a label
    if (!label) {
      const parent = element.parentElement;
      if (parent) {
        // Check for text nodes or spans that might be labels
        const textNodes = this.getTextNodesNear(element);
        if (textNodes.length > 0) {
          labelText = textNodes[0].textContent.trim();
        }
      }
    }

    // Method 5: Create virtual label position if none found
    if (!label && !labelText) {
      label = this.createVirtualLabel(element);
    }

    if (label) {
      labelText = label.textContent.trim();
    }

    return { label, text: labelText };
  }

  /**
   * Get text nodes near an element that might serve as labels
   */
  getTextNodesNear(element) {
    const textNodes = [];
    const parent = element.parentElement;

    if (parent) {
      const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const text = node.textContent.trim();
          return text.length > 0 && text.length < 100
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
    }

    return textNodes;
  }

  /**
   * Create a virtual label for positioning reference
   */
  createVirtualLabel(element) {
    const rect = element.getBoundingClientRect();

    // Create invisible reference element above the input
    const virtualLabel = document.createElement('div');
    virtualLabel.style.position = 'absolute';
    virtualLabel.style.left = rect.left + 'px';
    virtualLabel.style.top = rect.top - 25 + 'px';
    virtualLabel.style.width = '1px';
    virtualLabel.style.height = '1px';
    virtualLabel.style.visibility = 'hidden';
    virtualLabel.style.pointerEvents = 'none';
    virtualLabel.className = 'intellisense-virtual-label';

    document.body.appendChild(virtualLabel);

    // Clean up after 30 seconds
    setTimeout(() => {
      if (virtualLabel.parentNode) {
        virtualLabel.parentNode.removeChild(virtualLabel);
      }
    }, 30000);

    return virtualLabel;
  }

  /**
   * Mobile-optimized positioning
   */
  getMobilePosition(elementRect, boxWidth, boxHeight, viewport) {
    const padding = 10;

    let left = Math.max(
      padding,
      Math.min(
        elementRect.left + viewport.scrollX,
        viewport.width - boxWidth - padding
      )
    );

    let top = elementRect.bottom + viewport.scrollY + 8;

    // If not enough space below, position above
    if (top + boxHeight > viewport.height + viewport.scrollY - 50) {
      top = elementRect.top + viewport.scrollY - boxHeight - 8;
    }

    // Ensure minimum distance from edges
    top = Math.max(viewport.scrollY + padding, top);

    return {
      left: Math.round(left),
      top: Math.round(top),
      position: 'absolute',
    };
  }

  /**
   * Desktop positioning with collision detection
   */
  getDesktopPosition(elementRect, boxWidth, boxHeight, viewport, initialPos) {
    const padding = 20;
    let { left, top } = initialPos;

    // Horizontal collision detection
    if (left + boxWidth > viewport.width + viewport.scrollX - padding) {
      left = viewport.width + viewport.scrollX - boxWidth - padding;
    }

    if (left < viewport.scrollX + padding) {
      left = viewport.scrollX + padding;
    }

    // Vertical collision detection
    if (top + boxHeight > viewport.height + viewport.scrollY - 50) {
      // Try positioning above the element
      top = elementRect.top + viewport.scrollY - boxHeight - 8;

      // If still not enough space, position at bottom of viewport
      if (top < viewport.scrollY + padding) {
        top = viewport.height + viewport.scrollY - boxHeight - padding;
      }
    }

    return {
      left: Math.round(left),
      top: Math.round(top),
      position: 'absolute',
    };
  }

  /**
   * Enhanced positioning with scroll and resize handling
   */
  createPositionedElement(element, className, content, options = {}) {
    const {
      width = 300,
      height = 100,
      zIndex = 10000,
      autoRemove = 15000,
    } = options;

    // Remove any existing element with same class
    const existing = document.querySelector(`.${className}`);
    if (existing) {
      existing.remove();
    }

    // Create new element
    const uiElement = document.createElement('div');
    uiElement.className = className;
    uiElement.innerHTML = content;

    // Get optimal position
    const position = this.getOptimalPosition(element, width, height);

    // Apply positioning styles
    Object.assign(uiElement.style, {
      position: position.position,
      left: position.left + 'px',
      top: position.top + 'px',
      zIndex: zIndex.toString(),
      maxWidth: width + 'px',
      visibility: 'visible',
      opacity: '1',
      pointerEvents: 'auto',
    });

    // Add to DOM
    document.body.appendChild(uiElement);

    // Setup dynamic repositioning
    this.setupDynamicPositioning(uiElement, element, width, height);

    // Auto-remove
    if (autoRemove > 0) {
      setTimeout(() => {
        if (uiElement.parentNode) {
          uiElement.remove();
        }
      }, autoRemove);
    }

    console.log('📍 UI element positioned at:', position);
    return uiElement;
  }

  /**
   * Setup dynamic repositioning on scroll/resize
   */
  setupDynamicPositioning(uiElement, targetElement, width, height) {
    const updatePosition = () => {
      if (!uiElement.parentNode || !targetElement.parentNode) {
        return;
      }

      const newPosition = this.getOptimalPosition(targetElement, width, height);
      uiElement.style.left = newPosition.left + 'px';
      uiElement.style.top = newPosition.top + 'px';
    };

    // Throttled update function
    let updateTimeout;
    const throttledUpdate = () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updatePosition, 16); // ~60fps
    };

    // Add event listeners
    window.addEventListener('scroll', throttledUpdate, { passive: true });
    window.addEventListener('resize', throttledUpdate, { passive: true });

    // Cleanup when element is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === uiElement) {
            window.removeEventListener('scroll', throttledUpdate);
            window.removeEventListener('resize', throttledUpdate);
            observer.disconnect();
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Debug positioning - shows visual indicators
   */
  debugPositioning(element) {
    const labelInfo = this.findAssociatedLabel(element);
    const position = this.getOptimalPosition(element);

    console.log('🔍 Debug Positioning:', {
      element: element.tagName + (element.id ? '#' + element.id : ''),
      label: labelInfo.text || 'No label found',
      position: position,
      elementRect: element.getBoundingClientRect(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
    });

    // Create visual debug indicator
    const debugDot = document.createElement('div');
    debugDot.style.cssText = `
      position: absolute;
      left: ${position.left}px;
      top: ${position.top}px;
      width: 10px;
      height: 10px;
      background: red;
      border-radius: 50%;
      z-index: 99999;
      pointer-events: none;
    `;
    document.body.appendChild(debugDot);

    setTimeout(() => debugDot.remove(), 3000);
  }
}

export { PositioningHelper };
