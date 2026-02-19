'use client';

import React from 'react';
import { Hero } from './components/Hero';
import { LiveMarketsStrip } from './components/LiveMarketsStrip';
import { HowItWorks } from './components/HowItWorks';
import { FeaturesSection } from './components/FeaturesSection';
import { UseCases } from './components/UseCases';
import { NumbersStrip } from './components/NumbersStrip';
import { PageLayout } from './components/PageLayout';

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <LiveMarketsStrip />
      <HowItWorks />
      <FeaturesSection />
      <UseCases />
      <NumbersStrip />
    </PageLayout>
  );
}
