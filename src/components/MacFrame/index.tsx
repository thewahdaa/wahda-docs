import React, {useCallback, useEffect, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface MacFrameProps {
  /** Image src — relative paths are resolved via useBaseUrl. */
  src: string;
  /** Accessibility text for the image. */
  alt: string;
  /** Text shown in the window title bar. Defaults to "The Wahda Cloud — Skyline". */
  title?: string;
  /** Optional italic caption rendered below the screenshot. */
  caption?: string;
}

/**
 * MacFrame — wraps a screenshot in macOS window chrome
 * (traffic lights + centered title + drop shadow). Usable directly
 * in .md/.mdx files since it's registered globally via MDXComponents.
 *
 * Click the image to zoom into a full-screen lightbox; click the
 * backdrop or press Escape to close.
 */
export default function MacFrame({
  src,
  alt,
  title = 'The Wahda Cloud — Skyline',
  caption,
}: MacFrameProps): React.ReactElement {
  const resolvedSrc = useBaseUrl(src);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const open = useCallback(() => {
    setIsMounted(true);
    // Two RAFs so the initial styles paint before the transition target.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
        setIsOpen(true);
      });
    });
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    // Unmount after the transition finishes so the fade-out is visible.
    setTimeout(() => {
      setIsOpen(false);
      setIsMounted(false);
    }, 220);
  }, []);

  // ESC closes.
  useEffect(() => {
    if (!isMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMounted, close]);

  // Freeze background scroll while open.
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close when the click lands on the backdrop itself, not the image.
      if (e.target === e.currentTarget) close();
    },
    [close],
  );

  return (
    <>
      <figure className={styles.frame}>
        <div className={styles.bar} aria-hidden="true">
          <div className={styles.dots}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.title}>{title}</div>
          <div className={styles.spacer} />
        </div>
        <button
          type="button"
          className={styles.imageButton}
          onClick={open}
          aria-label={`Expand screenshot: ${alt}`}
        >
          <img className={styles.image} src={resolvedSrc} alt={alt} loading="lazy" />
        </button>
        {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </figure>

      {isMounted && (
        <div
          className={`${styles.lightbox} ${isVisible ? styles.lightboxOpen : ''}`}
          onClick={onBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <img className={styles.lightboxImage} src={resolvedSrc} alt={alt} />
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={close}
            aria-label="Close full-size view"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
