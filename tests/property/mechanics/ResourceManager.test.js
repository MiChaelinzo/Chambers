import { describe, test } from '@jest/globals';
import fc from 'fast-check';
import { ResourceManager } from '../../../framework/mechanics/ResourceManager.js';

describe('ResourceManager - Property-Based Tests', () => {
  // Feature: skeleton-crew-framework, Property 6: Resource bounds enforcement
  // **Validates: Requirements 2.2**
  test('resource values stay within [0, max] bounds after any operations', () => {
    fc.assert(
      fc.property(
        // Generate random resource name
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate random max value (1-1000)
        fc.integer({ min: 1, max: 1000 }),
        // Generate random initial value (0 to max)
        fc.integer({ min: 0, max: 1000 }),
        // Generate random deplete rate (0-50)
        fc.float({ min: 0, max: 50 }),
        // Generate array of random operations
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('consume'),
              amount: fc.float({ min: 0, max: 2000 })
            }),
            fc.record({
              type: fc.constant('restore'),
              amount: fc.float({ min: 0, max: 2000 })
            }),
            fc.record({
              type: fc.constant('update'),
              deltaTime: fc.float({ min: 0, max: 10 })
            })
          ),
          { minLength: 0, maxLength: 50 }
        ),
        (name, max, initialRaw, depleteRate, operations) => {
          // Ensure initial is within [0, max]
          const initial = Math.min(initialRaw, max);
          
          const manager = new ResourceManager();
          manager.addResource(name, initial, max, depleteRate);

          // Apply all operations
          for (const op of operations) {
            // Skip operations with invalid values (NaN, Infinity)
            if (op.type === 'consume' && (!isFinite(op.amount) || op.amount < 0)) {
              continue;
            }
            if (op.type === 'restore' && (!isFinite(op.amount) || op.amount < 0)) {
              continue;
            }
            if (op.type === 'update' && (!isFinite(op.deltaTime) || op.deltaTime < 0)) {
              continue;
            }

            if (op.type === 'consume') {
              manager.consume(name, op.amount);
            } else if (op.type === 'restore') {
              manager.restore(name, op.amount);
            } else if (op.type === 'update') {
              manager.update(op.deltaTime);
            }

            // Check bounds after each operation
            const resource = manager.getResource(name);
            if (resource.current < 0 || resource.current > max) {
              return false;
            }
          }

          // Final check
          const finalResource = manager.getResource(name);
          return finalResource.current >= 0 && finalResource.current <= max;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('consuming more than available always results in 0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.float({ min: 0, max: 5000 }),
        (name, max, initialRaw, consumeAmount) => {
          const initial = Math.min(initialRaw, max);
          
          const manager = new ResourceManager();
          manager.addResource(name, initial, max, 0);

          // Consume more than available
          if (consumeAmount > initial) {
            manager.consume(name, consumeAmount);
            const resource = manager.getResource(name);
            return resource.current === 0;
          }

          return true; // Skip if not consuming more than available
        }
      ),
      { numRuns: 100 }
    );
  });

  test('restoring beyond max always results in max', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.float({ min: 0, max: 5000 }),
        (name, max, initialRaw, restoreAmount) => {
          const initial = Math.min(initialRaw, max);
          
          const manager = new ResourceManager();
          manager.addResource(name, initial, max, 0);

          // Restore beyond max
          if (initial + restoreAmount > max) {
            manager.restore(name, restoreAmount);
            const resource = manager.getResource(name);
            return resource.current === max;
          }

          return true; // Skip if not restoring beyond max
        }
      ),
      { numRuns: 100 }
    );
  });

  test('depletion never goes below 0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.float({ min: Math.fround(0.1), max: 100 }),
        fc.float({ min: 0, max: 100 }),
        (name, max, initialRaw, depleteRate, deltaTime) => {
          // Ensure initial is within [0, max]
          const initial = Math.min(initialRaw, max);
          
          const manager = new ResourceManager();
          manager.addResource(name, initial, max, depleteRate);

          // Update with time that would deplete beyond 0
          manager.update(deltaTime);

          const resource = manager.getResource(name);
          return resource.current >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multiple resources maintain independent bounds', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            max: fc.integer({ min: 1, max: 1000 }),
            initial: fc.integer({ min: 0, max: 1000 }),
            depleteRate: fc.float({ min: 0, max: 50 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            resourceIndex: fc.nat(),
            operation: fc.oneof(
              fc.record({
                type: fc.constant('consume'),
                amount: fc.float({ min: 0, max: 2000 })
              }),
              fc.record({
                type: fc.constant('restore'),
                amount: fc.float({ min: 0, max: 2000 })
              })
            )
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (resources, operations) => {
          const manager = new ResourceManager();
          
          // Add all resources with valid initial values
          const validResources = [];
          for (const res of resources) {
            const initial = Math.min(res.initial, res.max);
            try {
              manager.addResource(res.name, initial, res.max, res.depleteRate);
              validResources.push({ ...res, initial });
            } catch (e) {
              // Skip duplicate names
            }
          }

          if (validResources.length === 0) {
            return true; // Skip if no valid resources
          }

          // Apply operations
          for (const op of operations) {
            const resourceIndex = op.resourceIndex % validResources.length;
            const resource = validResources[resourceIndex];

            if (op.operation.type === 'consume') {
              manager.consume(resource.name, op.operation.amount);
            } else if (op.operation.type === 'restore') {
              manager.restore(resource.name, op.operation.amount);
            }
          }

          // Check all resources are within bounds
          for (const res of validResources) {
            const current = manager.getResource(res.name);
            if (!current || current.current < 0 || current.current > res.max) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sequence of consume and restore maintains bounds', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 10, max: 1000 }),
        fc.array(
          fc.tuple(
            fc.float({ min: 0, max: 500 }), // consume amount
            fc.float({ min: 0, max: 500 })  // restore amount
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (name, max, operations) => {
          const manager = new ResourceManager();
          manager.addResource(name, max, max, 0); // Start at max

          for (const [consumeAmt, restoreAmt] of operations) {
            manager.consume(name, consumeAmt);
            
            const afterConsume = manager.getResource(name);
            if (afterConsume.current < 0 || afterConsume.current > max) {
              return false;
            }

            manager.restore(name, restoreAmt);
            
            const afterRestore = manager.getResource(name);
            if (afterRestore.current < 0 || afterRestore.current > max) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
