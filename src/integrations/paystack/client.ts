/**
 * Paystack Client Configuration
 * Handles payment processing and subscription management
 */

// Paystack configuration
export const PAYSTACK_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_...',
  SECRET_KEY: import.meta.env.VITE_PAYSTACK_SECRET_KEY || 'sk_test_...',
  BASE_URL: 'https://api.paystack.co',
  CURRENCY: 'GHS', // Ghanaian Cedi
  CHANNELS: ['card', 'mobile_money', 'bank'], // Supported payment channels
};

// Payment plan configurations
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'GHS',
    interval: 'month',
    features: [
      '3 templates per month',
      'Basic shapes and fonts',
      'Watermarked exports',
      'Standard support'
    ],
    limits: {
      templates: 3,
      exports: 10,
      storage: '100MB'
    }
  },
  STUDENT_PRO: {
    id: 'student_pro',
    name: 'Student Pro',
    price: 50,
    currency: 'GHS',
    interval: 'month',
    features: [
      '30 templates per month',
      'High-resolution exports',
      'No watermarks',
      'Advanced features',
      'Priority support'
    ],
    limits: {
      templates: 30,
      exports: 150,
      storage: '1GB'
    }
  },
  CREATOR_PRO: {
    id: 'creator_pro',
    name: 'Creator Pro',
    price: 100,
    currency: 'GHS',
    interval: 'month',
    features: [
      'Unlimited templates',
      'Custom font uploads',
      'PDF export',
      'Analytics dashboard',
      'Priority support',
      'API access'
    ],
    limits: {
      templates: -1, // Unlimited
      exports: 600,
      storage: '5GB'
    }
  },
  DEPARTMENT: {
    id: 'department',
    name: 'Department Plan',
    price: 200,
    currency: 'GHS',
    interval: 'month',
    features: [
      'Unlimited templates',
      'Custom branding',
      'Bulk generation',
      'Team collaboration',
      'Analytics dashboard',
      'Priority support'
    ],
    limits: {
      templates: -1,
      exports: 1200,
      storage: '10GB'
    }
  },
  CHURCH: {
    id: 'church',
    name: 'Church Plan',
    price: 300,
    currency: 'GHS',
    interval: 'month',
    features: [
      'Everything in Department',
      'Blessing cards & certificates',
      'Seasonal template packs',
      'Bulk event generation',
      'White-label options'
    ],
    limits: {
      templates: -1,
      exports: 2500,
      storage: '20GB'
    }
  },
  FACULTY: {
    id: 'faculty',
    name: 'Faculty Plan',
    price: 600,
    currency: 'GHS',
    interval: 'month',
    features: [
      'Everything in Church',
      'Multi-department access',
      'API integration',
      'Custom development',
      'Dedicated support'
    ],
    limits: {
      templates: -1,
      exports: 6000,
      storage: '50GB'
    }
  }
};

// Event package configurations
export const EVENT_PACKAGES = {
  GRADUATION: {
    id: 'graduation',
    name: 'Graduation Package',
    price: 400,
    currency: 'GHS',
    description: 'Complete graduation event solution',
    includes: [
      '600 personalized certificates',
      'Invitation templates',
      'Program booklets',
      'QR codes for graduates',
      'Bulk generation tools'
    ]
  },
  CONFERENCE: {
    id: 'conference',
    name: 'Conference Package',
    price: 600,
    currency: 'GHS',
    description: 'Professional conference materials',
    includes: [
      '300 participant certificates',
      'Speaker badges',
      'Event flyers',
      'Attendance tracking',
      'Custom branding'
    ]
  },
  SEMESTER: {
    id: 'semester',
    name: 'Semester Package',
    price: 900,
    currency: 'GHS',
    description: 'Full semester event coverage',
    includes: [
      'All events for one semester',
      'Unlimited personalization',
      'Brand consistency',
      'Priority support',
      'Custom templates'
    ]
  }
};

// Paystack API endpoints
export const PAYSTACK_ENDPOINTS = {
  INITIALIZE: '/transaction/initialize',
  VERIFY: '/transaction/verify',
  SUBSCRIPTION: '/subscription',
  CUSTOMER: '/customer',
  PLAN: '/plan',
  TRANSACTION: '/transaction',
};

/**
 * Initialize a payment transaction
 */
export async function initializePayment(data: {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.BASE_URL}${PAYSTACK_ENDPOINTS.INITIALIZE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount * 100, // Convert to kobo (smallest currency unit)
        reference: data.reference,
        callback_url: data.callback_url,
        channels: PAYSTACK_CONFIG.CHANNELS,
        currency: PAYSTACK_CONFIG.CURRENCY,
        metadata: data.metadata || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment initialization failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(reference: string) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.BASE_URL}${PAYSTACK_ENDPOINTS.VERIFY}/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Payment verification failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

/**
 * Create a subscription plan
 */
export async function createSubscriptionPlan(planData: {
  name: string;
  amount: number;
  interval: string;
  description?: string;
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.BASE_URL}${PAYSTACK_ENDPOINTS.PLAN}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: planData.name,
        amount: planData.amount * 100, // Convert to kobo
        interval: planData.interval,
        description: planData.description,
        currency: PAYSTACK_CONFIG.CURRENCY,
      }),
    });

    if (!response.ok) {
      throw new Error(`Plan creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Plan creation error:', error);
    throw error;
  }
}

/**
 * Create a customer
 */
export async function createCustomer(customerData: {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.BASE_URL}${PAYSTACK_ENDPOINTS.CUSTOMER}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      throw new Error(`Customer creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Customer creation error:', error);
    throw error;
  }
}

/**
 * Initialize subscription payment
 */
export async function initializeSubscription(data: {
  email: string;
  plan_code: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.BASE_URL}${PAYSTACK_ENDPOINTS.SUBSCRIPTION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: data.email,
        plan: data.plan_code,
        reference: data.reference,
        callback_url: data.callback_url,
        metadata: data.metadata || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Subscription initialization failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Subscription initialization error:', error);
    throw error;
  }
}

/**
 * Get payment channels
 */
export function getPaymentChannels() {
  return PAYSTACK_CONFIG.CHANNELS.map(channel => ({
    id: channel,
    name: channel === 'mobile_money' ? 'Mobile Money' : 
          channel === 'bank' ? 'Bank Transfer' : 
          'Credit/Debit Card',
    icon: channel === 'mobile_money' ? '📱' : 
          channel === 'bank' ? '🏦' : '💳'
  }));
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Generate unique reference
 */
export function generateReference(prefix: string = 'GENEDIT') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}
