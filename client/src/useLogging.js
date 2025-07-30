// client/src/useLogging.js
import { useEffect, useRef } from 'react';
import loggingService from './loggingService.js';

export const useLogging = (stage) => {
  const textareaRef = useRef(null);
  const lastCursorPosition = useRef(0);

  // Set the current stage when the hook is used
  useEffect(() => {
    if (stage) {
      loggingService.setStage(stage);
    }
  }, [stage]);

  // Get cursor position from textarea
  const getCursorPosition = () => {
    if (textareaRef.current) {
      return textareaRef.current.selectionStart;
    }
    return lastCursorPosition.current;
  };

  // Get text selection from textarea
  const getTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = textareaRef.current.value.substring(start, end);
      return { start, end, selectedText };
    }
    return { start: 0, end: 0, selectedText: '' };
  };

  // Log keystroke events
  const logKeystroke = (event) => {
    const cursorPosition = getCursorPosition();
    const textSelection = getTextSelection();
    
    loggingService.logKeystroke(
      event.key,
      event.keyCode,
      cursorPosition,
      textSelection.selectedText || null
    );
    
    lastCursorPosition.current = cursorPosition;
  };

  // Log paste events
  const logPaste = (event) => {
    const cursorPosition = getCursorPosition();
    const pastedText = event.clipboardData?.getData('text') || '';
    
    loggingService.logPaste(pastedText, cursorPosition);
  };

  // Log cut events
  const logCut = (event) => {
    const cursorPosition = getCursorPosition();
    const textSelection = getTextSelection();
    
    loggingService.logCut(textSelection.selectedText, cursorPosition);
  };

  // Log copy events
  const logCopy = (event) => {
    const cursorPosition = getCursorPosition();
    const textSelection = getTextSelection();
    
    loggingService.logCopy(textSelection.selectedText, cursorPosition);
  };

  // Log delete events (backspace, delete)
  const logDelete = (event) => {
    const cursorPosition = getCursorPosition();
    const textSelection = getTextSelection();
    const deleteType = event.key === 'Backspace' ? 'backspace' : 'delete';
    
    loggingService.logDelete(deleteType, cursorPosition, textSelection.selectedText || null);
  };

  // Log text selection changes
  const logTextSelection = () => {
    const textSelection = getTextSelection();
    if (textSelection.selectedText) {
      loggingService.logTextSelection(
        textSelection.start,
        textSelection.end,
        textSelection.selectedText
      );
    }
  };

  // Log button clicks
  const logButtonClick = (buttonId, context = {}) => {
    loggingService.logButtonClick(buttonId, context);
  };

  // Log API calls
  const logApiCall = (apiType, prompt, response, status, duration = null) => {
    loggingService.logApiCall(apiType, prompt, response, status, duration);
  };

  // Log errors
  const logError = (errorType, errorMessage, stack = null) => {
    loggingService.logError(errorType, errorMessage, stack);
  };

  // Set up textarea event listeners
  const setupTextareaLogging = (textareaElement) => {
    if (!textareaElement) return;

    textareaRef.current = textareaElement;

    const handleKeyDown = (event) => {
      // Log special keys
      if (['Backspace', 'Delete', 'Enter', 'Tab'].includes(event.key)) {
        if (['Backspace', 'Delete'].includes(event.key)) {
          logDelete(event);
        } else {
          logKeystroke(event);
        }
      }
    };

    const handleKeyPress = (event) => {
      // Log regular character keys
      if (event.key.length === 1) {
        logKeystroke(event);
      }
    };

    const handlePaste = (event) => {
      logPaste(event);
    };

    const handleCut = (event) => {
      logCut(event);
    };

    const handleCopy = (event) => {
      logCopy(event);
    };

    const handleSelect = () => {
      logTextSelection();
    };

    textareaElement.addEventListener('keydown', handleKeyDown);
    textareaElement.addEventListener('keypress', handleKeyPress);
    textareaElement.addEventListener('paste', handlePaste);
    textareaElement.addEventListener('cut', handleCut);
    textareaElement.addEventListener('copy', handleCopy);
    textareaElement.addEventListener('select', handleSelect);

    // Return cleanup function
    return () => {
      textareaElement.removeEventListener('keydown', handleKeyDown);
      textareaElement.removeEventListener('keypress', handleKeyPress);
      textareaElement.removeEventListener('paste', handlePaste);
      textareaElement.removeEventListener('cut', handleCut);
      textareaElement.removeEventListener('copy', handleCopy);
      textareaElement.removeEventListener('select', handleSelect);
    };
  };

  return {
    logKeystroke,
    logPaste,
    logCut,
    logCopy,
    logDelete,
    logTextSelection,
    logButtonClick,
    logApiCall,
    logError,
    setupTextareaLogging,
    getCursorPosition,
    getTextSelection
  };
}; 