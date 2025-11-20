import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// ===== CONSTANTS =====
const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍕', color: 'cat-food' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: 'cat-transport' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'cat-entertainment' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: 'cat-shopping' },
  { id: 'bills', label: 'Bills & Utilities', icon: '📄', color: 'cat-bills' },
  { id: 'health', label: 'Health', icon: '💊', color: 'cat-health' },
  { id: 'education', label: 'Education', icon: '📚', color: 'cat-education' },
  { id: 'other', label: 'Other', icon: '📦', color: 'cat-other' },
];

const MONTHLY_BUDGET = 50000; // Default monthly budget in ₹

// ===== HELPER FUNCTIONS =====
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getCategoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[7];

// ===== LOCAL STORAGE =====
const loadExpenses = () => {
  try {
    const saved = localStorage.getItem('expense-tracker-data');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveExpenses = (expenses) => {
  localStorage.setItem('expense-tracker-data', JSON.stringify(expenses));
};

// ===== TOAST COMPONENT =====
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`} id="notification-toast">
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

// ===== SUMMARY CARDS COMPONENT =====
function SummaryCards({ totalExpense, monthlyBudget, expenseCount }) {
  const remaining = monthlyBudget - totalExpense;

  return (
    <div className="summary-grid" id="summary-section">
      <div className="summary-card balance">
        <div className="summary-card-icon">💰</div>
        <div className="summary-card-label">Monthly Budget</div>
        <div className="summary-card-amount">{formatCurrency(monthlyBudget)}</div>
      </div>
      <div className="summary-card expense">
        <div className="summary-card-icon">📊</div>
        <div className="summary-card-label">Total Spent</div>
        <div className="summary-card-amount">{formatCurrency(totalExpense)}</div>
      </div>
      <div className="summary-card income">
        <div className="summary-card-icon">{remaining >= 0 ? '✨' : '⚠️'}</div>
        <div className="summary-card-label">Remaining</div>
        <div className="summary-card-amount" style={remaining < 0 ? { color: 'var(--danger)' } : {}}>
          {formatCurrency(remaining)}
        </div>
      </div>
    </div>
  );
}

// ===== ADD EXPENSE FORM COMPONENT =====
function AddExpenseForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(getTodayDate());

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || parseFloat(amount) <= 0) return;

    const expense = {
      id: generateId(),
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date,
      createdAt: Date.now(),
    };

    onAdd(expense);
    setTitle('');
    setAmount('');
    setCategory('food');
    setDate(getTodayDate());
  };

  return (
    <div className="form-card" id="add-expense-form">
      <h2>
        <span>➕</span> Add Expense
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="expense-title">Title</label>
          <input
            id="expense-title"
            type="text"
            placeholder="e.g., Lunch at cafe"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={50}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expense-amount">Amount (₹)</label>
            <input
              id="expense-amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="expense-category">Category</label>
          <select
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-add" id="btn-add-expense">
          Add Expense
        </button>
      </form>

      {/* Budget breakdown by category */}
      <BudgetBreakdown />
    </div>
  );
}

// ===== BUDGET BREAKDOWN COMPONENT =====
function BudgetBreakdown() {
  const expenses = loadExpenses();
  const categoryTotals = {};

  expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (totalExpense === 0) return null;

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="budget-section">
      <h3>
        <span>📊</span> Spending by Category
      </h3>
      {sortedCategories.map(([catId, total]) => {
        const cat = getCategoryById(catId);
        const percentage = Math.min((total / MONTHLY_BUDGET) * 100, 100);
        const budgetClass = percentage > 80 ? 'danger' : percentage > 50 ? 'warning' : 'safe';

        return (
          <div className="budget-item" key={catId}>
            <div className="budget-item-header">
              <span className="budget-item-label">
                {cat.icon} {cat.label}
              </span>
              <span className="budget-item-value">{formatCurrency(total)}</span>
            </div>
            <div className="budget-progress">
              <div
                className={`budget-progress-bar ${budgetClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== EXPENSE ITEM COMPONENT =====
function ExpenseItem({ expense, onDelete, index }) {
  const cat = getCategoryById(expense.category);

  return (
    <div
      className="expense-item"
      style={{ animationDelay: `${index * 0.05}s` }}
      id={`expense-item-${expense.id}`}
    >
      <div className={`expense-item-icon ${cat.color}`}>{cat.icon}</div>
      <div className="expense-item-details">
        <div className="expense-item-name">{expense.title}</div>
        <div className="expense-item-meta">
          <span className={`expense-item-category ${cat.color}`}>{cat.label}</span>
          <span>{formatDate(expense.date)}</span>
        </div>
      </div>
      <div className="expense-item-amount">- {formatCurrency(expense.amount)}</div>
      <button
        className="expense-item-delete"
        onClick={() => onDelete(expense.id)}
        title="Delete expense"
        id={`delete-expense-${expense.id}`}
      >
        🗑️
      </button>
    </div>
  );
}

// ===== EXPENSE LIST COMPONENT =====
function ExpenseList({ expenses, onDelete, searchQuery, onSearchChange, filterCategory, onFilterChange }) {
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterCategory === 'all' || exp.category === filterCategory;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
  }, [expenses, searchQuery, filterCategory]);

  return (
    <div className="expense-list-section" id="expense-list-section">
      <div className="list-header">
        <h2>
          <span>📋</span> Transactions
        </h2>
        <span className="expense-count">{filteredExpenses.length} items</span>
      </div>

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          id="search-expenses"
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="filter-bar" id="filter-bar">
        <button
          className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
          id="filter-all"
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`filter-btn ${filterCategory === cat.id ? 'active' : ''}`}
            onClick={() => onFilterChange(cat.id)}
            id={`filter-${cat.id}`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Expense Items */}
      {filteredExpenses.length > 0 ? (
        <div className="expense-list">
          {filteredExpenses.map((expense, index) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onDelete={onDelete}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" id="empty-state">
          <div className="empty-state-icon">💸</div>
          <h3>{expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}</h3>
          <p>
            {expenses.length === 0
              ? 'Add your first expense to get started!'
              : 'Try a different search or filter.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ===== MAIN APP COMPONENT =====
function App() {
  const [expenses, setExpenses] = useState(loadExpenses);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toast, setToast] = useState(null);

  // Persist expenses to localStorage whenever they change
  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  // Calculate totals
  const totalExpense = useMemo(
    () => expenses.reduce((sum, exp) => sum + exp.amount, 0),
    [expenses]
  );

  const handleAddExpense = (expense) => {
    setExpenses((prev) => [expense, ...prev]);
    setToast({ message: 'Expense added successfully!', type: 'success' });
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    setToast({ message: 'Expense deleted', type: 'error' });
  };

  // Format current date for header
  const headerDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="app" id="expense-tracker-app">
      {/* Header */}
      <header className="header" id="app-header">
        <div className="header-content">
          <div>
            <h1>Expense Tracker</h1>
            <span className="header-subtitle">2025</span>
          </div>
          <span className="header-date">{headerDate}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Summary Cards */}
        <SummaryCards
          totalExpense={totalExpense}
          monthlyBudget={MONTHLY_BUDGET}
          expenseCount={expenses.length}
        />

        {/* Content Grid: Form + List */}
        <div className="content-grid">
          <AddExpenseForm onAdd={handleAddExpense} />
          <ExpenseList
            expenses={expenses}
            onDelete={handleDeleteExpense}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterCategory={filterCategory}
            onFilterChange={setFilterCategory}
          />
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
