
'use client';

import React from 'react';
import { Hero } from './components/Hero';
import { FeaturesSection } from './components/FeaturesSection';
import { PageLayout } from './components/PageLayout';

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <FeaturesSection />
    </PageLayout>
  );
}
