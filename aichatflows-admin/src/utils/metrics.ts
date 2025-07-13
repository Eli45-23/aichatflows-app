import { Client, Payment, Goal, BusinessVisit } from '../types';

export interface WeeklyMetrics {
  weekStart: Date;
  weekEnd: Date;
  newClients: number;
  clientNames: string[];
  businessVisits: number;
  visitLocations: string[];
  goalsCompleted: number;
  goalTitles: string[];
  paymentsReceived: number;
  totalRevenue: number;
  averagePayment: number;
  paymentDetails: { client: string; amount: number; date: string }[];
}

export interface MonthlyMetrics {
  monthStart: Date;
  monthEnd: Date;
  newClients: number;
  clientNames: string[];
  businessVisits: number;
  visitLocations: string[];
  goalsCompleted: number;
  goalTitles: string[];
  paymentsReceived: number;
  totalRevenue: number;
  averagePayment: number;
  paymentDetails: { client: string; amount: number; date: string }[];
  weeklyBreakdown: WeeklyMetrics[];
}

export interface ClientRetentionMetrics {
  totalClients: number;
  clientsWithMultipleVisits: number;
  retentionRate: number; // percentage
  averageDaysBetweenVisits: number;
  clientVisitCounts: { clientName: string; visitCount: number; lastVisit: Date }[];
  topReturningClients: { clientName: string; visitCount: number }[];
}

export interface GoalStreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  streakDates: Date[];
  isActiveToday: boolean;
}

export interface TrendData {
  date: string;
  clients: number;
  visits: number;
  payments: number;
  revenue: number;
}

// Get start and end of current week
export const getCurrentWeek = (): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Get start and end of current month
export const getCurrentMonth = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

// Get start and end of previous week
export const getPreviousWeek = (): { start: Date; end: Date } => {
  const { start: currentStart } = getCurrentWeek();
  const start = new Date(currentStart);
  start.setDate(currentStart.getDate() - 7);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Get start and end of previous month
export const getPreviousMonth = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
};

// Calculate weekly metrics
export const calculateWeeklyMetrics = (
  clients: Client[],
  payments: Payment[],
  goals: Goal[],
  visits: BusinessVisit[],
  weekStart?: Date,
  weekEnd?: Date
): WeeklyMetrics => {
  const { start, end } = weekStart && weekEnd 
    ? { start: weekStart, end: weekEnd }
    : getCurrentWeek();

  // Filter data for the week
  const weekClients = clients.filter(client => {
    const createdAt = new Date(client.created_at);
    return createdAt >= start && createdAt <= end;
  });

  const weekPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    return paymentDate >= start && paymentDate <= end && payment.status === 'confirmed';
  });

  const weekVisits = visits.filter(visit => {
    const visitDate = new Date(visit.created_at || visit.timestamp || Date.now());
    return visitDate >= start && visitDate <= end;
  });

  // Calculate goal completions (simplified - goals with progress >= 100%)
  const completedGoals = goals.filter(goal => {
    // This would need actual progress calculation based on goal period
    // For now, we'll use a simplified approach
    return true; // Placeholder
  });

  // Calculate payment details
  const paymentDetails = weekPayments.map(payment => ({
    client: payment.client?.name || 'Unknown Client',
    amount: payment.amount,
    date: new Date(payment.payment_date).toLocaleDateString()
  }));

  return {
    weekStart: start,
    weekEnd: end,
    newClients: weekClients.length,
    clientNames: weekClients.map(c => c.name),
    businessVisits: weekVisits.length,
    visitLocations: weekVisits.map(v => v.location).filter((loc): loc is string => Boolean(loc)),
    goalsCompleted: completedGoals.length,
    goalTitles: completedGoals.map(g => g.title),
    paymentsReceived: weekPayments.length,
    totalRevenue: weekPayments.reduce((sum, p) => sum + p.amount, 0),
    averagePayment: weekPayments.length > 0 
      ? weekPayments.reduce((sum, p) => sum + p.amount, 0) / weekPayments.length 
      : 0,
    paymentDetails
  };
};

