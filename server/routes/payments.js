import express from 'express';
import Stripe from 'stripe';
import { verifyToken, supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// ── GET /api/payments/status ─────────────────────────────────────────────────
router.get('/status', async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user  = await verifyToken(token);

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, subscription_plan, subscription_end_date')
      .eq('user_id', user.id)
      .single();

    res.json(data || { subscription_status: null });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payments/create-checkout-session ───────────────────────────────
router.post('/create-checkout-session', async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user  = await verifyToken(token);
    const { plan } = req.body; // 'monthly' | 'annual'

    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan or price not configured' });
    }

    // Fetch or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  profile?.full_name || '',
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: user.id },
      },
      success_url: `${process.env.CLIENT_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/subscribe`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payments/create-portal-session ─────────────────────────────────
router.post('/create-portal-session', async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user  = await verifyToken(token);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payments/webhook ───────────────────────────────────────────────
// express.raw() is applied to this route in index.js (before express.json())
router.post('/webhook', async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[webhook] signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const obj = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const userId = obj.subscription_data?.metadata?.user_id
                  || obj.metadata?.user_id;
      if (userId) {
        // Retrieve the subscription to get its status/plan
        const sub = await stripe.subscriptions.retrieve(obj.subscription);
        await supabaseAdmin.from('profiles').update({
          stripe_subscription_id: sub.id,
          subscription_status:    sub.status,
          subscription_plan:      sub.items.data[0]?.price?.id,
          subscription_end_date:  sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        }).eq('user_id', userId);
      }
    }

    else if (event.type === 'customer.subscription.updated') {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('stripe_subscription_id', obj.id);

      if (profiles?.length) {
        await supabaseAdmin.from('profiles').update({
          subscription_status:   obj.status,
          subscription_plan:     obj.items.data[0]?.price?.id,
          subscription_end_date: obj.current_period_end
            ? new Date(obj.current_period_end * 1000).toISOString()
            : null,
        }).eq('stripe_subscription_id', obj.id);
      }
    }

    else if (event.type === 'customer.subscription.deleted') {
      await supabaseAdmin.from('profiles').update({
        subscription_status:   'canceled',
        subscription_end_date: new Date().toISOString(),
      }).eq('stripe_subscription_id', obj.id);
    }

    else if (event.type === 'invoice.payment_failed') {
      const subId = obj.subscription;
      if (subId) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_subscription_id', subId);
      }
    }
  } catch (err) {
    console.error('[webhook] handler error:', err);
  }

  res.json({ received: true });
});

export default router;
