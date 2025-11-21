'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

interface TrendData {
  date: string
  donors: number
  requests: number
  matches: number
}

interface BloodTypeData {
  bloodType: string
  _count: { bloodType: number }
}

interface MonthlyData {
  month: string
  donors: number
  requests: number
  matches: number
  completedMatches: number
  successRate: number
}

interface SuccessRateData {
  bloodType: string
  totalMatches: number
  completedMatches: number
  successRate: number
}

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0d9488']

export function DailyTrendsChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="donors" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="New Donors"
        />
        <Line 
          type="monotone" 
          dataKey="requests" 
          stroke="#dc2626" 
          strokeWidth={2}
          name="Blood Requests"
        />
        <Line 
          type="monotone" 
          dataKey="matches" 
          stroke="#16a34a" 
          strokeWidth={2}
          name="Matches Created"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MonthlyTrendsChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="donors"
          stackId="1"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.6}
          name="New Donors"
        />
        <Area
          type="monotone"
          dataKey="requests"
          stackId="1"
          stroke="#dc2626"
          fill="#dc2626"
          fillOpacity={0.6}
          name="Blood Requests"
        />
        <Area
          type="monotone"
          dataKey="matches"
          stackId="1"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.6}
          name="Matches"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BloodTypeDistributionChart({ data }: { data: BloodTypeData[] }) {
  const chartData = data.map(item => ({
    name: item.bloodType.replace('_', ''),
    value: item._count.bloodType
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function SuccessRateChart({ data }: { data: SuccessRateData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="bloodType" 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip 
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
        />
        <Bar 
          dataKey="successRate" 
          fill="#16a34a"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ComparisonChart({ 
  data, 
  dataKeys, 
  colors = ['#3b82f6', '#dc2626', '#16a34a'] 
}: { 
  data: any[]
  dataKeys: string[]
  colors?: string[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar 
            key={key}
            dataKey={key} 
            fill={colors[index % colors.length]}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon 
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
}) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType]

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColor}`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}