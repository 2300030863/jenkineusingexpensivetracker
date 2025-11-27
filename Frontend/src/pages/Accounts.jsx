import { useState, useEffect } from 'react'
import { accountAPI } from '../services/api'
import { Plus, Edit, Trash2, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CASH',
    balance: '0.00'
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAll()
      setAccounts(response.data)
    } catch (error) {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        balance: parseFloat(formData.balance)
      }

      if (editingAccount) {
        await accountAPI.update(editingAccount.id, data)
        toast.success('Account updated successfully')
      } else {
        await accountAPI.create(data)
        toast.success('Account created successfully')
      }

      setShowModal(false)
      setEditingAccount(null)
      resetForm()
      fetchAccounts()
    } catch (error) {
      toast.error('Failed to save account')
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      description: account.description || '',
      type: account.type,
      balance: account.balance.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountAPI.delete(id)
        toast.success('Account deleted successfully')
        fetchAccounts()
      } catch (error) {
        toast.error('Failed to delete account')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'CASH',
      balance: '0.00'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'BANK':
        return '🏦'
      case 'CREDIT_CARD':
        return '💳'
      case 'WALLET':
        return '👛'
      case 'SAVINGS':
        return '💰'
      case 'INVESTMENT':
        return '📈'
      default:
        return '💵'
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
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingAccount(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">
                  {getAccountTypeIcon(account.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {account.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {account.type.replace('_', ' ').toLowerCase()}
                  </p>
                  {account.description && (
                    <p className="text-sm text-gray-500">{account.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(account.balance)}
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Account</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="WALLET">Digital Wallet</option>
                    <option value="SAVINGS">Savings Account</option>
                    <option value="INVESTMENT">Investment Account</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field mt-1"
                    rows="3"
                  />
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
                    {editingAccount ? 'Update' : 'Create'}
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

export default Accounts



