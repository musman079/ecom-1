"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type SalesData = {
  year: number;
  month: number;
  revenue: number;
  orders: number;
};

interface AdminAnalyticsChartProps {
  data: SalesData[];
}

export function AdminAnalyticsChart({ data }: AdminAnalyticsChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      name: `${monthNames[d.month - 1]} ${d.year}`,
      revenue: d.revenue,
      orders: d.orders,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-sm border border-dashed border-white/10 bg-white/[0.02]">
        <p className="text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/30">
          No Sales Data
        </p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C8A96E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C8A96E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px' }}
            itemStyle={{ color: '#C8A96E', fontWeight: 'bold' }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#C8A96E" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            activeDot={{ r: 6, fill: "#C8A96E", stroke: "#111111", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
