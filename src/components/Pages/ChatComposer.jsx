import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import style from "./ui.module.css";
import { CHAT_EMOJIS } from "../../utils/chatEmojis";

export function ChatComposer({
  message,
  onMessageChange,
  onSendText,
  onSendImage,
  disabled = false,
  isSending = false,
  isUploading = false,
}) {
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const previewCaptionRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [previewCaption, setPreviewCaption] = useState("");
  const [previewSending, setPreviewSending] = useState(false);

  const busy = disabled || isSending || isUploading || previewSending;
  const previewOpen = Boolean(pendingImage);

  useEffect(() => {
    if (!showEmojiPicker) return undefined;
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!previewOpen) return undefined;
    const t = setTimeout(() => previewCaptionRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [previewOpen]);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage?.previewUrl]);

  function closePreview() {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setPreviewCaption("");
    setPreviewSending(false);
  }

  function insertEmoji(emoji) {
    if (previewOpen) {
      setPreviewCaption((c) => c + emoji);
      return;
    }
    onMessageChange(message + emoji);
    setShowEmojiPicker(false);
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPreviewCaption("");
    setPendingImage((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl };
    });
  }

  async function confirmPreviewSend() {
    if (!pendingImage || previewSending) return;
    setPreviewSending(true);
    try {
      const compressed = await imageCompression(pendingImage.file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const ok = await onSendImage(compressed, previewCaption.trim());
      if (ok) closePreview();
    } catch {
      toast.error("Failed to send image");
    } finally {
      setPreviewSending(false);
    }
  }

  return (
    <>
      {previewOpen && (
        <div className={style.waImagePreview} role="dialog" aria-modal="true" aria-label="Image preview">
          <div className={style.waImagePreviewHeader}>
            <button
              type="button"
              className={style.waImagePreviewClose}
              onClick={closePreview}
              disabled={previewSending || isUploading}
              aria-label="Cancel"
            >
              <i className="bi bi-x-lg" />
            </button>
            <span>Preview</span>
          </div>
          <div className={style.waImagePreviewBody}>
            <img src={pendingImage.previewUrl} alt="Attachment preview" />
          </div>
          <div className={style.waImagePreviewFooter}>
            <input
              ref={previewCaptionRef}
              type="text"
              value={previewCaption}
              onChange={(e) => setPreviewCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  confirmPreviewSend();
                }
              }}
              placeholder="Add a caption..."
              disabled={previewSending || isUploading}
              className={style.waImagePreviewCaption}
            />
            <button
              type="button"
              className={style.waSendBtn}
              onClick={confirmPreviewSend}
              disabled={previewSending || isUploading}
              aria-label="Send image"
            >
              {previewSending || isUploading ? (
                <span className={style.waBtnSpinner} />
              ) : (
                <i className="bi bi-send-fill" />
              )}
            </button>
          </div>
        </div>
      )}

      <div className={style.waInputForm}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={style.waHiddenFile}
          onChange={onFileChange}
        />
        <button
          type="button"
          className={style.waInputIcon}
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          title="Attach image"
          aria-label="Attach image"
        >
          {isUploading ? <span className={style.waBtnSpinner} /> : <i className="bi bi-paperclip" />}
        </button>

        <div className={style.waEmojiWrap} ref={emojiRef}>
          <button
            type="button"
            className={`${style.waInputIcon} ${showEmojiPicker ? style.waInputIconActive : ""}`}
            disabled={busy}
            onClick={() => setShowEmojiPicker((v) => !v)}
            title="Emoji"
            aria-label="Insert emoji"
            aria-expanded={showEmojiPicker}
          >
            <i className="bi bi-emoji-smile" />
          </button>
          {showEmojiPicker && (
            <div className={style.waEmojiPicker} role="listbox" aria-label="Emoji picker">
              {CHAT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={style.waEmojiBtn}
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!busy && message.trim()) onSendText(e);
            }
          }}
          placeholder="Type a message"
          className={style.waInput}
          disabled={busy}
        />
        <button
          type="submit"
          className={style.waSendBtn}
          disabled={busy || !message.trim()}
          onClick={onSendText}
        >
          {isSending ? <span className={style.waBtnSpinner} /> : <i className="bi bi-send-fill" />}
        </button>
      </div>
    </>
  );
}
