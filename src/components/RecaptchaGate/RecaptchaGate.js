import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  getRecaptchaResponse,
  isRecaptchaEnabled,
  loadRecaptchaScript,
  renderRecaptchaWidget,
  resetRecaptchaWidget,
} from "../../utils/recaptcha";
import style from "./recaptchaGate.module.css";

export const RecaptchaGate = forwardRef(function RecaptchaGate(
  { onSolvedChange },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useImperativeHandle(ref, () => ({
    getToken() {
      return getRecaptchaResponse(widgetIdRef.current);
    },
    reset() {
      resetRecaptchaWidget(widgetIdRef.current);
      onSolvedChange?.(false);
    },
  }));

  useEffect(() => {
    if (!isRecaptchaEnabled()) {
      onSolvedChange?.(true);
      return undefined;
    }

    let cancelled = false;

    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current != null) {
          return;
        }

        widgetIdRef.current = renderRecaptchaWidget(containerRef.current, {
          callback: () => onSolvedChange?.(true),
          "expired-callback": () => onSolvedChange?.(false),
          "error-callback": () => onSolvedChange?.(false),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          onSolvedChange?.(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onSolvedChange]);

  if (!isRecaptchaEnabled()) {
    return null;
  }

  if (loadError) {
    return (
      <div className={style.recaptchaFallback}>
        Security check could not load. Refresh the page or check your connection.
      </div>
    );
  }

  return (
    <div className={style.recaptchaWrap}>
      <div ref={containerRef} />
    </div>
  );
});
