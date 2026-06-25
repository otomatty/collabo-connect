import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeTagName } from "./tags.js";

// normalizeTagName is a pure function in tags.ts with no DB dependency, so it
// can be imported and tested directly (no D1 binding needed).
describe("normalizeTagName", () => {
  it("returns the input unchanged when already canonical", () => {
    assert.equal(normalizeTagName("React"), "React");
  });

  it("strips a leading half-width hash", () => {
    assert.equal(normalizeTagName("#React"), "React");
  });

  it("strips a leading full-width hash", () => {
    assert.equal(normalizeTagName("＃React"), "React");
  });

  it("strips a leading hash followed by whitespace", () => {
    assert.equal(normalizeTagName("# react"), "react");
  });

  it("strips repeated leading hashes", () => {
    assert.equal(normalizeTagName("##React"), "React");
  });

  it("trims surrounding whitespace and collapses internal runs", () => {
    assert.equal(normalizeTagName("  Web   Engineer  "), "Web Engineer");
  });

  it("preserves a trailing hash (e.g. C#)", () => {
    assert.equal(normalizeTagName("C#"), "C#");
  });

  it("returns null for empty input", () => {
    assert.equal(normalizeTagName(""), null);
  });

  it("returns null when only markers/whitespace remain", () => {
    assert.equal(normalizeTagName("#  "), null);
    assert.equal(normalizeTagName("＃"), null);
  });
});
