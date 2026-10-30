import Stripe from "stripe";
import { db } from "../shared/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutLink({ domain, candidate_id, deployed_url }) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Modernized Website for ${domain}`,
            description: `Instant upgrade of ${domain}`,
          },
          unit_amount: 5000 // $50
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.SALES_SUCCESS_URL}?domain=${domain}`,
    cancel_url: `${process.env.SALES_CANCEL_URL}?domain=${domain}`,
    metadata: {
      domain,
      candidate_id,
      deployed_url
    }
  });

  return session.url;
}

export async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("[sales] Payment completed for:", session.metadata.domain);
    await db.query(
      `UPDATE candidate
       SET status = 'purchased', last_seen = NOW()
       WHERE id = $1`,
      [session.metadata.candidate_id]
    );
  }

  res.json({ received: true });
}
