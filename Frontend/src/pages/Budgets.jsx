import { useState, useEffect } from 'react'
import { budgetAPI, categoryAPI, analyticsAPI } from '../services/api'
import { Plus, Edit, Trash2, Target, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [budgetStatus, setBudgetStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    type: 'MONTHLY',
    categoryId: '',
    alertThreshold: 80
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes, statusRes] = await Promise.all([
        budgetAPI.getAll(),
        categoryAPI.getAll(),
        analyticsAPI.getBudgetStatus()
      ])

      setBudgets(budgetsRes.data)
      setCategories(categoriesRes.data)
      setBudgetStatus(statusRes.data || [])
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold)
      }

      if (editingBudget) {
        await budgetAPI.update(editingBudget.id, data)
        toast.success('Budget updated successfully')
      } else {
        await budgetAPI.create(data)
        toast.success('Budget created successfully')
      }

      setShowModal(false)
      setEditingBudget(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error('Failed to save budget')
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      amount: budget.amount.toString(),
      startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(budget.endDate), 'yyyy-MM-dd'),
      type: budget.type,
      categoryId: budget.category?.id?.toString() || '',
      alertThreshold: budget.alertThreshold.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetAPI.delete(id)
        toast.success('Budget deleted successfully')
        fetchData()
      } catch (error) {
        toast.error('Failed to delete budget')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      type: 'MONTHLY',
      categoryId: '',
      alertThreshold: 80
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const calculateProgress = (budget) => {
    const status = budgetStatus.find(s => s.budget && s.budget.id === budget.id)
    if (status) {
      const spent = Number(status.spent) || 0
      const amount = Number(budget.amount) || 0
      const percentage = amount > 0 ? (spent / amount) * 100 : 0
      return { spent, percentage }
    }
    return { spent: 0, percentage: 0 }
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
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingBudget(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const { spent, percentage } = calculateProgress(budget)
          const isOverBudget = percentage > 100
          const isNearLimit = percentage >= budget.alertThreshold

          return (
            <div key={budget.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Target size={20} className="mr-2 text-primary-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {budget.category ? budget.category.name : 'Total Budget'}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {budget.type.toLowerCase()} budget
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium">{formatCurrency(budget.amount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(spent)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(budget.amount - spent)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {percentage.toFixed(1)}% used
                  </span>
                  {isNearLimit && (
                    <div className="flex items-center text-yellow-600">
                      <AlertTriangle size={16} className="mr-1" />
                      <span className="text-xs">Near limit</span>
                    </div>
                  )}
                  {isOverBudget && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle size={16} className="mr-1" />
                      <span className="text-xs">Over budget</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {format(new Date(budget.startDate), 'MMM dd')} - {format(new Date(budget.endDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBudget ? 'Edit Budget' : 'Add New Budget'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="">Total Budget (All Categories)</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alert Threshold (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                    className="input-field mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when spending reaches this percentage of your budget
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingBudget ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budgets



