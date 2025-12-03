import { describe, test, expect } from '@jest/globals';
import { SanitySystem } from '../../../framework/mechanics/SanitySystem.js';

describe('SanitySystem - Unit Tests', () => {
  describe('Constructor', () => {
    test('creates system with default max sanity of 100', () => {
      const system = new SanitySystem();
      expect(system.getCurrent()).toBe(100);
      expect(system.getMax()).toBe(100);
    });

    test('creates system with custom max sanity', () => {
      const system = new SanitySystem(150);
      expect(system.getCurrent()).toBe(150);
      expect(system.getMax()).toBe(150);
    });

    test('throws error for invalid max sanity', () => {
      expect(() => new SanitySystem(0)).toThrow();
      expect(() => new SanitySystem(-10)).toThrow();
      expect(() => new SanitySystem('invalid')).toThrow();
    });
  });

  describe('Decrease', () => {
    test('decreases sanity by specified amount', () => {
      const system = new SanitySystem(100);
      system.decrease(30);
      expect(system.getCurrent()).toBe(70);
    });

    test('cannot decrease below 0', () => {
      const system = new SanitySystem(100);
      system.decrease(150);
      expect(system.getCurrent()).toBe(0);
    });

    test('returns false for invalid amounts', () => {
      const system = new SanitySystem(100);
      expect(system.decrease(-10)).toBe(false);
      expect(system.decrease('invalid')).toBe(false);
      expect(system.getCurrent()).toBe(100); // Unchanged
    });

    test('accepts optional reason parameter', () => {
      const system = new SanitySystem(100);
      expect(system.decrease(10, 'saw monster')).toBe(true);
      expect(system.getCurrent()).toBe(90);
    });
  });

  describe('Increase', () => {
    test('increases sanity by specified amount', () => {
      const system = new SanitySystem(100);
      system.decrease(50);
      system.increase(20);
      expect(system.getCurrent()).toBe(70);
    });

    test('cannot increase above max', () => {
      const system = new SanitySystem(100);
      system.decrease(30);
      system.increase(50);
      expect(system.getCurrent()).toBe(100);
    });

    test('returns false for invalid amounts', () => {
      const system = new SanitySystem(100);
      system.decrease(50);
      expect(system.increase(-10)).toBe(false);
      expect(system.increase('invalid')).toBe(false);
      expect(system.getCurrent()).toBe(50); // Unchanged
    });
  });

  describe('Effect System', () => {
    test('adds effect with threshold', () => {
      const system = new SanitySystem(100);
      const effect = { name: 'hallucination', intensity: 0.5 };
      const result = system.addEffect(50, effect);
      
      expect(result).toBe(true);
      expect(system.getAllEffects()).toHaveLength(1);
    });

    test('effect is active when sanity is below threshold', () => {
      const system = new SanitySystem(100);
      const effect = { name: 'hallucination' };
      
      system.addEffect(50, effect);
      system.decrease(60); // Sanity now at 40, below threshold of 50
      
      const activeEffects = system.getActiveEffects();
      expect(activeEffects).toHaveLength(1);
      expect(activeEffects[0].name).toBe('hallucination');
    });

    test('effect is not active when sanity is above threshold', () => {
      const system = new SanitySystem(100);
      const effect = { name: 'hallucination' };
      
      system.addEffect(50, effect);
      // Sanity is 100, above threshold of 50
      
      const activeEffects = system.getActiveEffects();
      expect(activeEffects).toHaveLength(0);
    });

    test('effect activates when crossing threshold downward', () => {
      const system = new SanitySystem(100);
      const effect = { name: 'paranoia' };
      
      system.addEffect(60, effect);
      expect(system.getActiveEffects()).toHaveLength(0);
      
      system.decrease(50); // Sanity now at 50, below threshold
      expect(system.getActiveEffects()).toHaveLength(1);
    });

    test('effect deactivates when crossing threshold upward', () => {
      const system = new SanitySystem(100);
      const effect = { name: 'paranoia' };
      
      system.addEffect(60, effect);
      system.decrease(50); // Sanity at 50, effect active
      expect(system.getActiveEffects()).toHaveLength(1);
      
      system.increase(20); // Sanity at 70, above threshold
      expect(system.getActiveEffects()).toHaveLength(0);
    });

    test('multiple effects with different thresholds', () => {
      const system = new SanitySystem(100);
      
      system.addEffect(80, { name: 'mild_anxiety' });
      system.addEffect(50, { name: 'paranoia' });
      system.addEffect(20, { name: 'hallucination' });
      
      // At 100: no effects
      expect(system.getActiveEffects()).toHaveLength(0);
      
      // At 70: mild_anxiety active
      system.decrease(30);
      expect(system.getActiveEffects()).toHaveLength(1);
      expect(system.getActiveEffects()[0].name).toBe('mild_anxiety');
      
      // At 40: mild_anxiety and paranoia active
      system.decrease(30);
      expect(system.getActiveEffects()).toHaveLength(2);
      
      // At 10: all three active
      system.decrease(30);
      expect(system.getActiveEffects()).toHaveLength(3);
    });

    test('returns false for invalid threshold', () => {
      const system = new SanitySystem(100);
      const effect = { name: 'test' };
      
      expect(system.addEffect(-10, effect)).toBe(false);
      expect(system.addEffect(150, effect)).toBe(false);
      expect(system.addEffect('invalid', effect)).toBe(false);
    });

    test('returns false for invalid effect', () => {
      const system = new SanitySystem(100);
      
      expect(system.addEffect(50, null)).toBe(false);
      expect(system.addEffect(50, 'not an object')).toBe(false);
    });

    test('effect is initially active if sanity starts below threshold', () => {
      const system = new SanitySystem(100);
      system.decrease(60); // Sanity at 40
      
      const effect = { name: 'test' };
      system.addEffect(50, effect);
      
      // Effect should be immediately active
      expect(system.getActiveEffects()).toHaveLength(1);
    });
  });

  describe('Update', () => {
    test('accepts deltaTime parameter', () => {
      const system = new SanitySystem(100);
      expect(() => system.update(0.016)).not.toThrow();
    });

    test('ignores invalid deltaTime', () => {
      const system = new SanitySystem(100);
      const before = system.getCurrent();
      
      system.update(-1);
      system.update(NaN);
      system.update(Infinity);
      system.update('invalid');
      
      expect(system.getCurrent()).toBe(before);
    });
  });

  describe('Utility Methods', () => {
    test('getAllEffects returns all effects with their state', () => {
      const system = new SanitySystem(100);
      
      system.addEffect(80, { name: 'effect1' });
      system.addEffect(50, { name: 'effect2' });
      system.decrease(30); // Sanity at 70
      
      const allEffects = system.getAllEffects();
      expect(allEffects).toHaveLength(2);
      expect(allEffects[0].active).toBe(true); // Below 80
      expect(allEffects[1].active).toBe(false); // Above 50
    });

    test('clearEffects removes all effects', () => {
      const system = new SanitySystem(100);
      
      system.addEffect(80, { name: 'effect1' });
      system.addEffect(50, { name: 'effect2' });
      
      system.clearEffects();
      
      expect(system.getAllEffects()).toHaveLength(0);
      expect(system.getActiveEffects()).toHaveLength(0);
    });

    test('setSanity sets sanity to specific value', () => {
      const system = new SanitySystem(100);
      
      expect(system.setSanity(75)).toBe(true);
      expect(system.getCurrent()).toBe(75);
    });

    test('setSanity triggers effect updates', () => {
      const system = new SanitySystem(100);
      system.addEffect(50, { name: 'test' });
      
      system.setSanity(40);
      expect(system.getActiveEffects()).toHaveLength(1);
      
      system.setSanity(60);
      expect(system.getActiveEffects()).toHaveLength(0);
    });

    test('setSanity returns false for invalid values', () => {
      const system = new SanitySystem(100);
      
      expect(system.setSanity(-10)).toBe(false);
      expect(system.setSanity(150)).toBe(false);
      expect(system.setSanity('invalid')).toBe(false);
      expect(system.getCurrent()).toBe(100); // Unchanged
    });
  });

  describe('Edge Cases', () => {
    test('effect at threshold boundary (sanity exactly at threshold)', () => {
      const system = new SanitySystem(100);
      system.addEffect(50, { name: 'test' });
      
      system.setSanity(50);
      // Effect should NOT be active when sanity equals threshold
      expect(system.getActiveEffects()).toHaveLength(0);
      
      system.setSanity(49);
      // Effect should be active when sanity is below threshold
      expect(system.getActiveEffects()).toHaveLength(1);
    });

    test('multiple effects at same threshold', () => {
      const system = new SanitySystem(100);
      
      system.addEffect(50, { name: 'effect1' });
      system.addEffect(50, { name: 'effect2' });
      
      system.decrease(60); // Sanity at 40
      
      const activeEffects = system.getActiveEffects();
      expect(activeEffects).toHaveLength(2);
    });

    test('sanity at 0 with effects', () => {
      const system = new SanitySystem(100);
      
      system.addEffect(80, { name: 'effect1' });
      system.addEffect(50, { name: 'effect2' });
      system.addEffect(20, { name: 'effect3' });
      
      system.decrease(100); // Sanity at 0
      
      expect(system.getCurrent()).toBe(0);
      expect(system.getActiveEffects()).toHaveLength(3);
    });

    test('sanity at max with effects', () => {
      const system = new SanitySystem(100);
      
      system.addEffect(80, { name: 'effect1' });
      system.addEffect(50, { name: 'effect2' });
      
      expect(system.getCurrent()).toBe(100);
      expect(system.getActiveEffects()).toHaveLength(0);
    });

    test('rapid sanity changes maintain effect consistency', () => {
      const system = new SanitySystem(100);
      system.addEffect(50, { name: 'test' });
      
      for (let i = 0; i < 10; i++) {
        system.decrease(10);
        system.increase(5);
      }
      
      const current = system.getCurrent();
      const activeEffects = system.getActiveEffects();
      
      if (current < 50) {
        expect(activeEffects).toHaveLength(1);
      } else {
        expect(activeEffects).toHaveLength(0);
      }
    });
  });
});
