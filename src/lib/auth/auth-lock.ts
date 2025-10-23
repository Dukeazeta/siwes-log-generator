/**
 * Authentication Lock Manager
 * Prevents race conditions by ensuring only one authentication operation
 * can happen at a time and manages transition states properly.
 */

export interface AuthTransition {
  id: string;
  timestamp: number;
  operation: "login" | "signup" | "oauth" | "logout" | "refresh" | "profile_check";
  status: "pending" | "completed" | "failed";
  userId?: string;
}

export class AuthLockManager {
  private static instance: AuthLockManager;
  private currentTransition: AuthTransition | null = null;
  private transitionHistory: AuthTransition[] = [];
  private readonly MAX_HISTORY_SIZE = 20;
  private readonly TRANSITION_TIMEOUT = 30000; // 30 seconds
  private timeoutTimer: NodeJS.Timeout | null = null;
  private readonly pendingCallbacks: Map<string, Array<() => void>> = new Map();

  private constructor() {}

  public static getInstance(): AuthLockManager {
    if (!AuthLockManager.instance) {
      AuthLockManager.instance = new AuthLockManager();
    }
    return AuthLockManager.instance;
  }

  /**
   * Acquire a lock for an authentication operation
   * Returns a transition ID if successful, null if an operation is already in progress
   */
  public async acquireLock(
    operation: AuthTransition["operation"],
    userId?: string,
    force: boolean = false,
  ): Promise<string | null> {
    // Check if there's an ongoing transition
    if (this.currentTransition && !force) {
      const elapsedTime = Date.now() - this.currentTransition.timestamp;

      // If the current transition has timed out, force clear it
      if (elapsedTime > this.TRANSITION_TIMEOUT) {
        console.warn(
          `Auth transition ${this.currentTransition.id} timed out after ${elapsedTime}ms, forcing clear`,
        );
        this.releaseLock(this.currentTransition.id, "failed");
      } else {
        console.log(
          `Cannot acquire lock: ${operation} blocked by ongoing ${this.currentTransition.operation}`,
        );
        return null;
      }
    }

    // Create new transition
    const transitionId = this.generateTransitionId();
    this.currentTransition = {
      id: transitionId,
      timestamp: Date.now(),
      operation,
      status: "pending",
      userId,
    };

    // Set timeout for this transition
    this.setTransitionTimeout(transitionId);

    // Add to history
    this.addToHistory(this.currentTransition);

    console.log(`Auth lock acquired: ${operation} (${transitionId})`);
    return transitionId;
  }

  /**
   * Wait for current transition to complete before acquiring lock
   */
  public async waitAndAcquireLock(
    operation: AuthTransition["operation"],
    userId?: string,
    maxWaitTime: number = 10000,
  ): Promise<string | null> {
    const startTime = Date.now();

    while (this.currentTransition) {
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime > maxWaitTime) {
        console.error(`Timeout waiting for auth lock after ${elapsedTime}ms`);
        return null;
      }

      // Wait for current transition to complete
      await this.waitForTransition(this.currentTransition.id, maxWaitTime - elapsedTime);
    }

