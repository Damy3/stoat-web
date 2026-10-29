import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

import { Trans, useLingui } from "@lingui/solid/macro";

import { CategoryButton, Column } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

declare type DesktopConfig = {
  microphoneMuteShortcut: string;
};

declare global {
  interface Window {
    native: {
      getMicMuteShortcut(): Promise<string>;
      setMicMuteShortcut(accelerator: string): Promise<string>;
    };
  }
}

export default function Shortcuts() {
  const { t } = useLingui();
  const [config, setConfig] = createSignal<DesktopConfig>({
    microphoneMuteShortcut: window.native.getMicMuteShortcut
      ? ""
      : "",
  });

  onMount(async () => {
    if (window.native?.getMicMuteShortcut) {
      const value = await window.native.getMicMuteShortcut();
      setConfig({ microphoneMuteShortcut: value });
    }
  });

  const [capturing, setCapturing] = createSignal(false);
  const [pending, setPending] = createSignal("");

  createEffect(() => {
    if (!capturing()) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      let key = e.key;
      if (key === " ") key = "Space";
      else if (key.length === 1) key = key.toUpperCase();
      if (["Control", "Shift", "Alt", "Meta"].includes(key)) return;
      parts.push(key);
      setPending(parts.join("+"));
    };
    window.addEventListener("keydown", handler, true);
    onCleanup(() => window.removeEventListener("keydown", handler, true));
  });

  return (
    <>
      {capturing() && (
        <Portal>
          <div
          style={{
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "z-index": "99999",
          }}
        >
          <div
            style={{
              background: "var(--md-sys-color-surface-container-high)",
              color: "var(--md-sys-color-on-surface)",
              padding: "24px",
              "border-radius": "12px",
              "min-width": "320px",
              display: "flex",
              "flex-direction": "column",
              gap: "12px",
              "box-shadow": "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <p>{t`Press the desired key combination...`}</p>
            <input
              type="text"
              readOnly
              value={pending() || t`Waiting for input...`}
              style={{
                width: "100%",
                background: "var(--md-sys-color-surface-container)",
                color: "var(--md-sys-color-on-surface)",
                border: "1px solid var(--md-sys-color-outline)",
                "border-radius": "6px",
                padding: "8px",
              }}
            />
            <div style={{ display: "flex", gap: "8px", "justify-content": "flex-end" }}>
              <button onClick={() => setCapturing(false)}>{t`Cancel`}</button>
              {pending() && (
                <button
                  onClick={async () => {
                    const saved = await window.native.setMicMuteShortcut(pending());
                    setConfig({ microphoneMuteShortcut: saved });
                    setPending("");
                    setCapturing(false);
                  }}
                >
                  {t`Save`}
                </button>
              )}
            </div>
          </div>
        </div>
        </Portal>
      )}
      <Column gap="lg">
        <CategoryButton.Group>
          <CategoryButton
            icon={<Symbol>keyboard</Symbol>}
            description={t`Current: ${config().microphoneMuteShortcut}`}
            onClick={() => setCapturing(true)}
          >
            <Trans>Mic Toggle</Trans>
          </CategoryButton>
        </CategoryButton.Group>
      </Column>
    </>
  );
}