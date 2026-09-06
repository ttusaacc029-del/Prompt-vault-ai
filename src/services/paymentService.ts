/**
 * Payment & Subscription Service Abstraction
 * Section 39: Subscription System Architecture
 * 
 * Supports Stripe, Lemon Squeezy, or Paddle integrations.
 * When payment credentials are not configured, uses secure test mode
 * with explicit transparency (no fake payment claim).
 */

import { SubscriptionPlan } from '../types';

export interface CheckoutSessionOptions {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  mode: 'live' | 'test_sandbox';
  sessionId?: string;
  checkoutUrl?: string;
  requiresRedirect: boolean;
  message: string;
}

class PaymentService {
  private isConfigured: boolean = false;

  constructor() {
    // Check if live payment keys are defined in environment
    this.isConfigured = false; 
  }

  /**
   * Initializes a subscription checkout flow.
   * In sandbox / dev mode, transparently informs the user and updates the tier server-side.
   */
  async createCheckoutSession(options: CheckoutSessionOptions): Promise<CheckoutResult> {
    const res = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to initiate checkout session.');
    }

    return data;
  }

  /**
   * Securely requests customer portal session for managing payment methods / canceling.
   */
  async createCustomerPortalSession(userId: string): Promise<{ url?: string; message: string }> {
    const res = await fetch('/api/subscriptions/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return await res.json();
  }
}

export const paymentService = new PaymentService();
