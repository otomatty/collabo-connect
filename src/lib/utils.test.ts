import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("単一のクラス名をマージする", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("複数のクラス名をマージする", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("条件付きクラスを正しく適用する", () => {
    const isActive = true;
    const isInactive = false;
    expect(cn("base", isActive && "active")).toBe("base active");
    expect(cn("base", isInactive && "active")).toBe("base");
  });

  it("Tailwindの競合クラスを上書きする", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("undefinedやnullを無視する", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});