// Calculate monthly metrics with weekly breakdown
export const calculateMonthlyMetrics = (
  clients: Client[],
  payments: Payment[],
  goals: Goal[],
  visits: BusinessVisit[],
  monthStart?: Date,
  monthEnd?: Date
): MonthlyMetrics => {
  const { start, end } = monthStart && monthEnd 
    ? { start: monthStart, end: monthEnd }
    : getCurrentMonth();

  // Calculate overall month metrics
  const monthClients = clients.filter(client => {
    const createdAt = new Date(client.created_at);
    return createdAt >= start && createdAt <= end;
  });

  const monthPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    return paymentDate >= start && paymentDate <= end && payment.status === 'confirmed';
  });

  const monthVisits = visits.filter(visit => {
    const visitDate = new Date(visit.created_at || visit.timestamp || Date.now());
    return visitDate >= start && visitDate <= end;
  });

  const completedGoals = goals.filter(goal => true); // Placeholder

  // Calculate weekly breakdown
  const weeklyBreakdown: WeeklyMetrics[] = [];
  const currentWeek = new Date(start);
  
  while (currentWeek <= end) {
    const weekEnd = new Date(currentWeek);
    weekEnd.setDate(currentWeek.getDate() + 6);
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }
    
    const weekMetrics = calculateWeeklyMetrics(
      clients, payments, goals, visits, 
      new Date(currentWeek), weekEnd
    );
    weeklyBreakdown.push(weekMetrics);
    
    currentWeek.setDate(currentWeek.getDate() + 7);
  }

  const paymentDetails = monthPayments.map(payment => ({
    client: payment.client?.name || 'Unknown Client',
    amount: payment.amount,
    date: new Date(payment.payment_date).toLocaleDateString()
  }));

  return {
    monthStart: start,
    monthEnd: end,
    newClients: monthClients.length,
    clientNames: monthClients.map(c => c.name),
    businessVisits: monthVisits.length,
    visitLocations: monthVisits.map(v => v.location).filter((loc): loc is string => Boolean(loc)),
    goalsCompleted: completedGoals.length,
    goalTitles: completedGoals.map(g => g.title),
    paymentsReceived: monthPayments.length,
    totalRevenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
    averagePayment: monthPayments.length > 0 
      ? monthPayments.reduce((sum, p) => sum + p.amount, 0) / monthPayments.length 
      : 0,
    paymentDetails,
    weeklyBreakdown
  };
};

// Calculate client retention metrics
export const calculateClientRetentionMetrics = (
  clients: Client[],
  visits: BusinessVisit[]
): ClientRetentionMetrics => {
  const clientVisitCounts = clients.map(client => {
    const clientVisits = visits.filter(visit => visit.client_id === client.id);
    const lastVisit = clientVisits.length > 0 
      ? new Date(Math.max(...clientVisits.map(v => new Date(v.created_at || v.timestamp || 0).getTime())))
      : new Date(client.created_at);
    
    return {
      clientName: client.name,
      visitCount: clientVisits.length,
      lastVisit
    };
  });

  const clientsWithMultipleVisits = clientVisitCounts.filter(c => c.visitCount >= 2).length;
  const retentionRate = clients.length > 0 ? (clientsWithMultipleVisits / clients.length) * 100 : 0;

  // Calculate average days between visits
  let totalDaysBetweenVisits = 0;
  let visitPairs = 0;

  clients.forEach(client => {
    const clientVisits = visits
      .filter(visit => visit.client_id === client.id)
      .sort((a, b) => new Date(a.created_at || a.timestamp || 0).getTime() - new Date(b.created_at || b.timestamp || 0).getTime());
    
    for (let i = 1; i < clientVisits.length; i++) {
      const prev = new Date(clientVisits[i - 1].created_at || clientVisits[i - 1].timestamp || 0);
      const curr = new Date(clientVisits[i].created_at || clientVisits[i].timestamp || 0);
      const daysDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      totalDaysBetweenVisits += daysDiff;
      visitPairs++;
    }
  });

  const averageDaysBetweenVisits = visitPairs > 0 ? totalDaysBetweenVisits / visitPairs : 0;

  const topReturningClients = clientVisitCounts
    .filter(c => c.visitCount >= 2)
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 5)
    .map(c => ({ clientName: c.clientName, visitCount: c.visitCount }));

  return {
    totalClients: clients.length,
    clientsWithMultipleVisits,
    retentionRate,
    averageDaysBetweenVisits,
    clientVisitCounts,
    topReturningClients
  };
};

// Calculate goal streak data
export const calculateGoalStreak = (
  goals: Goal[],
  clients: Client[],
  payments: Payment[]
): GoalStreakData => {
  // Simplified goal progress tracking
  // In a real implementation, this would track daily goal progress
  const today = new Date();
  const streakDates: Date[] = [];
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastActiveDate: Date | null = null;

  // For demo purposes, create a simple streak calculation
  // This would need to be enhanced with actual daily goal tracking
  const isActiveToday = goals.some(goal => {
    // Check if any goal was progressed today
    const todayClients = clients.filter(client => {
      const createdAt = new Date(client.created_at);
      return (
        createdAt.getDate() === today.getDate() &&
        createdAt.getMonth() === today.getMonth() &&
        createdAt.getFullYear() === today.getFullYear()
      );
    });
    return todayClients.length > 0;
  });

  if (isActiveToday) {
    currentStreak = 1; // Simplified
    lastActiveDate = today;
    streakDates.push(today);
  }

  // This would need a more sophisticated implementation
  // tracking daily goal progress over time
  longestStreak = Math.max(currentStreak, longestStreak);

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
    streakDates,
    isActiveToday
  };
};

