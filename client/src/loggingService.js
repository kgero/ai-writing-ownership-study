// client/src/loggingService.js

import axios from 'axios';
import api from "./api.js";

class LoggingService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.participantId = this.getParticipantId();
    this.currentStage = null;
    this.stageStartTime = null;
    this.logQueue = [];
    this.isProcessing = false;
    this.batchSize = 10;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Session management
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `${this.getParticipantId()}_${Date.now()}`;
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  getParticipantId() {
    // Get participant ID from localStorage or generate one
    let participantId = localStorage.getItem('participantId');
    if (participantId) {
      return participantId;
    }
    // Generate a new participant ID if none exists
    participantId = 'p_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('participantId', participantId);
    return participantId;
  }

  // Stage management
  setStage(stage) {
    this.currentStage = stage;
    this.stageStartTime = Date.now();
  }

  getTimeFromStageStart() {
    if (!this.stageStartTime) return 0;
    return Date.now() - this.stageStartTime;
  }

  // Logging methods
  logKeystroke(key, keyCode, cursorPosition, textSelection = null) {
    this.log({
      event_type: `keystroke:${key}`,
      event_data: {
        key,
        keyCode,
        cursorPosition,
        textSelection,
        timestamp: Date.now()
      }
    });
  }

  logPaste(text, cursorPosition) {
    this.log({
      event_type: 'keystroke:paste',
      event_data: {
        text,
        cursorPosition,
        timestamp: Date.now()
      }
    });
  }

  logCut(text, cursorPosition) {
    this.log({
      event_type: 'keystroke:cut',
      event_data: {
        text,
        cursorPosition,
        timestamp: Date.now()
      }
    });
  }

  logDelete(deleteType, cursorPosition, deletedText = null) {
    this.log({
      event_type: `keystroke:${deleteType}`,
      event_data: {
        deleteType,
        cursorPosition,
        deletedText,
        timestamp: Date.now()
      }
    });
  }

  logButtonClick(buttonId, context = {}) {
    this.log({
      event_type: `button:${buttonId}`,
      event_data: {
        buttonId,
        context,
        timestamp: Date.now()
      }
    });
  }

  logApiCall(apiType, prompt, response, status, duration = null, context = {}) {
    this.log({
      event_type: `api_call:${status}`,
      event_data: {
        apiType,
        prompt,
        response,
        status,
        duration,
        timestamp: Date.now(),
        ...context
      }
    });
  }

  logBrowserEvent(eventType, details = {}) {
    this.log({
      event_type: `browser:${eventType}`,
      event_data: {
        eventType,
        details,
        timestamp: Date.now()
      }
    });
  }

  logError(errorType, errorMessage, stack = null) {
    this.log({
      event_type: `error:${errorType}`,
      event_data: {
        errorType,
        errorMessage,
        stack,
        timestamp: Date.now()
      }
    });
  }

  logTextSelection(start, end, selectedText) {
    this.log({
      event_type: 'text_selection:change',
      event_data: {
        start,
        end,
        selectedText,
        timestamp: Date.now()
      }
    });
  }

  logNavigation(fromStage, toStage) {
    this.log({
      event_type: 'navigation:stage_change',
      event_data: {
        fromStage,
        toStage,
        timestamp: Date.now()
      }
    });
  }

  // Core logging method
  log(logData) {
    if (!this.currentStage) {
      console.warn('Attempting to log without setting stage first');
      return;
    }

    const logEntry = {
      participant_id: this.participantId,
      session_id: this.sessionId,
      stage: this.currentStage,
      time_from_stage_start: this.getTimeFromStageStart(),
      ...logData
    };

    this.logQueue.push(logEntry);
    this.processQueue();
  }

  // Queue processing
  async processQueue() {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;

    while (this.logQueue.length > 0) {
      const batch = this.logQueue.splice(0, this.batchSize);
      
      try {
        await this.sendBatch(batch);
      } catch (error) {
        console.error('Failed to send log batch:', error);
        // Put the batch back at the front of the queue
        this.logQueue.unshift(...batch);
        break;
      }
    }

    this.isProcessing = false;
  }

  async sendBatch(batch) {
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(`/api/log`, batch[0], {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false
        });
        return response.data;
      } catch (error) {
        if (attempt === this.retryAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
      }
    }
  }

  // Browser event listeners
  setupBrowserEventListeners() {
    // Focus/blur events
    window.addEventListener('focus', () => {
      this.logBrowserEvent('focus');
    });

    window.addEventListener('blur', () => {
      this.logBrowserEvent('blur');
    });

    // Resize events
    window.addEventListener('resize', () => {
      this.logBrowserEvent('resize', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    });

    // Error events
    window.addEventListener('error', (event) => {
      this.logError('javascript', event.message, event.error?.stack);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('promise', event.reason?.message || 'Unhandled promise rejection', event.reason?.stack);
    });
  }

  // Cleanup
  destroy() {
    // Process any remaining logs
    this.processQueue();
  }
}

// Create a singleton instance
const loggingService = new LoggingService();

// Set up browser event listeners
loggingService.setupBrowserEventListeners();

export default loggingService; 