import { Fragment, useId } from 'react';
import { motion } from 'motion/react';
import { useDetailReducedMotion } from './useDetailReducedMotion';
import { duration, easeOut, photoWipe } from '../lib/motion';
import { getResponsiveImage } from '../data/responsiveImages';
import './DetailPageParts.css';

const heroWipe = photoWipe();

export function DetailHero({ number, label, lines, description, photo, desktopPhoto = photo }) {
  const reduceMotion = useDetailReducedMotion();
  const titleId = useId();

  return (
    <section className="detail-hero" aria-labelledby={titleId}>
      <motion.div
        className="detail-hero__photo"
        data-photo-reveal
        variants={heroWipe}
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'visible'}
      >
        <picture>
          <source media="(max-width: 767px)" srcSet={getResponsiveImage(photo)?.mobileSrcSet} />
          <source media="(max-width: 1199px)" srcSet={getResponsiveImage(photo)?.tabletSrcSet} />
          {desktopPhoto && <source media="(min-width: 1200px)" srcSet={desktopPhoto} />}
          <img
            src={desktopPhoto}
            srcSet={getResponsiveImage(photo)?.srcSet}
            sizes="1123px"
            alt=""
            width={1672}
            height={941}
            fetchPriority="high"
          />
        </picture>
      </motion.div>
      <div className="cinema-container detail-hero__layout">
        <p className="cinema-label detail-hero__label">
          <span aria-hidden="true">{number} / </span>{label}
        </p>
        <h1 id={titleId} className="detail-hero__title">
          {lines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && ' '}
              <span className="detail-hero__line">
                <motion.span
                  initial={reduceMotion ? false : { y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : duration.heading, delay: reduceMotion ? 0 : 0.06 + index * 0.075, ease: easeOut }}
                >
                  {line}
                  {index === lines.length - 1 && <i className="detail-hero__slash" aria-hidden="true" />}
                </motion.span>
              </span>
            </Fragment>
          ))}
        </h1>
        <p className="detail-hero__description">{description}</p>
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
      initial={reduceMotion ? false : { opacity: 0.72 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.13 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : delay, ease: easeOut }}
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
