import { Fragment } from 'react';
import { motion } from 'motion/react';
import { useDetailReducedMotion } from './useDetailReducedMotion';
import './DetailPageParts.css';

const ease = [0.16, 1, 0.3, 1];
const photoStart = 'polygon(0 0, 78% 0, 58% 100%, 0 100%)';
const photoEnd = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

export function DetailHero({ number, label, lines, description, photo, children }) {
  const reduceMotion = useDetailReducedMotion();

  return (
    <section className="detail-hero" aria-labelledby="detail-page-title">
      <motion.div
        className="detail-hero__photo"
        initial={reduceMotion ? false : { clipPath: photoStart, opacity: 0.55 }}
        animate={{ clipPath: photoEnd, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.72, ease }}
      >
        <img src={photo} alt="" width={1672} height={941} fetchPriority="high" />
      </motion.div>
      <div className="cinema-container detail-hero__layout">
        <p className="cinema-label detail-hero__label">
          <span aria-hidden="true">{number} / </span>{label}
        </p>
        <h1 id="detail-page-title" className="detail-hero__title">
          {lines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && ' '}
              <span className="detail-hero__line">
                <motion.span
                  initial={reduceMotion ? false : { y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.07 + index * 0.09, ease }}
                >
                  {line}
                  {index === lines.length - 1 && <i className="detail-hero__slash" aria-hidden="true" />}
                </motion.span>
              </span>
            </Fragment>
          ))}
        </h1>
        <p className="detail-hero__description">{description}</p>
        {children}
      </div>
    </section>
  );
}

export function DetailReveal({ as: Tag = motion.div, className, delay = 0, children, ...props }) {
  const reduceMotion = useDetailReducedMotion();

  return (
    <Tag
      {...props}
      className={className ? `detail-reveal ${className}` : 'detail-reveal'}
      initial={reduceMotion ? false : { opacity: 0.65, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.13 }}
      transition={{ duration: reduceMotion ? 0 : 0.46, delay: reduceMotion ? 0 : delay, ease }}
    >
      {children}
    </Tag>
  );
}

export function DetailDisclosure({ id, open, children }) {
  return (
    <div id={id} className="detail-disclosure" data-open={open} inert={!open}>
      <div className="detail-disclosure__clip">{children}</div>
    </div>
  );
}
