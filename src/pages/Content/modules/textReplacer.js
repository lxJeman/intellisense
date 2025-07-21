/**
 * Text Replacer Module
 * Handles safe text replacement without disrupting user typing
 */

class TextReplacer {
  constructor() {
    this.undoStack = new Map(); // Store undo history per element
    this.maxUndoHistory = 10;
  }

  /**
   * Safely replace text in an element while preserving caret position
   */
  replaceText(element, newText, options = {}) {
    const {
      preserveSelection = true,
      addToUndo = true,
      animateChange = false,
    } = options;

    try {
      const originalText = this.getElementText(element);
      const originalSelection = preserveSelection
        ? this.getSelection(element)
        : null;

      // Store undo information
      if (addToUndo) {
        this.addToUndoStack(element, originalText, originalSelection);
      }

      // Apply text change
      this.setElementText(element, newText);

      // Restore or adjust selection
      if (preserveSelection && originalSelection) {
        this.adjustSelection(element, originalSelection, originalText, newText);
      }

      // Animate change if requested
      if (animateChange) {
        this.animateTextChange(element);
      }

      // Trigger events to notify other listeners
      this.triggerChangeEvents(element);

      return true;
    } catch (error) {
      console.error('❌ Text replacement failed:', error);
      return false;
    }
  }

  /**
   * Replace text with diff-based approach for minimal disruption
   */
  replaceTextWithDiff(element, newText, options = {}) {
    const originalText = this.getElementText(element);
    const diff = this.calculateDiff(originalText, newText);

    if (diff.changes.length === 0) {
      return false; // No changes needed
    }

    // Apply changes in reverse order to maintain positions
    const selection = this.getSelection(element);
    let adjustedSelection = { ...selection };

    for (let i = diff.changes.length - 1; i >= 0; i--) {
      const change = diff.changes[i];
      this.applyDiffChange(element, change);

      // Adjust selection based on change
      adjustedSelection = this.adjustSelectionForChange(
        adjustedSelection,
        change
      );
    }

    // Restore adjusted selection
    this.setSelection(element, adjustedSelection);

    return true;
  }

  /**
   * Insert text at current cursor position
   */
  insertTextAtCursor(element, textToInsert) {
    const selection = this.getSelection(element);
    const currentText = this.getElementText(element);

    const beforeCursor = currentText.substring(0, selection.start);
    const afterCursor = currentText.substring(selection.end);
    const newText = beforeCursor + textToInsert + afterCursor;

    this.replaceText(element, newText, {
      preserveSelection: false,
      addToUndo: true,
    });

    // Set cursor after inserted text
    const newCursorPos = selection.start + textToInsert.length;
    this.setSelection(element, { start: newCursorPos, end: newCursorPos });
  }

  /**
   * Replace word at cursor position
   */
  replaceWordAtCursor(element, newWord) {
    const selection = this.getSelection(element);
    const currentText = this.getElementText(element);

    // Find word boundaries around cursor
    const wordBounds = this.findWordBoundaries(currentText, selection.start);

    if (wordBounds) {
      const beforeWord = currentText.substring(0, wordBounds.start);
      const afterWord = currentText.substring(wordBounds.end);
      const newText = beforeWord + newWord + afterWord;

      this.replaceText(element, newText, { addToUndo: true });

      // Set cursor after replaced word
      const newCursorPos = wordBounds.start + newWord.length;
      this.setSelection(element, { start: newCursorPos, end: newCursorPos });

      return true;
    }

    return false;
  }

  /**
   * Undo last text change
   */
  undo(element) {
    const elementId = this.getElementId(element);
    const undoHistory = this.undoStack.get(elementId);

    if (!undoHistory || undoHistory.length === 0) {
      return false;
    }

    const lastState = undoHistory.pop();

    // Restore text and selection without adding to undo
    this.replaceText(element, lastState.text, {
      preserveSelection: false,
      addToUndo: false,
    });

    if (lastState.selection) {
      this.setSelection(element, lastState.selection);
    }

    return true;
  }

