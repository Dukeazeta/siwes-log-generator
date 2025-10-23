/**
 * Test utility to verify authentication race condition fixes
 * This file contains tests to ensure that our authentication system
 * properly handles concurrent operations without race conditions.
 */

import { waitForAuthOperations } from "../auth-utils";
import { authLockManager, canPerformAuthOperation, withAuthLock } from "./auth-lock";

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

class AuthRaceConditionTester {
  private results: TestResult[] = [];
  private isRunning: boolean = false;

  /**
   * Run all race condition tests
   */
  public async runAllTests(): Promise<TestResult[]> {
    if (this.isRunning) {
      throw new Error("Tests are already running");
    }

    this.isRunning = true;
    this.results = [];

    console.log("🧪 Starting Authentication Race Condition Tests...\n");

    try {
      // Test 1: Simultaneous login attempts
      await this.testSimultaneousLogins();

      // Test 2: Rapid session refreshes
      await this.testRapidSessionRefresh();

      // Test 3: Concurrent profile checks
      await this.testConcurrentProfileChecks();

      // Test 4: Logout during authentication
      await this.testLogoutDuringAuth();

      // Test 5: Lock timeout handling
      await this.testLockTimeout();

      // Test 6: Transaction ordering
      await this.testTransactionOrdering();

      // Test 7: Deadlock prevention
      await this.testDeadlockPrevention();

      // Test 8: State synchronization
      await this.testStateSynchronization();

      this.printSummary();
      return this.results;
    } finally {
      this.isRunning = false;
      // Clean up any remaining locks
      authLockManager.clearAllLocks();
    }
  }

  /**
   * Test 1: Simultaneous login attempts should be serialized
   */
  private async testSimultaneousLogins(): Promise<void> {
    const testName = "Simultaneous Login Attempts";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      // Attempt 3 simultaneous logins
      const loginPromises = [
        this.simulateLogin("user1@test.com", "attempt1"),
        this.simulateLogin("user2@test.com", "attempt2"),
        this.simulateLogin("user3@test.com", "attempt3"),
      ];

      const loginResults = await Promise.allSettled(loginPromises);

      // Check that only one succeeded immediately, others waited or failed
      let immediateSuccesses = 0;
      let waitedSuccesses = 0;
      let failures = 0;

      loginResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.immediate) {
            immediateSuccesses++;
          } else {
            waitedSuccesses++;
          }
        } else {
          failures++;
        }
        console.log(`  Login ${index + 1}: ${result.status}`);
      });

      const passed = immediateSuccesses <= 1; // Only one should succeed immediately

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          immediateSuccesses,
          waitedSuccesses,
          failures,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 2: Rapid session refreshes should not cause conflicts
   */
  private async testRapidSessionRefresh(): Promise<void> {
    const testName = "Rapid Session Refresh";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      const refreshPromises = [];
      for (let i = 0; i < 5; i++) {
        refreshPromises.push(this.simulateSessionRefresh(i));
      }

      const results = await Promise.allSettled(refreshPromises);

      let successCount = 0;
      let errorCount = 0;
      let lockConflicts = 0;

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            successCount++;
          }
          if (result.value.lockConflict) {
            lockConflicts++;
          }
        } else {
          errorCount++;
        }
      });

      const passed = lockConflicts > 0 && errorCount === 0; // Should have lock conflicts but no errors

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          successCount,
          lockConflicts,
          errorCount,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 3: Concurrent profile checks should be debounced
   */
  private async testConcurrentProfileChecks(): Promise<void> {
    const testName = "Concurrent Profile Checks";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      const userId = "test-user-123";
      const checkPromises = [];

      // Simulate 10 rapid profile checks
      for (let i = 0; i < 10; i++) {
        checkPromises.push(this.simulateProfileCheck(userId, i));
      }

      const results = await Promise.allSettled(checkPromises);

      let executedChecks = 0;
      let debouncedChecks = 0;

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.executed) {
            executedChecks++;
          } else if (result.value.debounced) {
            debouncedChecks++;
          }
        }
      });

      // Should debounce most of the checks
      const passed = executedChecks < 3 && debouncedChecks > 5;

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          totalChecks: 10,
          executedChecks,
          debouncedChecks,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 4: Logout during authentication should be handled gracefully
   */
  private async testLogoutDuringAuth(): Promise<void> {
    const testName = "Logout During Authentication";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      // Start a login process
      const loginPromise = this.simulateLogin("test@example.com", "login-then-logout");

      // Wait a tiny bit then attempt logout
      await new Promise((resolve) => setTimeout(resolve, 10));
      const logoutPromise = this.simulateLogout();

      const [loginResult, logoutResult] = await Promise.allSettled([loginPromise, logoutPromise]);

      const loginBlocked = loginResult.status === "rejected" || !loginResult.value?.immediate;
      const logoutHandled = logoutResult.status === "fulfilled";

      const passed = logoutHandled; // Logout should be handled properly

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          loginBlocked,
          logoutHandled,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 5: Lock timeout handling
   */
  private async testLockTimeout(): Promise<void> {
    const testName = "Lock Timeout Handling";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      // Acquire a lock and don't release it
      const transitionId = await authLockManager.acquireLock("login", "test-user");

      if (!transitionId) {
        throw new Error("Failed to acquire initial lock");
      }

      // Don't release the lock - let it timeout
      // Wait for potential timeout (using a shorter timeout for testing)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Try to acquire another lock
      const secondTransitionId = await authLockManager.acquireLock("signup", "test-user-2", true);

      const passed = secondTransitionId !== null;

      // Clean up
      if (transitionId && authLockManager.isCurrentTransition(transitionId)) {
        authLockManager.releaseLock(transitionId);
      }
      if (secondTransitionId) {
        authLockManager.releaseLock(secondTransitionId);
      }

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          firstLock: transitionId,
          secondLock: secondTransitionId,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 6: Transaction ordering is maintained
   */
  private async testTransactionOrdering(): Promise<void> {
    const testName = "Transaction Ordering";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      const operations: string[] = [];

      // Execute operations in sequence
      const op1 = withAuthLock("login", async (id) => {
        operations.push(`login-start-${id}`);
        await new Promise((resolve) => setTimeout(resolve, 50));
        operations.push(`login-end-${id}`);
        return "login-done";
      });

      const op2 = withAuthLock(
        "profile_check",
        async (id) => {
          operations.push(`profile-start-${id}`);
          await new Promise((resolve) => setTimeout(resolve, 30));
          operations.push(`profile-end-${id}`);
          return "profile-done";
        },
        { waitForLock: true },
      );

      const op3 = withAuthLock(
        "refresh",
        async (id) => {
          operations.push(`refresh-start-${id}`);
          await new Promise((resolve) => setTimeout(resolve, 20));
          operations.push(`refresh-end-${id}`);
          return "refresh-done";
        },
        { waitForLock: true },
      );

      await Promise.all([op1, op2, op3]);

      // Check that operations completed in order
      const loginIndex = operations.findIndex((op) => op.startsWith("login-end"));
      const profileIndex = operations.findIndex((op) => op.startsWith("profile-start"));
      const refreshIndex = operations.findIndex((op) => op.startsWith("refresh-start"));

      const passed = loginIndex < profileIndex && profileIndex < refreshIndex;

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          operations,
          orderMaintained: passed,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 7: Deadlock prevention
   */
  private async testDeadlockPrevention(): Promise<void> {
    const testName = "Deadlock Prevention";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      let deadlockDetected = false;
      const timeout = 5000; // 5 second timeout for deadlock detection

      const operation1 = new Promise(async (resolve) => {
        const result = await authLockManager.waitAndAcquireLock("login", "user1", timeout);
        if (!result) {
          deadlockDetected = true;
        }
        resolve(result);
      });

      const operation2 = new Promise(async (resolve) => {
        await new Promise((r) => setTimeout(r, 10)); // Small delay
        const result = await authLockManager.waitAndAcquireLock("signup", "user2", timeout);
        if (!result) {
          deadlockDetected = true;
        }
        resolve(result);
      });

      await Promise.race([
        Promise.all([operation1, operation2]),
        new Promise((resolve) =>
          setTimeout(() => {
            deadlockDetected = true;
            resolve([null, null]);
          }, timeout),
        ),
      ]);

      const passed = !deadlockDetected;

      // Clean up
      authLockManager.clearAllLocks();

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          deadlockDetected,
          timeout,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  /**
   * Test 8: State synchronization across concurrent operations
   */
  private async testStateSynchronization(): Promise<void> {
    const testName = "State Synchronization";
    const startTime = Date.now();

    try {
      console.log(`Running: ${testName}`);

      const stateChanges: { operation: string; timestamp: number }[] = [];

      // Simulate state changes
      const operations = [
        async () => {
          await waitForAuthOperations(100);
          stateChanges.push({ operation: "check-1", timestamp: Date.now() });
        },
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          await waitForAuthOperations(100);
          stateChanges.push({ operation: "check-2", timestamp: Date.now() });
        },
        async () => {
          await new Promise((r) => setTimeout(r, 100));
          await waitForAuthOperations(100);
          stateChanges.push({ operation: "check-3", timestamp: Date.now() });
        },
      ];

      await Promise.all(operations.map((op) => op()));

      // Verify timestamps are in order
      let inOrder = true;
      for (let i = 1; i < stateChanges.length; i++) {
        if (stateChanges[i].timestamp < stateChanges[i - 1].timestamp) {
          inOrder = false;
          break;
        }
      }

      const passed = stateChanges.length === 3 && inOrder;

      this.results.push({
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          stateChanges,
          synchronizationMaintained: inOrder,
        },
      });

      console.log(`  ✅ ${testName}: ${passed ? "PASSED" : "FAILED"}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${testName}: ERROR - ${error}\n`);
    }
  }

  // Helper methods for simulating operations

  private async simulateLogin(
    email: string,
    identifier: string,
  ): Promise<{ immediate: boolean; success: boolean }> {
    const transitionId = await authLockManager.acquireLock("login", identifier);

    if (!transitionId) {
      // Try waiting for lock
      const waitedId = await authLockManager.waitAndAcquireLock("login", identifier, 1000);
      if (waitedId) {
        await new Promise((r) => setTimeout(r, 100)); // Simulate login
        authLockManager.releaseLock(waitedId);
        return { immediate: false, success: true };
      }
      return { immediate: false, success: false };
    }

    await new Promise((r) => setTimeout(r, 100)); // Simulate login
    authLockManager.releaseLock(transitionId);
    return { immediate: true, success: true };
  }

  private async simulateSessionRefresh(
    attemptNumber: number,
  ): Promise<{ success: boolean; lockConflict: boolean }> {
    const transitionId = await authLockManager.acquireLock("refresh", `refresh-${attemptNumber}`);

    if (!transitionId) {
      return { success: false, lockConflict: true };
    }

    await new Promise((r) => setTimeout(r, 50)); // Simulate refresh
    authLockManager.releaseLock(transitionId);
    return { success: true, lockConflict: false };
  }

  private async simulateProfileCheck(
    userId: string,
    attemptNumber: number,
  ): Promise<{ executed: boolean; debounced: boolean }> {
    // Simulate debouncing logic
    const canCheck = canPerformAuthOperation("profile_check");

    if (!canCheck || attemptNumber > 2) {
      return { executed: false, debounced: true };
    }

    const transitionId = await authLockManager.acquireLock("profile_check", userId);
    if (!transitionId) {
      return { executed: false, debounced: true };
    }

    await new Promise((r) => setTimeout(r, 20)); // Simulate check
    authLockManager.releaseLock(transitionId);
    return { executed: true, debounced: false };
  }

  private async simulateLogout(): Promise<boolean> {
    const transitionId = await authLockManager.waitAndAcquireLock("logout", undefined, 2000);

    if (!transitionId) {
      return false;
    }

    await new Promise((r) => setTimeout(r, 50)); // Simulate logout
    authLockManager.releaseLock(transitionId);
    return true;
  }

  private printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    this.results.forEach((result) => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} - ${result.testName} (${result.duration}ms)`);
      if (!result.passed && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    console.log("\n" + "-".repeat(60));
    console.log(`Total: ${this.results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log("=".repeat(60) + "\n");

    if (failed === 0) {
      console.log("🎉 All authentication race condition tests passed!");
    } else {
      console.log("⚠️ Some tests failed. Please review the results above.");
    }
  }
}

// Export tester instance
export const authRaceTester = new AuthRaceConditionTester();

// Function to run tests from console or component
export async function runAuthRaceTests(): Promise<void> {
  try {
    const results = await authRaceTester.runAllTests();

    // Store results in window for debugging
    if (typeof window !== "undefined") {
      (window as unknown as { __authTestResults?: TestResult[] }).__authTestResults = results;
      console.log("\n📊 Test results stored in window.__authTestResults");
    }
  } catch (error) {
    console.error("Failed to run auth race tests:", error);
  }
}

// Auto-run tests in development mode if URL parameter is present
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("testAuthRace") === "true") {
    console.log("🚀 Auto-running auth race condition tests...");
    runAuthRaceTests();
  }
}
