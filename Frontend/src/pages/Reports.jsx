import { useState, useEffect } from 'react'
import { analyticsAPI, transactionAPI } from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

function Reports() {
  const [reportData, setReportData] = useState({
    categorySpending: [],
    monthlyTrend: [],
    budgetStatus: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 6),
    endDate: new Date()
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      }
      
      const [categoryRes, trendRes, budgetRes] = await Promise.all([
        analyticsAPI.getCategorySpending(params),
        analyticsAPI.getMonthlyTrend(params),
        analyticsAPI.getBudgetStatus()
      ])
      
      setReportData({
        categorySpending: categoryRes.data,
        monthlyTrend: trendRes.data,
        budgetStatus: budgetRes.data
      })
    } catch (error) {
      toast.error('Failed to load report data')
      console.error('Reports error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }

  const formatCategoryData = (categorySpending) => {
    return categorySpending?.map((item, index) => ({
      name: item[0],
      value: parseFloat(item[1]),
      color: COLORS[index % COLORS.length]
    })) || []
  }

  const formatTrendData = (monthlyTrend) => {
    return monthlyTrend?.map(item => ({
      month: item[0],
      amount: parseFloat(item[1])
    })) || []
  }

  const exportToCSV = async () => {
    try {
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      }
      const res = await transactionAPI.search(params)
      const rows = res.data || []

      const header = ['Date', 'Time', 'Account Type', 'Type', 'Amount', 'Category', 'Description']
      const csvRows = [header]

      rows.forEach(t => {
        const createdAt = t.createdAt ? new Date(t.createdAt) : null
        const dateStr = createdAt ? format(createdAt, 'yyyy-MM-dd') : (t.transactionDate || '')
        const timeStr = createdAt ? format(createdAt, 'HH:mm:ss') : ''
        const isExpense = t.type === 'EXPENSE'
        const isIncome = t.type === 'INCOME'
        const amountStr = Number(t.amount).toFixed(2)
        csvRows.push([
          dateStr,
          timeStr,
          t.accountType || '',
          isExpense ? 'Expense' : isIncome ? 'Income' : t.type,
          amountStr,
          t.categoryName || '',
          (t.description || '').replaceAll(',', ' ')
        ])
      })

      const csvContent = csvRows.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch (e) {
      toast.error('Failed to export CSV')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Calendar size={20} className="mr-2" />
          <h3 className="text-lg font-semibold">Report Period</h3>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={format(dateRange.startDate, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({ ...dateRange, startDate: new Date(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={format(dateRange.endDate, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({ ...dateRange, endDate: new Date(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Category Spending Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
        {reportData.categorySpending?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatCategoryData(reportData.categorySpending)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatCategoryData(reportData.categorySpending).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Category Breakdown</h4>
              {formatCategoryData(reportData.categorySpending).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No expense data available for the selected period
          </div>
        )}
      </div>

      {/* Monthly Trend Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h3>
        {reportData.monthlyTrend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formatTrendData(reportData.monthlyTrend)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No trend data available for the selected period
          </div>
        )}
      </div>

      {/* Budget Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Status</h3>
        {reportData.budgetStatus?.length > 0 ? (
          <div className="space-y-4">
            {reportData.budgetStatus.map((budget, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {budget.budget.category ? budget.budget.category.name : 'Total Budget'}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {budget.isOverBudget && (
                      <span className="flex items-center text-red-600 text-sm">
                        <TrendingUp size={16} className="mr-1" />
                        Over Budget
                      </span>
                    )}
                    {budget.isNearLimit && !budget.isOverBudget && (
                      <span className="flex items-center text-yellow-600 text-sm">
                        <TrendingUp size={16} className="mr-1" />
                        Near Limit
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <span className="ml-2 font-medium">{formatCurrency(budget.budget.amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Spent:</span>
                    <span className="ml-2 font-medium">{formatCurrency(budget.spent)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`ml-2 font-medium ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budget.remaining)}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      budget.isOverBudget ? 'bg-red-500' : budget.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  {budget.percentage.toFixed(1)}% of budget used
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No budget data available
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports



