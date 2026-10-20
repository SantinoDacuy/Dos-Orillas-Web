'use client';

import { gsap } from 'gsap';
import React, { useEffect, useRef } from 'react';

interface CrowdCanvasProps {
  src?: string;
  rows?: number;
  cols?: number;
  className?: string;
}

interface Peep {
  image: HTMLImageElement;
  rect: number[];
  width: number;
  height: number;
  drawArgs: (HTMLImageElement | number)[];
  x: number;
  y: number;
  anchorY: number;
  scaleX: number;
  walk: gsap.core.Timeline | null;
  setRect: (rect: number[]) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export const CrowdCanvas = ({
  src = '/images/crowd-peeps.png',
  rows = 15,
  cols = 7,
  className = 'absolute inset-0 h-full w-full',
}: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDisposed = false;

    const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
    const randomIndex = (array: unknown[]) => (randomRange(0, array.length) | 0);
    const removeFromArray = <T,>(array: T[], i: number): T | undefined => array.splice(i, 1)[0];
    const removeItemFromArray = <T,>(array: T[], item: T) => {
      const idx = array.indexOf(item);
      if (idx !== -1) removeFromArray(array, idx);
    };
    const removeRandomFromArray = <T,>(array: T[]): T | undefined => removeFromArray(array, randomIndex(array));
    const getRandomFromArray = <T,>(array: T[]): T => array[randomIndex(array) | 0] as T;

    const stage = {
      width: 0,
      height: 0,
    };

    // Keep all characters walking along the ground line so full bodies & legs are visible
    const resetPeep = ({ stage: currentStage, peep }: { stage: typeof stage; peep: Peep }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      // Slight vertical variance for perspective depth, but feet stay on ground
      const depthVariance = randomRange(-18, 8);
      const startY = currentStage.height - peep.height - 12 + depthVariance;

      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width - randomRange(10, 60);
        endX = currentStage.width + peep.width + randomRange(10, 60);
        peep.scaleX = 1;
      } else {
        startX = currentStage.width + peep.width + randomRange(10, 60);
        endX = -peep.width - randomRange(10, 60);
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;

      return { startX, startY, endX };
    };

    const normalWalk = ({ peep, props }: { peep: Peep; props: { startX: number; startY: number; endX: number } }) => {
      const { startX, startY, endX } = props;
      const xDuration = randomRange(7, 13);
      const yDuration = 0.26;

      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.7, 1.3));
      tl.fromTo(
        peep,
        { x: startX },
        {
          duration: xDuration,
          x: endX,
          ease: 'none',
        },
        0,
      );
      tl.to(
        peep,
        {
          duration: yDuration,
          repeat: Math.ceil(xDuration / yDuration),
          yoyo: true,
          y: startY - 7,
          ease: 'power1.inOut',
        },
        0,
      );

      return tl;
    };

    const walks = [normalWalk];

    const createPeep = ({
      image,
      rect,
    }: {
      image: HTMLImageElement;
      rect: number[];
    }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        drawArgs: [],
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        setRect: (newRect: number[]) => {
          peep.rect = newRect;
          const rW = newRect[2] ?? 240;
          const rH = newRect[3] ?? 324;
          // Natural scale with depth perspective
          const baseScale = randomRange(0.65, 0.76);
          peep.width = rW * baseScale;
          peep.height = rH * baseScale;
          peep.drawArgs = [peep.image, ...newRect, 0, 0, peep.width, peep.height];
        },
        render: (renderCtx: CanvasRenderingContext2D) => {
          renderCtx.save();
          renderCtx.translate(peep.x, peep.y);
          renderCtx.scale(peep.scaleX, 1);
          renderCtx.drawImage(
            peep.image,
            peep.rect[0] ?? 0,
            peep.rect[1] ?? 0,
            peep.rect[2] ?? 0,
            peep.rect[3] ?? 0,
            0,
            0,
            peep.width,
            peep.height,
          );
          renderCtx.restore();
        },
      };

      peep.setRect(rect);
      return peep;
    };

    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeeps = (img: HTMLImageElement) => {
      const { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height) return;
      const total = rows * cols;
      const rectWidth = width / rows;
      const rectHeight = height / cols;

      for (let i = 0; i < total; i++) {
        allPeeps.push(
          createPeep({
            image: img,
            rect: [
              (i % rows) * rectWidth,
              ((i / rows) | 0) * rectHeight,
              rectWidth,
              rectHeight,
            ],
          }),
        );
      }
    };

    const addPeepToCrowd = (): Peep | null => {
      const peep = removeRandomFromArray(availablePeeps);
      if (!peep) return null;

      const walkFactory = getRandomFromArray(walks);
      const walk = walkFactory({
        peep,
        props: resetPeep({ peep, stage }),
      }).eventCallback('onComplete', () => {
        if (isDisposed) return;
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

      peep.walk = walk;
      crowd.push(peep);
      // Sort by anchorY so closer characters render on top of farther ones
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    };

    // More characters walking simultaneously for a rich, lively crowd
    const initCrowd = () => {
      const targetCrowdSize = Math.min(30, allPeeps.length);
      while (availablePeeps.length > 0 && crowd.length < targetCrowdSize) {
        const added = addPeepToCrowd();
        if (added?.walk) {
          added.walk.progress(Math.random());
        }
      }
    };

    const render = () => {
      if (!canvas || isDisposed) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      crowd.forEach((peep) => {
        peep.render(ctx);
      });

      ctx.restore();
    };

    const resize = () => {
      if (!canvas || isDisposed) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      stage.width = rect.width;
      stage.height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      crowd.forEach((peep) => {
        peep.walk?.kill();
      });

      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);

      initCrowd();
    };

    const img = new Image();
    const init = () => {
      if (isDisposed) return;
      createPeeps(img);
      resize();
      gsap.ticker.add(render);
    };

    if (img.complete && img.naturalWidth) {
      init();
    } else {
      img.onload = init;
    }
    img.src = src;

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      gsap.ticker.remove(render);
      crowd.forEach((peep) => {
        peep.walk?.kill();
      });
      allPeeps.length = 0;
      crowd.length = 0;
      availablePeeps.length = 0;
    };
  }, [src, rows, cols]);

  return <canvas ref={canvasRef} className={className} />;
};

export default CrowdCanvas;
