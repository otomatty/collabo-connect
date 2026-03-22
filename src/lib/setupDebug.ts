type SetupDebugPayload = Record<string, unknown>;

declare global {
  interface Window {
    __collaboSetupDebug?: Array<{
      timestamp: string;
      scope: string;
      payload: SetupDebugPayload;
    }>;
  }
}

function isSetupDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("setupDebug") === "1") {
      return true;
    }

    if (window.localStorage.getItem("collabo:setupDebug") === "1") {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function setupDebug(scope: string, payload: SetupDebugPayload): void {
  if (!isSetupDebugEnabled()) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    scope,
    payload,
  };

  window.__collaboSetupDebug = [...(window.__collaboSetupDebug ?? []), entry].slice(-200);
  console.debug(`[setup-debug] ${scope}`, payload);
}

export function clearSetupDebug(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.__collaboSetupDebug = [];
}