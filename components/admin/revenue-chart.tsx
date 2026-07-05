"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RevenueStats } from "@/app/admin/dashboard/actions";

interface RevenueChartProps {
  stats: RevenueStats;
}

export function RevenueChart({ stats }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 30일 매출</CardTitle>
        <CardDescription>
          총 {stats.totalRevenue.toLocaleString()}원 · {stats.totalCount}건
          {stats.refundedAmount > 0 &&
            ` · 환불 ${stats.refundedAmount.toLocaleString()}원`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.daily}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B7B2FF" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#B7B2FF" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={(value: string) => value.slice(5).replace("-", "/")}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={60}
                tickFormatter={(value: number) =>
                  value >= 10000
                    ? `${Math.round(value / 10000)}만`
                    : value.toLocaleString()
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-sm">
                      <p className="font-medium mb-1">{label}</p>
                      <p>매출 {Number(entry.revenue).toLocaleString()}원</p>
                      <p className="text-muted-foreground">{entry.count}건</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#B7B2FF"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
