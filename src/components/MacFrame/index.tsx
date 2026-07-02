import React from 'react';
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
 */
export default function MacFrame({
  src,
  alt,
  title = 'The Wahda Cloud — Skyline',
  caption,
}: MacFrameProps): React.ReactElement {
  const resolvedSrc = useBaseUrl(src);
  return (
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
      <img className={styles.image} src={resolvedSrc} alt={alt} loading="lazy" />
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
