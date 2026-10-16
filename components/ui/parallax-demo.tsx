'use client';

import React from 'react';
import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

export default function ParallaxDemo() {
  return (
    <div className="relative w-full">
      <ParallaxComponent />
      <div className="osmo-credits text-center py-6 text-xs text-white/50 bg-[#071725]">
        <p className="osmo-credits__p">
          Resource inspired by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.osmo.supply/"
            className="osmo-credits__p-a text-[#38bdf8] underline hover:opacity-80 transition-opacity"
          >
            Osmo
          </a>
        </p>
      </div>
    </div>
  );
}
