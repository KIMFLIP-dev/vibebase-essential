"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "플랜별 구독자 현황 차트"

// 플랜별 색상 (최대 3개)
const PLAN_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
]

interface Plan {
  id: string
  name: string
}

interface ChartAreaInteractiveProps {
  plans: Plan[]
}

// 더미 데이터 생성 함수 (최근 30일, 선형 증가)
function generateDummyData(plans: Plan[]) {
  const data: Record<string, number | string>[] = []
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 29) // 최근 30일

  // 플랜별 초기값과 일일 증가량 설정 (선형)
  const planSettings = plans.map((_, index) => ({
    baseValue: 50 + (2 - index) * 20, // 첫번째 플랜이 가장 많음
    dailyGrowth: 2 + (2 - index), // 첫번째 플랜이 일일 증가량 높음
  }))

  let currentDate = new Date(startDate)
  let dayIndex = 0

  while (currentDate <= endDate) {
    const entry: Record<string, number | string> = {
      date: currentDate.toISOString().split("T")[0],
    }

    plans.forEach((plan, index) => {
      const settings = planSettings[index]
      // 선형 증가
      const value = settings.baseValue + (settings.dailyGrowth * dayIndex)
      entry[plan.id] = value
    })

    data.push(entry)
    currentDate.setDate(currentDate.getDate() + 1)
    dayIndex++
  }

  return data
}

export function ChartAreaInteractive({ plans }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("30d")

  // 플랜이 없으면 안내 메시지 표시
  if (plans.length === 0) {
    return (
      <Card className="pt-0">
        <CardHeader className="py-5">
          <CardTitle>플랜별 구독자 현황</CardTitle>
          <CardDescription>
            활성화된 구독 플랜이 없습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // 동적으로 차트 설정 생성
  const chartConfig: ChartConfig = {
    subscribers: {
      label: "구독자",
    },
    ...Object.fromEntries(
      plans.map((plan, index) => [
        plan.id,
        {
          label: plan.name,
          color: PLAN_COLORS[index] || PLAN_COLORS[0],
        },
      ])
    ),
  }

  // 더미 데이터 생성
  const chartData = React.useMemo(() => generateDummyData(plans), [plans])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date as string)
    const referenceDate = new Date()
    let daysToSubtract = 30
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>플랜별 구독자 현황</CardTitle>
          <CardDescription>
            최근 30일간 플랜별 구독자 수 추이
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="기간 선택"
          >
            <SelectValue placeholder="최근 30일" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="30d" className="rounded-lg">
              최근 30일
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              최근 7일
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {plans.map((plan) => (
                <linearGradient
                  key={plan.id}
                  id={`fill-${plan.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${plan.id})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${plan.id})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {plans.map((plan) => (
              <Area
                key={plan.id}
                dataKey={plan.id}
                type="natural"
                fill={`url(#fill-${plan.id})`}
                stroke={`var(--color-${plan.id})`}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
