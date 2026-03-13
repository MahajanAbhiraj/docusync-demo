document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const totalAmountEl = document.getElementById('total-amount');

    // Fetch and display expenses on load
    fetchExpenses();

    // Handle form submission
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;

        const newExpense = { title, amount, category };

        try {
            const response = await fetch('/expenses/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newExpense)
            });

            if (response.ok) {
                const addedExpense = await response.json();
                expenseForm.reset();
                fetchExpenses(); // Refresh the list
            } else {
                console.error("Failed to add expense");
            }
        } catch (error) {
            console.error("Error added expense:", error);
        }
    });

    async function fetchExpenses() {
        try {
            const response = await fetch('/expenses/');
            const expenses = await response.json();
            renderExpenses(expenses);
            updateTotal(expenses);
        } catch (error) {
            console.error("Error fetching expenses:", error);
            expenseList.innerHTML = '<div class="empty-state">Failed to load expenses</div>';
        }
    }

    function renderExpenses(expenses) {
        if (expenses.length === 0) {
            expenseList.innerHTML = '<div class="empty-state">No expenses found. Start adding some!</div>';
            return;
        }

        expenseList.innerHTML = expenses.reverse().map(expense => `
            <div class="expense-item">
                <div class="expense-details">
                    <span class="expense-title">${escapeHtml(expense.title)}</span>
                    <div class="expense-meta">
                        <span class="expense-category">${escapeHtml(expense.category)}</span>
                        <span>•</span>
                        <span>${expense.date}</span>
                    </div>
                </div>
                <div class="expense-actions">
                    <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                    <button class="btn-delete" onclick="deleteExpense(${expense.id})" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateTotal(expenses) {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalAmountEl.textContent = `$${total.toFixed(2)}`;
    }

    // Expose delete to global scope for the inline onclick handler
    window.deleteExpense = async (id) => {
        try {
            const response = await fetch(`/expenses/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchExpenses();
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
        }
    };
});

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
