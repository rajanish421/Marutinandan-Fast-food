import { buildBurger } from './burger.js';
import { buildFries } from './fries.js';
import { buildPizza } from './pizza.js';
import { buildMomos } from './momos.js';
import { buildRoll } from './roll.js';
import { buildSandwich } from './sandwich.js';
import { buildChowmein } from './chowmein.js';
import { buildShake } from './shake.js';

export const MODELS = {
  burger: buildBurger, fries: buildFries, pizza: buildPizza, momos: buildMomos,
  roll: buildRoll, sandwich: buildSandwich, chowmein: buildChowmein, shake: buildShake,
};

export function hasModel(key) { return !!MODELS[key]; }

/** Build a procedural model. Always returns { group, tilt, setExplode?, parts?, ... } */
export function buildProcedural(key, options = {}) {
  const fn = MODELS[key] || MODELS.burger;
  const out = fn(options || {});
  out.tilt = out.tilt || { x: 0, z: 0 };
  return out;
}