  /**
   * Get text content from various element types
   */
  getElementText(element) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return element.value;
    } else if (element.contentEditable === 'true') {
      return element.textContent || element.innerText || '';
    }
    return '';
  }

  /**
   * Set text content for various element types
   */
  setElementText(element, text) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = text;
    } else if (element.contentEditable === 'true') {
      element.textContent = text;
    }
  }

  /**
   * Get current selection/cursor position
   */
  getSelection(element) {
    try {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        return {
          start: element.selectionStart || 0,
          end: element.selectionEnd || 0,
        };
      } else if (element.contentEditable === 'true') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          return {
            start: range.startOffset,
            end: range.endOffset,
          };
        }
      }
    } catch (error) {
      console.warn('Could not get selection:', error);
    }

    return { start: 0, end: 0 };
  }

  /**
   * Set selection/cursor position
   */
  setSelection(element, selection) {
    try {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.setSelectionRange(selection.start, selection.end);
      } else if (element.contentEditable === 'true') {
        const range = document.createRange();
        const windowSelection = window.getSelection();

        const textNode = element.firstChild || element;
        const maxLength = textNode.textContent?.length || 0;

        range.setStart(textNode, Math.min(selection.start, maxLength));
        range.setEnd(textNode, Math.min(selection.end, maxLength));

        windowSelection.removeAllRanges();
        windowSelection.addRange(range);
      }
    } catch (error) {
      console.warn('Could not set selection:', error);
    }
  }

  /**
   * Adjust selection after text replacement
   */
  adjustSelection(element, originalSelection, originalText, newText) {
    // Simple adjustment - could be enhanced with more sophisticated logic
    const lengthDiff = newText.length - originalText.length;

    let newStart = originalSelection.start;
    let newEnd = originalSelection.end;

    // If text was inserted before cursor, adjust position
    if (lengthDiff !== 0) {
      newStart = Math.max(0, originalSelection.start + lengthDiff);
      newEnd = Math.max(0, originalSelection.end + lengthDiff);
    }

    // Ensure selection is within bounds
    const maxLength = newText.length;
    newStart = Math.min(newStart, maxLength);
    newEnd = Math.min(newEnd, maxLength);

    this.setSelection(element, { start: newStart, end: newEnd });
  }

  /**
   * Find word boundaries around a position
   */
  findWordBoundaries(text, position) {
    const wordRegex = /\b\w+\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      if (
        position >= match.index &&
        position <= match.index + match[0].length
      ) {
        return {
          start: match.index,
          end: match.index + match[0].length,
          word: match[0],
        };
      }
    }

    return null;
  }

  /**
   * Calculate diff between two texts
   */
  calculateDiff(oldText, newText) {
    // Simple diff implementation - could be enhanced with proper diff algorithm
    const changes = [];

    if (oldText !== newText) {
      changes.push({
        type: 'replace',
        start: 0,
        end: oldText.length,
        oldText: oldText,
        newText: newText,
      });
    }

    return { changes };
  }

  /**
   * Apply a single diff change
   */
  applyDiffChange(element, change) {
    const currentText = this.getElementText(element);
    const beforeChange = currentText.substring(0, change.start);
    const afterChange = currentText.substring(change.end);
    const newText = beforeChange + change.newText + afterChange;

    this.setElementText(element, newText);
  }

  /**
   * Adjust selection for a diff change
   */
  adjustSelectionForChange(selection, change) {
    const lengthDiff = change.newText.length - (change.end - change.start);

    let newStart = selection.start;
    let newEnd = selection.end;

    if (selection.start >= change.end) {
      newStart += lengthDiff;
    } else if (selection.start >= change.start) {
      newStart = change.start + change.newText.length;
    }

    if (selection.end >= change.end) {
      newEnd += lengthDiff;
    } else if (selection.end >= change.start) {
      newEnd = change.start + change.newText.length;
    }

    return { start: newStart, end: newEnd };
  }

  /**
   * Add state to undo stack
   */
  addToUndoStack(element, text, selection) {
    const elementId = this.getElementId(element);

    if (!this.undoStack.has(elementId)) {
      this.undoStack.set(elementId, []);
    }

    const history = this.undoStack.get(elementId);
    history.push({ text, selection, timestamp: Date.now() });

    // Limit history size
    if (history.length > this.maxUndoHistory) {
      history.shift();
    }
  }

  /**
   * Trigger change events
   */
  triggerChangeEvents(element) {
    // Trigger input event
    element.dispatchEvent(new Event('input', { bubbles: true }));

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Animate text change
   */
  animateTextChange(element) {
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';

    setTimeout(() => {
      element.style.backgroundColor = '';
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, 300);
  }

  /**
   * Get element identifier
   */
  getElementId(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase() + '-' + Date.now();
  }

  /**
   * Clear undo history for element
   */
  clearUndoHistory(element) {
    const elementId = this.getElementId(element);
    this.undoStack.delete(elementId);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      elementsWithUndo: this.undoStack.size,
      totalUndoStates: Array.from(this.undoStack.values()).reduce(
        (sum, history) => sum + history.length,
        0
      ),
      maxUndoHistory: this.maxUndoHistory,
    };
  }
}

export { TextReplacer };
