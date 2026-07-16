/**
 * helpers/typeGuards — runtime type predicates.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  isPlainObject,
  isObject,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isUndefined,
  isNull,
  isNil,
  isSymbol,
  isPrimitive,
  isDate,
  isRegExp,
  isPromise,
  isEmpty,
} from "../typeGuards";

describe("object guards", () => {
  it("isPlainObject accepts object literals and null-proto objects, rejects the rest", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });

  it("isObject accepts objects but not arrays or null", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
  });
});

describe("primitive guards", () => {
  it("isString / isNumber / isBoolean", () => {
    expect(isString("x")).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isNumber(1)).toBe(true);
    expect(isNumber(NaN)).toBe(false); // NaN excluded
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(0)).toBe(false);
  });

  it("isFunction / isSymbol", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction({})).toBe(false);
    expect(isSymbol(Symbol("s"))).toBe(true);
    expect(isSymbol("s")).toBe(false);
  });

  it("isUndefined / isNull / isNil", () => {
    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined(null)).toBe(false);
    expect(isNull(null)).toBe(true);
    expect(isNull(undefined)).toBe(false);
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
    expect(isNil(0)).toBe(false);
  });

  it("isPrimitive covers all primitive kinds", () => {
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(undefined)).toBe(true);
    expect(isPrimitive("s")).toBe(true);
    expect(isPrimitive(1)).toBe(true);
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(Symbol())).toBe(true);
    expect(isPrimitive(10n)).toBe(true);
    expect(isPrimitive({})).toBe(false);
  });
});

describe("special guards", () => {
  it("isDate rejects invalid dates", () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date("nonsense"))).toBe(false);
    expect(isDate("2020-01-01")).toBe(false);
  });

  it("isRegExp", () => {
    expect(isRegExp(/x/)).toBe(true);
    expect(isRegExp("/x/")).toBe(false);
  });

  it("isPromise accepts native promises and thenable/catchable duck types", () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise({ then: () => {}, catch: () => {} })).toBe(true);
    expect(isPromise({ then: () => {} })).toBe(false); // missing catch
    expect(isPromise(42)).toBe(false);
  });
});

describe("isEmpty", () => {
  it("nil, empty string/array, empty Map/Set, empty object are empty", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty("")).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty(new Map())).toBe(true);
    expect(isEmpty(new Set())).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it("non-empty values are not empty", () => {
    expect(isEmpty("x")).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty(new Map([["a", 1]]))).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty(0)).toBe(false); // numbers are never "empty"
    expect(isEmpty(false)).toBe(false);
  });
});
