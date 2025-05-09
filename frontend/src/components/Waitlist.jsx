import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch('https://api.murmurstack.com/join-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div id="waitlist" className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Join Our Waitlist Today
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            We'll reach out as soon as we can onboard you.
          </p>
        </motion.div>
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-md"
        >
          <div className="flex gap-x-4">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-auto rounded-md border-0 bg-white px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              placeholder="Enter your email"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary flex-none"
            >
              {status === 'loading' ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
          {status === 'success' && (
            <p className="mt-4 text-sm text-green-600">
              Thanks for joining! We'll be in touch soon.
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-sm text-red-600">
              Something went wrong. Please try again.
            </p>
          )}
        </motion.form>
      </div>
    </div>
  );
} 