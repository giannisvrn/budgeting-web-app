<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="flex justify-end">
      <button 
        @click="handleLogout" 
        class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
      >
        Logout
      </button>
    </div>
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-3xl shadow-lg p-8">
        <h1 class="text-2xl font-bold text-center mb-8">Expenses of {{ currentMonth }}</h1>
        
        <!-- Budget and Percentage Display -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div class="flex gap-4 items-center mb-4 sm:mb-0">
            <label for="budget" class="text-lg font-semibold">Budget:</label>
            <input 
              v-model.number="budget" 
              id="budget" 
              type="number" 
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your budget"
              @input="budget = Math.max(0, budget)"
            />  
            <button 
              @click="saveUserData" 
              class="bg-blue-500 hover:bg-blue-600 px-1 text-white text-sm font-semibold rounded transition-colors"
            >
              Update budget
            </button>
          </div>
          <div class="text-lg font-semibold ml-2">
            <span>Spent: ${{ totalSpent }}</span>
            <span class="ml-4">({{ percentageSpent }}%)</span>
          </div>
        </div>

        <!-- Add Expense Button -->
        <div class="flex justify-center mb-8">
          <button 
            @click="showModal = true" 
            class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Add Expense
          </button>
        </div>

        <!-- Expense Chart -->
        <div class="w-full h-[400px] relative">
          <canvas ref="chartRef"></canvas>
        </div>
        
        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">Add Expense</h3>
            <div class="space-y-4">
              <select 
                v-model="newExpense.category" 
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="" disabled>Select Category</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.label"
                >
                  {{ category.label }}
                </option>
              </select>
              <input 
                v-model.number="newExpense.amount" 
                type="number" 
                placeholder="Amount" 
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
              />
            </div>
            <div class="flex gap-3 mt-6">
              <button 
                @click="showModal = false" 
                class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                @click="addExpense" 
                class="flex-1 px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import { format } from 'date-fns'
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

// Firebase imports for user-specific data
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import { useToast } from "vue-toastification";
const toast = useToast();

// Firebase setup
const db = getFirestore()
const auth = getAuth()

const router = useRouter()
const showModal = ref(false)
const chartRef = ref(null)
const chartInstance = ref(null)
const newExpense = ref({ category: '', amount: 0 })
const budget = ref(0) // Budget input
const categories = ref([
  { id: 'foodCoffee', label: 'Food & Coffee', color: 'rgba(147, 197, 253, 0.8)' },
  { id: 'gambling', label: 'Gambling', color: 'rgba(1, 180, 254, 0.8)' },
  { id: 'supermarket', label: 'Supermarket', color: 'rgba(251, 207, 232, 0.8)' },
  { id: 'entertainment', label: 'Entertainment', color: 'rgba(253, 164, 175, 0.8)' },
  { id: 'shopping', label: 'Shopping', color: 'rgba(252, 211, 77, 0.8)' }
])
const expenses = ref([])
const userId = ref(null) // Current logged-in user ID

// Current Month
const currentMonth = format(new Date(), 'MMMM yyyy')

// Get current month and year
const currentMonthKey = format(new Date(), 'yyyy-MM')

// Fetch user data on mount
onMounted(async () => {
  const user = auth.currentUser
  if (!user) {
    router.push('/login')
    return
  }
  userId.value = user.uid
  await loadUserBudgetAndExpenses()
  updateChart()
})

// Load user data (budget and expenses)
const loadUserBudgetAndExpenses = async () => {
  if (!userId.value) return
  const userDoc = doc(db, 'users', userId.value)
  const userSnapshot = await getDoc(userDoc)
  if (userSnapshot.exists()) {
    const data = userSnapshot.data()
    budget.value = data.budget || 0
    // Filter expenses for the current month
    expenses.value = (data.expenses || []).filter(expense => expense.month === currentMonthKey)
  }
}

// Save user data (budget and expenses)
const saveUserData = async () => {
  if (!userId.value) return
  const userDoc = doc(db, 'users', userId.value)
  try {
    await updateDoc(userDoc, {
      budget: budget.value,
      expenses: expenses.value
    });
    toast.success("Budget updated successfully!");
  } catch (error) {
    toast.error("Failed to update budget. Please try again.");
    console.error("Error updating budget:", error);
  }
}

// Add an expense
const addExpense = async () => {
  if (newExpense.value.category && newExpense.value.amount > 0) {
    const existingExpense = expenses.value.find(expense => expense.category === newExpense.value.category)
    if (existingExpense) {
      existingExpense.amount += newExpense.value.amount
    } else {
      expenses.value.push({
        category: newExpense.value.category,
        amount: newExpense.value.amount,
        month: currentMonthKey // Add month field
      })
    }
    newExpense.value = { category: '', amount: 0 }
    showModal.value = false
    updateChart()
    await saveUserData()
  }
}

// Calculate total amount spent
const totalSpent = computed(() => expenses.value.reduce((sum, expense) => sum + expense.amount, 0))

// Calculate percentage of budget spent
const percentageSpent = computed(() => budget.value > 0 ? ((totalSpent.value / budget.value) * 100).toFixed(2) : 0)

// Update the chart
const updateChart = () => {
  if (chartRef.value) {
    const ctx = chartRef.value.getContext('2d')
    if (chartInstance.value) {
      chartInstance.value.destroy()
    }
    chartInstance.value = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: expenses.value.map(expense => expense.category),
        datasets: [{
          data: expenses.value.map(expense => expense.amount),
          backgroundColor: categories.value.map(cat => cat.color),
          borderWidth: 0,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        layout: {
          padding: 20
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 14, family: 'system-ui' }
            }
          },
          title: {
            display: true,
            text: 'Expense Distribution',
            font: { size: 16, family: 'system-ui', weight: '500' },
            padding: { bottom: 30 }
          }
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: (chart) => {
          const width = chart.width
          const height = chart.height
          const ctx = chart.ctx

          ctx.restore()
          ctx.font = '500 14px system-ui'
          ctx.fillStyle = '#6B7280'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          ctx.fillText('Total', width / 2, height / 2 - 15)

          ctx.font = '600 24px system-ui'
          ctx.fillStyle = '#111827'
          ctx.fillText(`$${totalSpent.value}`, width / 2, height / 2 + 15)
          ctx.save()
        }
      }]
    })
  }
}

// Handle logout
const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>
