import React from 'react';
import { motion } from 'framer-motion';
import { smoothSpring } from '../lib/animations';

const Logo = ({ size = 28, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ ...smoothSpring, delay: 0.1 }}
      className={className}
      style={{ display: 'inline-flex' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Brand Indigo/Blue Gradient */}
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" /> {/* Ocean Blue */}
            <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo */}
          </linearGradient>
          
          {/* Glowing shadow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Orbital Ring representing Logistics/Swift Delivery */}
        <path
          d="M20 50 C 20 28, 80 28, 80 50 C 80 72, 20 72, 20 50"
          stroke="url(#logoGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="140 60"
          transform="rotate(-20 50 50)"
        />

        {/* Central Cream Droplet representing Milk */}
        <path
          d="M50 22
             C61.5 22, 70 38.5, 70 51.5
             C70 62.5, 61 71.5, 50 71.5
             C39 71.5, 30 62.5, 30 51.5
             C30 38.5, 38.5 22, 50 22 Z"
          fill="url(#logoGradient)"
          filter="url(#glow)"
        />

        {/* Inner reflection curve (gives droplet a premium gloss shine) */}
        <path
          d="M40 45 C 44 36, 48 36, 52 45"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />
        
        {/* Small drop splash detail */}
        <circle cx="72" cy="30" r="4" fill="#0284c7" />
      </svg>
    </motion.div>
  );
};

export default Logo;
