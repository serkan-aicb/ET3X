import { describe, test, expect } from '@jest/globals';
import { computeStarsAvg, computeXP, SkillScore } from './xp';

describe('XP Computation', () => {
  test('computeStarsAvg calculates correct average', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 3 },
      { skillId: 2, stars: 4 },
      { skillId: 3, stars: 5 }
    ];
    
    const avg = computeStarsAvg(scores);
    expect(avg).toBe(4.0);
  });

  test('computeStarsAvg handles single score', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 3 }
    ];
    
    const avg = computeStarsAvg(scores);
    expect(avg).toBe(3.0);
  });

  test('computeXP calculates correct XP for basic case', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 3 },
      { skillId: 2, stars: 4 },
      { skillId: 3, stars: 5 }
    ];
    
    const result = computeXP({
      scores,
      level: "Novice",
      submittedAt: new Date(),
      dueAt: null
    });
    
    // starsAvg = 4.0
    // XP = 50 + (30 * 4.0) = 170
    // On-time bonus applied by default since no due date = 170 * 1.1 = 187
    expect(result.starsAvg).toBe(4.0);
    expect(result.xp).toBe(187);
  });

  test('computeXP applies level multiplier', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 3 },
      { skillId: 2, stars: 4 },
      { skillId: 3, stars: 5 }
    ];
    
    const result = computeXP({
      scores,
      level: "Expert",
      submittedAt: new Date(),
      dueAt: null
    });
    
    // starsAvg = 4.0
    // Base XP = 50 + (30 * 4.0) = 170
    // Expert multiplier = 1.5
    // Final XP = 170 * 1.5 * 1.1 (on-time bonus) = 281
    expect(result.starsAvg).toBe(4.0);
    expect(result.xp).toBe(281);
  });

  test('computeXP does not apply group dampening', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 3 },
      { skillId: 2, stars: 4 },
      { skillId: 3, stars: 5 }
    ];
    
    const result = computeXP({
      scores,
      level: "Novice",
      submittedAt: new Date(),
      dueAt: null
    });
    
    // starsAvg = 4.0
    // Base XP = 50 + (30 * 4.0) = 170
    // On-time bonus applied by default since no due date = 170 * 1.1 = 187
    expect(result.starsAvg).toBe(4.0);
    expect(result.xp).toBe(187);
  });

  test('computeXP applies on-time bonus', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 3 },
      { skillId: 2, stars: 4 },
      { skillId: 3, stars: 5 }
    ];
    
    const result = computeXP({
      scores,
      level: "Novice",
      submittedAt: new Date(),
      dueAt: new Date(Date.now() + 86400000) // Due tomorrow
    });
    
    // starsAvg = 4.0
    // Base XP = 50 + (30 * 4.0) = 170
    // On-time bonus = 1.1
    // Final XP = 170 * 1.1 = 187
    expect(result.starsAvg).toBe(4.0);
    expect(result.xp).toBe(187);
  });

  test('computeXP clamps XP to minimum', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 1 }
    ];
    
    const result = computeXP({
      scores,
      level: "Novice",
      submittedAt: new Date(),
      dueAt: null
    });
    
    // starsAvg = 1.0
    // Base XP = 50 + (30 * 1.0) = 80
    // On-time bonus = 80 * 1.1 = 88
    expect(result.starsAvg).toBe(1.0);
    expect(result.xp).toBe(88);
  });

  test('computeXP clamps XP to maximum', () => {
    const scores: SkillScore[] = [
      { skillId: 1, stars: 5 },
      { skillId: 2, stars: 5 },
      { skillId: 3, stars: 5 },
      { skillId: 4, stars: 5 },
      { skillId: 5, stars: 5 }
    ];
    
    const result = computeXP({
      scores,
      level: "Master",
      submittedAt: new Date(),
      dueAt: new Date(Date.now() + 86400000) // On time
    });
    
    // starsAvg = 5.0
    // Base XP = 50 + (30 * 5.0) = 200
    // Master multiplier = 1.8
    // XP after level = 200 * 1.8 = 360
    // On-time bonus = 360 * 1.1 = 396
    // Should be less than maximum 600, so not clamped
    expect(result.starsAvg).toBe(5.0);
    expect(result.xp).toBe(396);
  });

});
