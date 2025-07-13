import { Client, RevenueStats, PlanInfo, ActivityLogEntry } from '../types';

// Plan definitions with pricing
export const PLANS: Record<'starter' | 'pro', PlanInfo> = {
  starter: {
    name: 'starter',
    price: 100,
    features: [
      'Basic AI Chat Flows',
      'Up to 100 conversations/month',
      'Email support',
      'Basic analytics'
    ]
  },
  pro: {
    name: 'pro',
    price: 150,
    features: [
      'Advanced AI Chat Flows',
      'Unlimited conversations',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'Multi-platform support'
    ]
  }
};

// Calculate comprehensive revenue statistics
export const calculateRevenueStats = (clients: Client[]): RevenueStats => {
  let starterCount = 0;
  let proCount = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;

  clients.forEach(client => {
    // Count by plan
    if (client.plan === 'starter') {
      starterCount++;
    } else if (client.plan === 'pro') {
      proCount++;
    }

    // Count by payment status
    if (client.payment_status === 'paid') {
      paidCount++;
    } else if (client.payment_status === 'unpaid') {
      unpaidCount++;
    } else if (client.payment_status === 'overdue') {
      overdueCount++;
    } else {
      // Default to unpaid if no status set
      unpaidCount++;
    }
  });

  // Calculate revenue from paid clients only
  const paidClients = clients.filter(client => client.payment_status === 'paid');
  const starterRevenue = paidClients.filter(c => c.plan === 'starter').length * PLANS.starter.price;
  const proRevenue = paidClients.filter(c => c.plan === 'pro').length * PLANS.pro.price;
  const totalRevenue = starterRevenue + proRevenue;

  return {
    totalRevenue,
    starterRevenue,
    proRevenue,
    starterCount,
    proCount,
    paidCount,
    unpaidCount,
    overdueCount
  };
};

// Calculate monthly recurring revenue (MRR)
export const calculateMRR = (clients: Client[]): number => {
  const stats = calculateRevenueStats(clients);
  return stats.totalRevenue; // Assuming monthly billing
};

// Calculate potential revenue (if all clients paid)
export const calculatePotentialRevenue = (clients: Client[]): number => {
  return clients.reduce((total, client) => {
    if (client.plan === 'starter') {
      return total + PLANS.starter.price;
    } else if (client.plan === 'pro') {
      return total + PLANS.pro.price;
    }
    return total + PLANS.starter.price; // Default to starter if no plan set
  }, 0);
};

// Get plan info for a client
export const getClientPlanInfo = (client: Client): PlanInfo => {
  return PLANS[client.plan || 'starter'];
};

// Calculate outstanding revenue (unpaid + overdue)
export const calculateOutstandingRevenue = (clients: Client[]): number => {
  return clients
    .filter(client => client.payment_status === 'unpaid' || client.payment_status === 'overdue')
    .reduce((total, client) => {
      const planInfo = getClientPlanInfo(client);
      return total + planInfo.price;
    }, 0);
};

// Get payment status color for UI
export const getPaymentStatusColor = (status: Client['payment_status']): string => {
  switch (status) {
    case 'paid':
      return '#10B981'; // Green
    case 'unpaid':
      return '#F59E0B'; // Yellow
    case 'overdue':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

// Get payment status display text
export const getPaymentStatusText = (status: Client['payment_status']): string => {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'unpaid':
      return 'Unpaid';
    case 'overdue':
      return 'Overdue';
    default:
      return 'Unknown';
  }
};

// Get plan badge color
export const getPlanColor = (plan: Client['plan']): string => {
  switch (plan) {
    case 'starter':
      return '#3B82F6'; // Blue
    case 'pro':
      return '#8B5CF6'; // Purple
    default:
      return '#6B7280'; // Gray
  }
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Calculate revenue growth from previous period
export const calculateRevenueGrowth = (
  currentRevenue: number,
  previousRevenue: number
): { amount: number; percentage: number; isGrowth: boolean } => {
  const amount = currentRevenue - previousRevenue;
  const percentage = previousRevenue > 0 ? (amount / previousRevenue) * 100 : 0;
  const isGrowth = amount > 0;

  return { amount, percentage, isGrowth };
};

// Generate revenue summary text
export const generateRevenueSummary = (stats: RevenueStats): string => {
  const potentialTotal = (stats.starterCount * PLANS.starter.price) + (stats.proCount * PLANS.pro.price);
  const collectionRate = potentialTotal > 0 ? (stats.totalRevenue / potentialTotal) * 100 : 0;

  return `Current MRR: ${formatCurrency(stats.totalRevenue)}
Collection Rate: ${collectionRate.toFixed(1)}%
Outstanding: ${formatCurrency(potentialTotal - stats.totalRevenue)}

Plan Breakdown:
• ${stats.starterCount} Starter (${formatCurrency(stats.starterCount * PLANS.starter.price)} potential)
• ${stats.proCount} Pro (${formatCurrency(stats.proCount * PLANS.pro.price)} potential)

Payment Status:
• ${stats.paidCount} Paid (${formatCurrency(stats.totalRevenue)})
• ${stats.unpaidCount} Unpaid
• ${stats.overdueCount} Overdue`;
};

// Create activity log entry
export const createActivityLog = (
  type: ActivityLogEntry['type'],
  description: string,
  clientId?: string,
  clientName?: string,
  data?: Record<string, any>
): ActivityLogEntry => {
  return {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    description,
    client_id: clientId,
    client_name: clientName,
    timestamp: new Date().toISOString(),
    data
  };
};

// Get clients needing payment follow-up
export const getClientsNeedingPaymentFollowup = (clients: Client[]): Client[] => {
  return clients.filter(client => 
    client.payment_status === 'unpaid' || client.payment_status === 'overdue'
  ).sort((a, b) => {
    // Prioritize overdue, then unpaid
    if (a.payment_status === 'overdue' && b.payment_status !== 'overdue') return -1;
    if (b.payment_status === 'overdue' && a.payment_status !== 'overdue') return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
};

// Calculate client lifetime value based on plan
export const calculateClientLTV = (client: Client, monthsActive: number = 12): number => {
  const planInfo = getClientPlanInfo(client);
  return planInfo.price * monthsActive;
};

// Generate plan comparison data
export const generatePlanComparison = () => {
  return {
    starter: PLANS.starter,
    pro: PLANS.pro,
    savings: PLANS.pro.price - PLANS.starter.price,
    valueProposition: `Pro plan offers ${PLANS.pro.features.length - PLANS.starter.features.length} additional features for just $${PLANS.pro.price - PLANS.starter.price} more per month.`
  };
};