// Generate trend data for charts
export const generateTrendData = (
  clients: Client[],
  payments: Payment[],
  visits: BusinessVisit[],
  days: number = 30
): TrendData[] => {
  const trends: TrendData[] = [];
  const endDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    
    const dayClients = clients.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt >= date && createdAt < nextDate;
    }).length;
    
    const dayVisits = visits.filter(visit => {
      const visitDate = new Date(visit.created_at || visit.timestamp || 0);
      return visitDate >= date && visitDate < nextDate;
    }).length;
    
    const dayPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= date && paymentDate < nextDate && payment.status === 'confirmed';
    });
    
    const dayRevenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      clients: dayClients,
      visits: dayVisits,
      payments: dayPayments.length,
      revenue: dayRevenue
    });
  }
  
  return trends;
};

// Format metrics for display
export const formatMetricsSummary = (metrics: WeeklyMetrics | MonthlyMetrics): string => {
  const period = 'weekStart' in metrics ? 'This Week' : 'This Month';
  const startDate = 'weekStart' in metrics ? metrics.weekStart : metrics.monthStart;
  const endDate = 'weekEnd' in metrics ? metrics.weekEnd : metrics.monthEnd;
  
  return `📊 ${period} Summary (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})

👥 New Clients: ${metrics.newClients}
${metrics.clientNames.length > 0 ? `• ${metrics.clientNames.join(', ')}` : '• No new clients this period'}

📍 Business Visits: ${metrics.businessVisits}
${metrics.visitLocations.length > 0 ? `• ${metrics.visitLocations.slice(0, 3).join(', ')}${metrics.visitLocations.length > 3 ? '...' : ''}` : '• No visits this period'}

🎯 Goals Completed: ${metrics.goalsCompleted}
${metrics.goalTitles.length > 0 ? `• ${metrics.goalTitles.join(', ')}` : '• No goals completed this period'}

💰 Payments: ${metrics.paymentsReceived} (${metrics.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})
${metrics.averagePayment > 0 ? `• Average: ${metrics.averagePayment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : '• No payments this period'}

${metrics.paymentDetails.length > 0 ? `Recent Payments:\n${metrics.paymentDetails.slice(0, 3).map(p => `• ${p.client}: ${p.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (${p.date})`).join('\n')}` : ''}`;
};

// Check if client needs attention (hasn't been visited recently)
export const getClientsNeedingAttention = (
  clients: Client[],
  visits: BusinessVisit[],
  daysSinceLastVisit: number = 14
): { client: Client; daysSinceVisit: number; lastVisit: Date | null }[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastVisit);
  
  return clients
    .map(client => {
      const clientVisits = visits
        .filter(visit => visit.client_id === client.id)
        .sort((a, b) => new Date(b.created_at || b.timestamp || 0).getTime() - new Date(a.created_at || a.timestamp || 0).getTime());
      
      const lastVisit = clientVisits.length > 0 
        ? new Date(clientVisits[0].created_at || clientVisits[0].timestamp || 0)
        : null;
      
      const daysSinceVisit = lastVisit 
        ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      return { client, daysSinceVisit, lastVisit };
    })
    .filter(item => item.daysSinceVisit >= daysSinceLastVisit && item.client.status === 'active')
    .sort((a, b) => b.daysSinceVisit - a.daysSinceVisit);
};

// Calculate goal progress and check if goals are at risk
export const getGoalsAtRisk = (
  goals: Goal[],
  clients: Client[],
  payments: Payment[]
): { goal: Goal; progress: number; remaining: number; timeLeft: string }[] => {
  const now = new Date();
  
  return goals
    .map(goal => {
      // Calculate current progress (simplified)
      let progress = 0;
      let timeLeft = '';
      
      if (goal.frequency === 'weekly') {
        const { start: weekStart, end: weekEnd } = getCurrentWeek();
        const weekClients = clients.filter(client => {
          const createdAt = new Date(client.created_at);
          return createdAt >= weekStart && createdAt <= weekEnd;
        });
        progress = weekClients.length;
        
        const daysLeft = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        timeLeft = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
      } else if (goal.frequency === 'monthly') {
        const { start: monthStart, end: monthEnd } = getCurrentMonth();
        const monthClients = clients.filter(client => {
          const createdAt = new Date(client.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });
        progress = monthClients.length;
        
        const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        timeLeft = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
      } else if (goal.frequency === 'daily') {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        const todayClients = clients.filter(client => {
          const createdAt = new Date(client.created_at);
          return createdAt >= todayStart && createdAt <= todayEnd;
        });
        progress = todayClients.length;
        
        const hoursLeft = Math.ceil((todayEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
        timeLeft = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
      }
      
      const remaining = Math.max(0, goal.target - progress);
      
      return {
        goal,
        progress,
        remaining,
        timeLeft
      };
    })
    .filter(item => item.remaining > 0 && item.remaining <= 2); // Goals that need 1-2 more to complete
};