    return this.acquireLock(operation, userId);
  }

  /**
   * Release an authentication lock
   */
  public releaseLock(transitionId: string, status: "completed" | "failed" = "completed"): void {
    if (!this.currentTransition || this.currentTransition.id !== transitionId) {
      console.warn(`Attempted to release non-existent or mismatched lock: ${transitionId}`);
      return;
    }

    // Clear timeout
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    // Update transition status
    this.currentTransition.status = status;

    // Update history
    const historyItem = this.transitionHistory.find((t) => t.id === transitionId);
    if (historyItem) {
      historyItem.status = status;
    }

    console.log(
      `Auth lock released: ${this.currentTransition.operation} (${transitionId}) - ${status}`,
    );

    // Clear current transition
    this.currentTransition = null;

    // Notify any waiting callbacks
    this.notifyWaiters(transitionId);
  }

  /**
   * Check if a specific operation is currently in progress
   */
  public isOperationInProgress(operation: AuthTransition["operation"]): boolean {
    return this.currentTransition?.operation === operation;
  }

  /**
   * Check if any operation is in progress
   */
  public isAnyOperationInProgress(): boolean {
    return this.currentTransition !== null;
  }

  /**
   * Get current transition details
   */
  public getCurrentTransition(): AuthTransition | null {
    return this.currentTransition ? { ...this.currentTransition } : null;
  }

  /**
   * Get transition history
   */
  public getTransitionHistory(): AuthTransition[] {
    return [...this.transitionHistory];
  }

  /**
   * Clear all locks (use with caution)
   */
  public clearAllLocks(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    if (this.currentTransition) {
      this.releaseLock(this.currentTransition.id, "failed");
    }

    this.currentTransition = null;
    this.pendingCallbacks.clear();

    console.log("All auth locks cleared");
  }

  /**
   * Validate if a transition ID is current
   */
  public isCurrentTransition(transitionId: string): boolean {
    return this.currentTransition?.id === transitionId;
  }

  /**
   * Get elapsed time for current transition
   */
  public getCurrentTransitionElapsedTime(): number | null {
    if (!this.currentTransition) return null;
    return Date.now() - this.currentTransition.timestamp;
  }

  // Private methods

  private generateTransitionId(): string {
    return `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setTransitionTimeout(transitionId: string): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    this.timeoutTimer = setTimeout(() => {
      if (this.currentTransition?.id === transitionId) {
        console.error(
          `Auth transition ${transitionId} (${this.currentTransition.operation}) timed out after ${this.TRANSITION_TIMEOUT}ms`,
        );
        this.releaseLock(transitionId, "failed");
      }
    }, this.TRANSITION_TIMEOUT);
  }

  private addToHistory(transition: AuthTransition): void {
    this.transitionHistory.push({ ...transition });

    // Keep history size manageable
    if (this.transitionHistory.length > this.MAX_HISTORY_SIZE) {
      this.transitionHistory = this.transitionHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  private waitForTransition(transitionId: string, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      // If transition is already complete, resolve immediately
      if (!this.currentTransition || this.currentTransition.id !== transitionId) {
        resolve();
        return;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.removeWaiter(transitionId, resolve);
        resolve();
      }, timeout);

      // Add to waiting callbacks
      const callbacks = this.pendingCallbacks.get(transitionId) || [];
      const callbackWithTimeout = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      callbacks.push(callbackWithTimeout);
      this.pendingCallbacks.set(transitionId, callbacks);
    });
  }

  private notifyWaiters(transitionId: string): void {
    const callbacks = this.pendingCallbacks.get(transitionId);
    if (callbacks) {
      callbacks.forEach((callback) => callback());
      this.pendingCallbacks.delete(transitionId);
    }
  }

  private removeWaiter(transitionId: string, callback: () => void): void {
    const callbacks = this.pendingCallbacks.get(transitionId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.pendingCallbacks.delete(transitionId);
      }
    }
  }
}

// Export singleton instance
export const authLockManager = AuthLockManager.getInstance();

// Utility functions for common operations

/**
 * Execute an authentication operation with automatic lock management
 */
export async function withAuthLock<T>(
  operation: AuthTransition["operation"],
  callback: (transitionId: string) => Promise<T>,
  options: {
    userId?: string;
    waitForLock?: boolean;
    maxWaitTime?: number;
  } = {},
): Promise<T> {
  const lockManager = AuthLockManager.getInstance();
  let transitionId: string | null = null;

  try {
    // Acquire lock
    if (options.waitForLock) {
      transitionId = await lockManager.waitAndAcquireLock(
        operation,
        options.userId,
        options.maxWaitTime,
      );
    } else {
      transitionId = await lockManager.acquireLock(operation, options.userId);
    }

    if (!transitionId) {
      throw new Error(`Failed to acquire auth lock for ${operation}`);
    }

    // Execute callback
    const result = await callback(transitionId);

    // Release lock on success
    lockManager.releaseLock(transitionId, "completed");

    return result;
  } catch (error) {
    // Release lock on error
    if (transitionId) {
      lockManager.releaseLock(transitionId, "failed");
    }
    throw error;
  }
}

/**
 * Check if it's safe to perform an authentication operation
 */
export function canPerformAuthOperation(operation?: AuthTransition["operation"]): boolean {
  const lockManager = AuthLockManager.getInstance();

  if (!lockManager.isAnyOperationInProgress()) {
    return true;
  }

  // Allow certain operations to proceed even if others are in progress
  // For example, allow profile checks during other operations
  if (operation === "profile_check") {
    const current = lockManager.getCurrentTransition();
    return current?.operation !== "logout" && current?.operation !== "profile_check";
  }

  return false;
}

/**
 * Debounce authentication operations
 */
export class AuthOperationDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  public debounce<T extends (...args: unknown[]) => unknown>(
    key: string,
    fn: T,
    delay: number = 1000,
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.timers.delete(key);
        fn(...args);
      }, delay);

      this.timers.set(key, timer);
    };
  }

  public clear(key?: string): void {
    if (key) {
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    } else {
      this.timers.forEach((timer) => clearTimeout(timer));
      this.timers.clear();
    }
  }
}

export const authDebouncer = new AuthOperationDebouncer();
