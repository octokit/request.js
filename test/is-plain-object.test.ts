import { isPlainObject } from "../src/is-plain-object.ts";

describe("isPlainObject", () => {
  function Foo() {
    // @ts-ignore
    this.a = 1;
  }

  it("isPlainObject(NaN)", () => {
    expect(isPlainObject(NaN)).toBe(false);
  });
  it("isPlainObject([1, 2, 3])", () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });
  it("isPlainObject(null)", () => {
    expect(isPlainObject(null)).toBe(false);
  });
  it("isPlainObject({ 'x': 0, 'y': 0 })", () => {
    expect(isPlainObject({ x: 0, y: 0 })).toBe(true);
  });
  it("isPlainObject(Object.create(null))", () => {
    expect(isPlainObject(Object.create(null))).toBe(true);
  });
  it("isPlainObject(Object.create(new Foo()))", () => {
    // @ts-ignore
    expect(isPlainObject(Object.create(new Foo()))).toBe(false);
  });
  it("isPlainObject(Object.create(new Date()))", () => {
    expect(isPlainObject(Object.create(new Date()))).toBe(false);
  });
});
