export const easeOut = [0.16, 1, 0.3, 1];
export const easeGlide = [0.22, 1, 0.36, 1];

export const duration = {
  feedback: 0.22,
  selector: 0.34,
  page: 0.4,
  step: 0.38,
  price: 0.5,
  heading: 0.58,
  photo: 0.68,
  dialogBackdrop: 0.2,
  dialogOpen: 0.35,
  dialogStep: 0.35,
  dialogClose: 0.25,
  dialogStagger: 0.07,
};

export function photoWipe(from = 'left', delay = 0) {
  const start = {
    left: 'polygon(0 0, 72% 0, 49% 100%, 0 100%)',
    right: 'polygon(28% 0, 100% 0, 100% 100%, 51% 100%)',
    bottom: 'polygon(0 30%, 100% 12%, 100% 100%, 0 100%)',
  };

  return {
    hidden: { clipPath: start[from] },
    visible: {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      transition: { duration: duration.photo, delay, ease: easeOut },
      transitionEnd: { clipPath: 'none' },
    },
  };
}
