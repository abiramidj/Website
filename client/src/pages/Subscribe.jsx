import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { createCheckoutSession, createPortalSession } from '../lib/api.js';
import styles from './Subscribe.module.css';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$9.99',
    period: '/month',
    description: 'Full access, billed monthly',
    badge: null,
    color: '#1d4ed8',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$79.99',
    period: '/year',
    description: 'Best value — save 33%',
    badge: 'Best value',
    color: '#059669',
  },
];

const FEATURES = [
  'Unlimited quiz attempts across all topics',
  'Full access to the chapter library',
  'AI-generated questions updated regularly',
  'Performance analytics and score history',
  'Mobile-friendly — study anywhere',
  '7-day free trial, cancel anytime',
];

export default function Subscribe() {
  const { profile, isAdmin, isSubscribed, getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // plan id being loaded
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe(planId) {
    setError('');
    setLoading(planId);
    try {
      const { url } = await createCheckoutSession(planId, getToken);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(null);
    }
  }

  async function handleManageBilling() {
    setError('');
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession(getToken);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to open billing portal.');
      setPortalLoading(false);
    }
  }

  // Admin bypass
  if (isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.adminNotice}>
          Admin accounts have full access — no subscription required.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>OncoCliniq Pro</div>
        <h1 className={styles.title}>Unlock Your Full Learning Experience</h1>
        <p className={styles.subtitle}>
          Access all quizzes, chapters, and performance analytics. Start with a free 7-day trial — no credit card upfront.
        </p>
      </div>

      {/* Active subscription banner */}
      {isSubscribed && (
        <div className={styles.activeBanner}>
          <span className={styles.activeDot} />
          <span>Your <strong>Pro</strong> subscription is active.</span>
          <button
            className={styles.portalBtn}
            onClick={handleManageBilling}
            disabled={portalLoading}
          >
            {portalLoading ? 'Opening…' : 'Manage billing →'}
          </button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {/* Plan cards */}
      <div className={styles.plans}>
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`${styles.card} ${plan.badge ? styles.cardFeatured : ''}`}
          >
            {plan.badge && (
              <div className={styles.badge}>{plan.badge}</div>
            )}
            <div className={styles.planLabel}>{plan.label}</div>
            <div className={styles.planPrice}>
              {plan.price}
              <span className={styles.planPeriod}>{plan.period}</span>
            </div>
            <p className={styles.planDesc}>{plan.description}</p>

            <button
              className={`${styles.planBtn} ${plan.badge ? styles.planBtnFeatured : ''}`}
              onClick={() => handleSubscribe(plan.id)}
              disabled={!!loading || isSubscribed}
            >
              {loading === plan.id
                ? 'Redirecting…'
                : isSubscribed
                  ? 'Current plan'
                  : 'Start free trial →'}
            </button>
          </div>
        ))}
      </div>

      {/* Feature list */}
      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>Everything included in Pro</h2>
        <ul className={styles.featureList}>
          {FEATURES.map(f => (
            <li key={f} className={styles.featureItem}>
              <span className={styles.featureCheck}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.fine}>
        By subscribing you agree to our terms. Cancel anytime from your billing portal.
        Prices shown in USD.
      </p>
    </div>
  );
}
