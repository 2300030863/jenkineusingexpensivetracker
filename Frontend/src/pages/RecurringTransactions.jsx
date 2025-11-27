import { useState, useEffect } from 'react'
import { recurringTransactionAPI, categoryAPI, accountAPI } from '../services/api'
import { Plus, Edit, Trash2, Play, Pause, Calendar, Repeat, Info, AlertCircle, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function RecurringTransactions() {
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    recurrenceType: 'MONTHLY',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: '',
    categoryId: '',
    accountId: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [recurringRes, categoriesRes, accountsRes] = await Promise.all([
        recurringTransactionAPI.getAll(),
        categoryAPI.getAll(),
        accountAPI.getAll()
      ])
      
      setRecurringTransactions(recurringRes.data)
      setCategories(categoriesRes.data)
      setAccounts(accountsRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.trim().length < 3) {
      errors.description = 'Description must be at least 3 characters long'
    } else if (formData.description.trim().length > 200) {
      errors.description = 'Description must be less than 200 characters'
    }
    
    // Amount validation
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    } else if (formData.amount > 999999.99) {
      errors.amount = 'Amount must be less than ₹9,99,999.99'
    }
    
    // Date validation
    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    } else {
      const startDate = new Date(formData.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (startDate < today) {
        errors.startDate = 'Start date cannot be in the past'
      }
    }
    
    // End date validation
    if (formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date'
      }
    }
    
    // Category validation
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required'
    }
    
    // Account validation
    if (!formData.accountId) {
      errors.accountId = 'Account is required'
    }
    
    // Notes validation
    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Notes must be less than 500 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting')
      return
    }
    
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        endDate: formData.endDate || null
      }

      if (editingTransaction) {
        await recurringTransactionAPI.update(editingTransaction.id, data)
        toast.success('Recurring transaction updated successfully')
      } else {
        await recurringTransactionAPI.create(data)
        toast.success('Recurring transaction created successfully')
      }

      setShowModal(false)
      setEditingTransaction(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error('Failed to save recurring transaction')
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      recurrenceType: transaction.recurrenceType,
      startDate: format(new Date(transaction.startDate), 'yyyy-MM-dd'),
      endDate: transaction.endDate ? format(new Date(transaction.endDate), 'yyyy-MM-dd') : '',
      notes: transaction.notes || '',
      categoryId: transaction.categoryId?.toString() || '',
      accountId: transaction.accountId?.toString() || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await recurringTransactionAPI.delete(id)
        toast.success('Recurring transaction deleted successfully')
        fetchData()
      } catch (error) {
        toast.error('Failed to delete recurring transaction')
      }
    }
  }

  const handleToggle = async (id) => {
    try {
      await recurringTransactionAPI.toggle(id)
      toast.success('Recurring transaction status updated')
      fetchData()
    } catch (error) {
      toast.error('Failed to update recurring transaction status')
    }
  }

  const handleExecute = async (id) => {
    try {
      await recurringTransactionAPI.execute(id)
      toast.success('Recurring transaction executed successfully')
      fetchData()
    } catch (error) {
      toast.error('Failed to execute recurring transaction')
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'EXPENSE',
      recurrenceType: 'MONTHLY',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      notes: '',
      categoryId: '',
      accountId: ''
    })
    setFormErrors({})
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getRecurrenceLabel = (type) => {
    const labels = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      YEARLY: 'Yearly'
    }
    return labels[type] || type
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
      {/* Header with Description and Help */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recurring Transactions</h1>
          <p className="text-gray-600 mb-4 max-w-3xl">
            Set up automatic transactions that repeat on a schedule. Perfect for subscriptions, 
            salary payments, rent, utilities, and other regular financial activities. 
            You can pause, resume, or manually execute these transactions as needed.
          </p>
          
          {/* Help Toggle */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            <Info size={16} className="mr-1" />
            {showHelp ? 'Hide Help' : 'Show Help & Tips'}
          </button>
          
          {/* Help Content */}
          {showHelp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">How Recurring Transactions Work:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Daily:</strong> Transaction repeats every day (e.g., coffee, parking)</li>
                <li>• <strong>Weekly:</strong> Transaction repeats every week (e.g., groceries, gas)</li>
                <li>• <strong>Monthly:</strong> Transaction repeats every month (e.g., rent, salary, subscriptions)</li>
                <li>• <strong>Yearly:</strong> Transaction repeats every year (e.g., insurance, taxes)</li>
              </ul>
              <div className="mt-3 text-sm text-blue-800">
                <p><strong>Tips:</strong></p>
                <ul className="space-y-1">
                  <li>• Set an end date for temporary recurring transactions</li>
                  <li>• Use descriptive names to easily identify transactions</li>
                  <li>• Pause transactions instead of deleting them to preserve history</li>
                  <li>• Execute transactions manually if needed before the due date</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            resetForm()
            setEditingTransaction(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center ml-4"
        >
          <Plus size={20} className="mr-2" />
          Add Recurring Transaction
        </button>
      </div>

      {/* Recurring Transactions List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurrence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recurringTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Repeat className="text-gray-400 mb-4" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring transactions</h3>
                      <p className="text-gray-500 mb-4">Get started by creating your first recurring transaction.</p>
                      <button
                        onClick={() => {
                          resetForm()
                          setEditingTransaction(null)
                          setShowModal(true)
                        }}
                        className="btn-primary flex items-center"
                      >
                        <Plus size={20} className="mr-2" />
                        Add Recurring Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recurringTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.categoryName} • {transaction.accountName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Repeat size={16} className="mr-1" />
                      {getRecurrenceLabel(transaction.recurrenceType)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {transaction.nextDueDate ? format(new Date(transaction.nextDueDate), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggle(transaction.id)}
                        className={transaction.isActive ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                        title={transaction.isActive ? "Pause" : "Resume"}
                      >
                        {transaction.isActive ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      {transaction.isActive && (
                        <button
                          onClick={() => handleExecute(transaction.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Execute Now"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingTransaction ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Netflix Subscription, Monthly Rent, Salary"
                  maxLength={200}
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.description ? (
                    <span className="text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.description}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Be descriptive to easily identify this transaction
                    </span>
                  )}
                  <span className="text-sm text-gray-400">
                    {formData.description.length}/200
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999.99"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={`mt-1 block w-full border rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      formErrors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {formErrors.amount && (
                  <span className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.amount}
                  </span>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="EXPENSE">Expense (Money Going Out)</option>
                  <option value="INCOME">Income (Money Coming In)</option>
                </select>
                <span className="text-sm text-gray-500 mt-1">
                  Choose whether this is money you're spending or receiving
                </span>
              </div>

              {/* Recurrence Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.recurrenceType}
                  onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DAILY">Daily - Every day</option>
                  <option value="WEEKLY">Weekly - Every week</option>
                  <option value="MONTHLY">Monthly - Every month</option>
                  <option value="YEARLY">Yearly - Every year</option>
                </select>
                <span className="text-sm text-gray-500 mt-1">
                  How often should this transaction repeat?
                </span>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.startDate ? (
                  <span className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.startDate}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 mt-1">
                    When should this recurring transaction begin?
                  </span>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.endDate ? (
                  <span className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.endDate}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 mt-1">
                    Leave empty for indefinite recurring transactions
                  </span>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.categoryId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId ? (
                  <span className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.categoryId}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 mt-1">
                    Choose the category that best describes this transaction
                  </span>
                )}
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.accountId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
                {formErrors.accountId ? (
                  <span className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.accountId}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 mt-1">
                    Which account will this transaction affect?
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.notes ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows="3"
                  placeholder="Add any additional details about this recurring transaction..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.notes ? (
                    <span className="text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.notes}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Optional: Add any additional details or reminders
                    </span>
                  )}
                  <span className="text-sm text-gray-400">
                    {formData.notes.length}/500
                  </span>
                </div>
              </div>

              {/* Transaction Summary */}
              {formData.description && formData.amount && formData.recurrenceType && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Transaction Summary</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Description:</strong> {formData.description}</p>
                    <p><strong>Amount:</strong> ₹{formData.amount} ({formData.type})</p>
                    <p><strong>Frequency:</strong> {getRecurrenceLabel(formData.recurrenceType)}</p>
                    <p><strong>Starts:</strong> {formData.startDate ? format(new Date(formData.startDate), 'MMM dd, yyyy') : 'Not set'}</p>
                    {formData.endDate && (
                      <p><strong>Ends:</strong> {format(new Date(formData.endDate), 'MMM dd, yyyy')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormErrors({})
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center"
                >
                  {editingTransaction ? (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Update Transaction
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Create Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecurringTransactions
