import { describe, test } from '@jest/globals';
import fc from 'fast-check';
import { SanitySystem } from '../../../framework/mechanics/SanitySystem.js';

describe('SanitySystem - Property-Based Tests', () => {
  // Feature: skeleton-crew-framework, Property 9: Sanity threshold effects
  // **Validates: Requirements 2.5**
  test('effects activate when sanity drops below threshold and deactivate when rising above', () => {
    fc.assert(
      fc.property(
        // Generate random max sanity (10-200)
        fc.integer({ min: 10, max: 200 }),
        // Generate array of threshold-effect pairs
        fc.array(
          fc.record({
            threshold: fc.integer({ min: 1, max: 200 }),
            effect: fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              intensity: fc.float({ min: 0, max: 1, noNaN: true })
            })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate array of sanity change operations
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('decrease'),
              amount: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            fc.record({
              type: fc.constant('increase'),
              amount: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            fc.record({
              type: fc.constant('set'),
              value: fc.integer({ min: 0, max: 200 })
            })
          ),
          { minLength: 1, maxLength: 30 }
        ),
        (maxSanity, thresholdEffects, operations) => {
          const system = new SanitySystem(maxSanity);

          // Add all effects with valid thresholds
          const validEffects = [];
          for (const te of thresholdEffects) {
            // Only add effects with thresholds within valid range
            if (te.threshold >= 0 && te.threshold <= maxSanity) {
              const added = system.addEffect(te.threshold, te.effect);
              if (added) {
                validEffects.push(te);
              }
            }
          }

          if (validEffects.length === 0) {
            return true; // Skip if no valid effects
          }

          // Apply all operations and check effect activation
          for (const op of operations) {
            if (op.type === 'decrease' && isFinite(op.amount) && op.amount >= 0) {
              system.decrease(op.amount);
            } else if (op.type === 'increase' && isFinite(op.amount) && op.amount >= 0) {
              system.increase(op.amount);
            } else if (op.type === 'set' && op.value >= 0 && op.value <= maxSanity) {
              system.setSanity(op.value);
            }

            const currentSanity = system.getCurrent();
            const activeEffects = system.getActiveEffects();
            const allEffects = system.getAllEffects();

            // Verify that effects are active/inactive based on current sanity
            for (const effectEntry of allEffects) {
              const shouldBeActive = currentSanity < effectEntry.threshold;
              const isActive = effectEntry.active;

              if (shouldBeActive !== isActive) {
                return false; // Effect activation state is incorrect
              }

              // Verify active effects list matches
              const inActiveList = activeEffects.some(
                e => e.name === effectEntry.effect.name && 
                     e.intensity === effectEntry.effect.intensity
              );

              if (shouldBeActive && !inActiveList) {
                return false; // Should be active but not in active list
              }
              if (!shouldBeActive && inActiveList) {
                return false; // Should not be active but is in active list
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('effect activation state changes correctly when crossing threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 10, max: 100 }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          value: fc.integer({ min: 1, max: 100 })
        }),
        (maxSanity, threshold, effect) => {
          // Ensure threshold is within valid range
          const validThreshold = Math.min(threshold, maxSanity - 1);
          
          const system = new SanitySystem(maxSanity);
          system.addEffect(validThreshold, effect);

          // Start above threshold
          system.setSanity(validThreshold + 10);
          let activeEffects = system.getActiveEffects();
          
          // Should not be active when above threshold
          if (activeEffects.length !== 0) {
            return false;
          }

          // Drop below threshold
          system.decrease(20);
          activeEffects = system.getActiveEffects();
          
          // Should be active when below threshold
          if (system.getCurrent() < validThreshold && activeEffects.length !== 1) {
            return false;
          }

          // Rise back above threshold
          system.increase(30);
          activeEffects = system.getActiveEffects();
          
          // Should not be active when above threshold again
          if (system.getCurrent() >= validThreshold && activeEffects.length !== 0) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multiple effects with different thresholds activate independently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 200 }),
        fc.array(
          fc.integer({ min: 10, max: 150 }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.integer({ min: 0, max: 200 }),
        (maxSanity, thresholds, targetSanity) => {
          const system = new SanitySystem(maxSanity);

          // Add effects for each threshold
          const validThresholds = [];
          for (let i = 0; i < thresholds.length; i++) {
            const threshold = Math.min(thresholds[i], maxSanity);
            const effect = { id: i, name: `effect_${i}` };
            const added = system.addEffect(threshold, effect);
            if (added) {
              validThresholds.push({ threshold, effect });
            }
          }

          if (validThresholds.length === 0) {
            return true; // Skip if no valid thresholds
          }

          // Set sanity to target value
          const validTarget = Math.min(targetSanity, maxSanity);
          system.setSanity(validTarget);

          const activeEffects = system.getActiveEffects();
          const allEffects = system.getAllEffects();

          // Count how many effects should be active
          const expectedActiveCount = validThresholds.filter(
            vt => validTarget < vt.threshold
          ).length;

          // Verify correct number of active effects
          if (activeEffects.length !== expectedActiveCount) {
            return false;
          }

          // Verify each effect's activation state
          for (const vt of validThresholds) {
            const shouldBeActive = validTarget < vt.threshold;
            const effectEntry = allEffects.find(
              e => e.effect.id === vt.effect.id
            );

            if (!effectEntry || effectEntry.active !== shouldBeActive) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sanity bounds are maintained during effect threshold crossings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.array(
          fc.integer({ min: 10, max: 150 }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('decrease'),
              amount: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            fc.record({
              type: fc.constant('increase'),
              amount: fc.float({ min: 0, max: 100, noNaN: true })
            })
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (maxSanity, thresholds, operations) => {
          const system = new SanitySystem(maxSanity);

          // Add effects
          for (let i = 0; i < thresholds.length; i++) {
            const threshold = Math.min(thresholds[i], maxSanity);
            system.addEffect(threshold, { id: i });
          }

          // Apply operations
          for (const op of operations) {
            if (op.type === 'decrease' && isFinite(op.amount) && op.amount >= 0) {
              system.decrease(op.amount);
            } else if (op.type === 'increase' && isFinite(op.amount) && op.amount >= 0) {
              system.increase(op.amount);
            }

            const current = system.getCurrent();
            
            // Sanity must stay within bounds
            if (current < 0 || current > maxSanity) {
              return false;
            }

            // Effect states must be consistent with current sanity
            const allEffects = system.getAllEffects();
            for (const effectEntry of allEffects) {
              const shouldBeActive = current < effectEntry.threshold;
              if (effectEntry.active !== shouldBeActive) {
                return false;
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('effect activation is idempotent - multiple checks at same sanity give same result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 10, max: 100 }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 })
        }),
        fc.integer({ min: 0, max: 200 }),
        (maxSanity, threshold, effect, targetSanity) => {
          const validThreshold = Math.min(threshold, maxSanity);
          const validTarget = Math.min(targetSanity, maxSanity);

          const system = new SanitySystem(maxSanity);
          system.addEffect(validThreshold, effect);
          system.setSanity(validTarget);

          // Get active effects multiple times
          const activeEffects1 = system.getActiveEffects();
          const activeEffects2 = system.getActiveEffects();
          const activeEffects3 = system.getActiveEffects();

          // All should be identical
          if (activeEffects1.length !== activeEffects2.length ||
              activeEffects2.length !== activeEffects3.length) {
            return false;
          }

          // Verify the activation state is correct
          const shouldBeActive = validTarget < validThreshold;
          const isActive = activeEffects1.length > 0;

          return shouldBeActive === isActive;
        }
      ),
      { numRuns: 100 }
    );
  });
});
