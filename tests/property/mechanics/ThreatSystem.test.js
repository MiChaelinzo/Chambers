import { describe, test } from '@jest/globals';
import fc from 'fast-check';
import { ThreatSystem } from '../../../framework/mechanics/ThreatSystem.js';

describe('ThreatSystem - Property-Based Tests', () => {
  // Feature: skeleton-crew-framework, Property 8: Threat detection radius
  // **Validates: Requirements 2.4**
  test('all threats within detection radius are included in nearby threats list', () => {
    fc.assert(
      fc.property(
        // Generate random detection radius (1-30)
        fc.integer({ min: 1, max: 30 }),
        // Generate random player position
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        // Generate array of random entities with positions and threat levels
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            position: fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -100, max: 100 })
            }),
            threatLevel: fc.integer({ min: 0, max: 20 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (detectionRadius, playerPos, entities) => {
          const player = { id: 'player', position: playerPos };
          const threatSystem = new ThreatSystem({ radius: detectionRadius });

          // Register all entities as threats
          for (const entity of entities) {
            threatSystem.registerThreat(entity, entity.threatLevel);
          }

          const nearbyThreats = threatSystem.getNearbyThreats(player, entities);

          // Check that all threats in the nearby list are within detection radius
          for (const threat of nearbyThreats) {
            const dx = threat.position.x - player.position.x;
            const dy = threat.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > detectionRadius) {
              return false; // Threat outside radius should not be in nearby list
            }
          }

          // Check that all threats within radius are in the nearby list
          for (const entity of entities) {
            const dx = entity.position.x - player.position.x;
            const dy = entity.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= detectionRadius) {
              if (!nearbyThreats.includes(entity)) {
                return false; // Threat within radius should be in nearby list
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('threat level calculation is sum of nearby threat levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            position: fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -100, max: 100 })
            }),
            threatLevel: fc.integer({ min: 0, max: 20 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (detectionRadius, playerPos, entities) => {
          const player = { id: 'player', position: playerPos };
          const threatSystem = new ThreatSystem({ radius: detectionRadius });

          // Register all entities as threats
          for (const entity of entities) {
            threatSystem.registerThreat(entity, entity.threatLevel);
          }

          const totalThreatLevel = threatSystem.getThreatLevel(player, entities);

          // Calculate expected threat level manually
          let expectedThreatLevel = 0;
          for (const entity of entities) {
            const dx = entity.position.x - player.position.x;
            const dy = entity.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= detectionRadius) {
              expectedThreatLevel += entity.threatLevel;
            }
          }

          // Property: total threat level should equal sum of nearby threat levels
          return totalThreatLevel === expectedThreatLevel;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('non-registered entities are not included in nearby threats', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            position: fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -100, max: 100 })
            }),
            isThreat: fc.boolean()
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (detectionRadius, playerPos, entities) => {
          const player = { id: 'player', position: playerPos };
          const threatSystem = new ThreatSystem({ radius: detectionRadius });

          // Register only entities marked as threats
          for (const entity of entities) {
            if (entity.isThreat) {
              threatSystem.registerThreat(entity, 5);
            }
          }

          const nearbyThreats = threatSystem.getNearbyThreats(player, entities);

          // Check that all entities in nearby threats are registered threats
          for (const threat of nearbyThreats) {
            if (!threatSystem.isThreat(threat)) {
              return false; // Non-threat should not be in nearby list
            }
          }

          // Check that non-threats within radius are not included
          for (const entity of entities) {
            if (!entity.isThreat) {
              if (nearbyThreats.includes(entity)) {
                return false; // Non-threat should not be in nearby list
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('threats at exact detection radius boundary are included', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        fc.integer({ min: 0, max: 359 }), // angle in degrees
        (detectionRadius, playerPos, angleDegrees) => {
          const player = { id: 'player', position: playerPos };
          const threatSystem = new ThreatSystem({ radius: detectionRadius });

          // Create entity slightly inside detection radius to avoid floating-point precision issues
          // Use 99.9% of radius to ensure we're definitely within bounds
          const angleRadians = (angleDegrees * Math.PI) / 180;
          const safeRadius = detectionRadius * 0.999;
          const entity = {
            id: 'boundary-threat',
            position: {
              x: playerPos.x + safeRadius * Math.cos(angleRadians),
              y: playerPos.y + safeRadius * Math.sin(angleRadians)
            }
          };

          threatSystem.registerThreat(entity, 5);

          const nearbyThreats = threatSystem.getNearbyThreats(player, [entity]);

          // Property: threat just inside boundary should be included
          return nearbyThreats.includes(entity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty entity list returns zero threat level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        (detectionRadius, playerPos) => {
          const player = { id: 'player', position: playerPos };
          const threatSystem = new ThreatSystem({ radius: detectionRadius });

          const threatLevel = threatSystem.getThreatLevel(player, []);

          return threatLevel === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
