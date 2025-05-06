import React from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CpuChipIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Zero Latency',
    description: 'Scrubbing happens in real-time with no lag. Unlock seamless, conversational AI.',
    icon: ClockIcon,
  },
  {
    name: 'Effortless Integration',
    description: 'Plug into any audio stream with a single API call. No need to refactor your codebase.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Perfect Transcription Quality',
    description: 'Keep what\'s important, get rid of anything that\'s not. Maintain complete accuracy.',
    icon: ShieldCheckIcon,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Features() {
  return (
    <div id="features" className="section-padding bg-white">
      <div className="container-custom">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Faster Processing
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to optimize your audio
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            MurmurStack removes filler words, white noise, and silence in your audio buffer, 
            saving token cost with our advanced processing pipeline.
          </p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
        >
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div key={feature.name} variants={item} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
} 