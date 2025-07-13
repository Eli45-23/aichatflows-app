import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { TrendData } from '../../utils/metrics';

interface SimpleChartProps {
  data: TrendData[];
  metric: 'clients' | 'visits' | 'payments' | 'revenue';
  title: string;
  color?: string;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function SimpleChart({ 
  data, 
  metric, 
  title, 
  color = '#00D4AA', 
  height = 200 
}: SimpleChartProps) {
  if (data.length === 0) {
    return (
      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
        <View className="h-48 flex items-center justify-center">
          <Text className="text-gray-500">No data available</Text>
        </View>
      </View>
    );
  }

  // Calculate values for the chart
  const values = data.map(item => item[metric]);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Create simple bar chart representation
  const chartWidth = screenWidth - 64 - 32; // Account for padding
  const barWidth = Math.max(6, chartWidth / data.length - 2);

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
      
      <View style={{ height: height - 80 }} className="flex-row items-end justify-between px-2">
        {data.map((item, index) => {
          const value = item[metric];
          const normalizedHeight = range > 0 ? ((value - minValue) / range) * (height - 120) : 20;
          const barHeight = Math.max(4, normalizedHeight);
          
          return (
            <View key={index} className="items-center">
              <Text className="text-xs text-gray-600 mb-1">
                {metric === 'revenue' 
                  ? value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
                  : value.toString()
                }
              </Text>
              <View 
                style={{ 
                  width: barWidth, 
                  height: barHeight,
                  backgroundColor: color,
                  borderRadius: 2
                }}
              />
              <Text className="text-xs text-gray-400 mt-1">
                {new Date(item.date).getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Summary stats */}
      <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
        <View className="items-center">
          <Text className="text-sm text-gray-500">Peak</Text>
          <Text className="text-lg font-semibold text-gray-900">
            {metric === 'revenue' 
              ? `$${maxValue.toLocaleString()}`
              : maxValue.toString()
            }
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-sm text-gray-500">Average</Text>
          <Text className="text-lg font-semibold text-gray-900">
            {(() => {
              const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
              return metric === 'revenue' 
                ? `$${Math.round(avg).toLocaleString()}`
                : Math.round(avg).toString();
            })()}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-sm text-gray-500">Total</Text>
          <Text className="text-lg font-semibold text-gray-900">
            {(() => {
              const total = values.reduce((sum, val) => sum + val, 0);
              return metric === 'revenue' 
                ? `$${total.toLocaleString()}`
                : total.toString();
            })()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Specialized chart variants
export function ClientsChart({ data, title = "New Clients Over Time" }: { data: TrendData[]; title?: string }) {
  return (
    <SimpleChart 
      data={data} 
      metric="clients" 
      title={title}
      color="#00D4AA"
    />
  );
}

export function RevenueChart({ data, title = "Revenue Trends" }: { data: TrendData[]; title?: string }) {
  return (
    <SimpleChart 
      data={data} 
      metric="revenue" 
      title={title}
      color="#10B981"
    />
  );
}

export function VisitsChart({ data, title = "Business Visits" }: { data: TrendData[]; title?: string }) {
  return (
    <SimpleChart 
      data={data} 
      metric="visits" 
      title={title}
      color="#3B82F6"
    />
  );
}

export function PaymentsChart({ data, title = "Payment Activity" }: { data: TrendData[]; title?: string }) {
  return (
    <SimpleChart 
      data={data} 
      metric="payments" 
      title={title}
      color="#8B5CF6"
    />
  );
}