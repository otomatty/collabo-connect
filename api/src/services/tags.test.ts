import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeTagName } from "./tags.js";

// normalizeTagName lives in tags.ts which transitively imports db.ts. The pg
// Pool is constructed lazily (it only connects on the first query), so a dummy
// DATABASE_URL is enough to import the module for this pure-function test — see
// the `test` script in package.json which sets it.
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
