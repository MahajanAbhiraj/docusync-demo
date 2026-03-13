document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const accountForm = document.getElementById('account-form');
    const expenseList = document.getElementById('expense-list');
    const totalAmountEl = document.getElementById('total-amount');
    const globalAccountFilter = document.getElementById('global-account-filter');
    const expenseAccountSelect = document.getElementById('expense-account');

    let accounts = [];

    // Fetch and display data on load
    fetchAccounts().then(() => {
        fetchExpenses();
    });

    globalAccountFilter.addEventListener('change', () => {
        fetchExpenses();
    });

    // Handle expense form submission
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const account_id = parseInt(document.getElementById('expense-account').value);

        const newExpense = { title, amount, category, account_id };

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
            console.error("Error adding expense:", error);
        }
    });

    // Handle account form submission
    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('account-name').value;
        const newAccount = { name };

        try {
            const response = await fetch('/accounts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAccount)
            });

            if (response.ok) {
                accountForm.reset();
                await fetchAccounts();
                fetchExpenses(); // Re-render to show updated dropdowns etc.
            } else {
                console.error("Failed to add account");
            }
        } catch (error) {
            console.error("Error adding account:", error);
        }
    });

    async function fetchAccounts() {
        try {
            const response = await fetch('/accounts/');
            accounts = await response.json();
            populateAccountDropdowns();
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    }

    function populateAccountDropdowns() {
        const currentGlobalVal = globalAccountFilter.value;
        
        // Populate Global Filter
        globalAccountFilter.innerHTML = '<option value="">All Accounts</option>';
        accounts.forEach(acc => {
            globalAccountFilter.innerHTML += `<option value="${acc.id}">${escapeHtml(acc.name)}</option>`;
        });
        globalAccountFilter.value = currentGlobalVal;

        // Populate Expense Form Account Select
        expenseAccountSelect.innerHTML = '<option value="" disabled selected>Select Account</option>';
        accounts.forEach(acc => {
            expenseAccountSelect.innerHTML += `<option value="${acc.id}">${escapeHtml(acc.name)}</option>`;
        });
    }

    async function fetchExpenses() {
        try {
            const accountId = globalAccountFilter.value;
            let url = '/expenses/';
            if (accountId) {
                url += `?account_id=${accountId}`;
            }

            const response = await fetch(url);
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

        expenseList.innerHTML = expenses.reverse().map(expense => {
            const account = accounts.find(a => a.id === expense.account_id);
            const accountName = account ? account.name : 'Unknown Account';
            
            return `
            <div class="expense-item">
                <div class="expense-details">
                    <span class="expense-title">${escapeHtml(expense.title)}</span>
                    <div class="expense-meta">
                        <span class="expense-category">${escapeHtml(expense.category)}</span>
                        <span>•</span>
                        <span class="expense-account-badge">${escapeHtml(accountName)}</span>
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
        `}).join('');
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
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
