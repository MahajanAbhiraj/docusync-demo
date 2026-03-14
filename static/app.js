/* ===================================================
   CATEGORY COLOR MAP
   =================================================== */
const CATEGORY_COLORS = {
    Food:           { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', dot: '#fbbf24'  },
    Utilities:      { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa', dot: '#60a5fa'  },
    Entertainment:  { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', dot: '#a78bfa'  },
    Housing:        { bg: 'rgba(52,211,153,0.15)',  text: '#34d399', dot: '#34d399'  },
    Transportation: { bg: 'rgba(251,146,60,0.15)',  text: '#fb923c', dot: '#fb923c'  },
    Health:         { bg: 'rgba(248,113,113,0.15)', text: '#f87171', dot: '#f87171'  },
    Shopping:       { bg: 'rgba(232,121,249,0.15)', text: '#e879f9', dot: '#e879f9'  },
    Travel:         { bg: 'rgba(20,184,166,0.15)',  text: '#14b8a6', dot: '#14b8a6'  },
    Other:          { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', dot: '#94a3b8'  },
};

function categoryStyle(cat) {
    return CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
}

/* ===================================================
   TOAST UTILITY
   =================================================== */
let toastTimer = null;
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

/* ===================================================
   HTML ESCAPE UTILITY
   =================================================== */
function esc(s) {
    if (!s && s !== 0) return '';
    return String(s)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

/* ===================================================
   STATE
   =================================================== */
let accounts = [];
let allExpenses = [];

/* ===================================================
   MAIN
   =================================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* --- Tab Navigation --- */
    const tabs = document.querySelectorAll('.nav-link');
    const contents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const TAB_LABELS = { dashboard: 'Dashboard', expenses: 'Expenses', accounts: 'Accounts' };

    function switchTab(tabName) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        contents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabName}`));
        pageTitle.textContent = TAB_LABELS[tabName] || tabName;
        if (tabName === 'expenses') renderExpensesTable();
        if (tabName === 'accounts') renderAccountsList();
    }

    tabs.forEach(t => t.addEventListener('click', (e) => { e.preventDefault(); switchTab(t.dataset.tab); }));

    // "View All" link from dashboard
    document.getElementById('view-all-link').addEventListener('click', (e) => { e.preventDefault(); switchTab('expenses'); });

    /* --- Global Account Filter --- */
    const globalFilter = document.getElementById('global-account-filter');
    globalFilter.addEventListener('change', () => {
        fetchExpenses().then(() => {
            refreshDashboard();
            renderExpensesTable();
        });
    });

    /* --- Search / Filter / Sort on Expenses tab --- */
    document.getElementById('search-input').addEventListener('input', renderExpensesTable);
    document.getElementById('filter-category').addEventListener('change', renderExpensesTable);
    document.getElementById('sort-by').addEventListener('change', renderExpensesTable);

    /* --- Add Expense Button --- */
    document.getElementById('btn-add-expense').addEventListener('click', () => openModal());

    /* --- Modal Controls --- */
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('expense-modal').addEventListener('click', (e) => {
        if (e.target.id === 'expense-modal') closeModal();
    });

    /* --- Expense Form Submit --- */
    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-expense-id').value;
        if (editId) {
            await saveEditExpense(parseInt(editId));
        } else {
            await submitNewExpense();
        }
    });

    /* --- Account Form Submit --- */
    document.getElementById('account-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('account-name').value.trim();
        if (!name) return;
        try {
            const res = await fetch('/accounts/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                document.getElementById('account-form').reset();
                await fetchAccounts();
                renderAccountsList();
                showToast(`Account "${name}" created`, 'success');
            } else {
                showToast('Failed to create account', 'error');
            }
        } catch { showToast('Network error', 'error'); }
    });

    /* --- CSV Export --- */
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const accountId = globalFilter.value;
        let url = '/expenses/export/csv';
        if (accountId) url += `?account_id=${accountId}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = 'expenses.csv';
        a.click();
        showToast('Exporting CSV…', 'info');
    });

    /* --- CSV Import --- */
    document.getElementById('btn-import-csv').addEventListener('click', () => {
        document.getElementById('csv-file-input').click();
    });
    document.getElementById('csv-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/expenses/import/csv', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ Imported ${data.imported} expense(s) from CSV`, 'success');
                await fetchExpenses();
                refreshDashboard();
                renderExpensesTable();
            } else {
                showToast(`Import error: ${data.detail}`, 'error');
            }
        } catch { showToast('Import failed', 'error'); }
        e.target.value = '';
    });

    /* --- Init --- */
    fetchAccounts().then(() => {
        fetchExpenses().then(() => {
            refreshDashboard();
        });
    });
});

/* ===================================================
   MODAL HELPERS
   =================================================== */
function openModal(expense = null) {
    const modal = document.getElementById('expense-modal');
    const form  = document.getElementById('expense-form');
    form.reset();
    document.getElementById('edit-expense-id').value = '';

    if (expense) {
        document.getElementById('modal-title').textContent  = 'Edit Expense';
        document.getElementById('modal-submit').textContent = 'Save Changes';
        document.getElementById('edit-expense-id').value    = expense.id;
        document.getElementById('title').value              = expense.title;
        document.getElementById('amount').value             = expense.amount;
        document.getElementById('category').value           = expense.category;
        document.getElementById('expense-account').value    = expense.account_id;
    } else {
        document.getElementById('modal-title').textContent  = 'Add New Expense';
        document.getElementById('modal-submit').textContent = 'Add Expense';
    }
    modal.classList.add('open');
}

function closeModal() {
    document.getElementById('expense-modal').classList.remove('open');
}

/* ===================================================
   API CALLS
   =================================================== */
async function fetchAccounts() {
    try {
        const res = await fetch('/accounts/');
        accounts = await res.json();
        populateAccountDropdowns();
    } catch { showToast('Could not load accounts', 'error'); }
}

function populateAccountDropdowns() {
    const globalFilter      = document.getElementById('global-account-filter');
    const expenseAccount    = document.getElementById('expense-account');
    const currentGlobal     = globalFilter.value;

    globalFilter.innerHTML = '<option value="">All Accounts</option>';
    accounts.forEach(a => {
        globalFilter.innerHTML += `<option value="${a.id}">${esc(a.name)}</option>`;
    });
    globalFilter.value = currentGlobal;

    expenseAccount.innerHTML = '<option value="" disabled selected>Select Account</option>';
    accounts.forEach(a => {
        expenseAccount.innerHTML += `<option value="${a.id}">${esc(a.name)}</option>`;
    });
}

async function fetchExpenses() {
    try {
        const accountId = document.getElementById('global-account-filter').value;
        let url = '/expenses/';
        if (accountId) url += `?account_id=${accountId}`;
        const res = await fetch(url);
        allExpenses = await res.json();
    } catch { showToast('Could not load expenses', 'error'); }
}

async function submitNewExpense() {
    const title      = document.getElementById('title').value.trim();
    const amount     = parseFloat(document.getElementById('amount').value);
    const category   = document.getElementById('category').value;
    const account_id = parseInt(document.getElementById('expense-account').value);

    if (!title || isNaN(amount) || !account_id) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch('/expenses/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, category, account_id }),
        });
        if (res.ok) {
            closeModal();
            showToast('Expense added ✅', 'success');
            await fetchExpenses();
            refreshDashboard();
            renderExpensesTable();
        } else {
            showToast('Failed to add expense', 'error');
        }
    } catch { showToast('Network error', 'error'); }
}

async function saveEditExpense(id) {
    const title      = document.getElementById('title').value.trim();
    const amount     = parseFloat(document.getElementById('amount').value);
    const category   = document.getElementById('category').value;
    const account_id = parseInt(document.getElementById('expense-account').value);

    try {
        const res = await fetch(`/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, category, account_id }),
        });
        if (res.ok) {
            closeModal();
            showToast('Expense updated ✅', 'success');
            await fetchExpenses();
            refreshDashboard();
            renderExpensesTable();
        } else {
            showToast('Failed to update expense', 'error');
        }
    } catch { showToast('Network error', 'error'); }
}

window.deleteExpense = async (id) => {
    try {
        const res = await fetch(`/expenses/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Expense deleted', 'info');
            await fetchExpenses();
            refreshDashboard();
            renderExpensesTable();
        }
    } catch { showToast('Network error', 'error'); }
};

window.editExpense = (id) => {
    const exp = allExpenses.find(e => e.id === id);
    if (exp) openModal(exp);
};

window.deleteAccount = async (id) => {
    try {
        const res = await fetch(`/accounts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Account deleted', 'info');
            await fetchAccounts();
            renderAccountsList();
        } else {
            const d = await res.json();
            showToast(d.detail || 'Could not delete account', 'error');
        }
    } catch { showToast('Network error', 'error'); }
};

/* ===================================================
   RENDER: EXPENSES TABLE
   =================================================== */
function getFilteredExpenses() {
    const search   = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('filter-category').value;
    const sortBy   = document.getElementById('sort-by').value;

    let list = [...allExpenses];
    if (search)   list = list.filter(e => e.title.toLowerCase().includes(search));
    if (category) list = list.filter(e => e.category === category);

    if (sortBy === 'date-desc')   list.sort((a, b) => b.date.localeCompare(a.date));
    if (sortBy === 'date-asc')    list.sort((a, b) => a.date.localeCompare(b.date));
    if (sortBy === 'amount-desc') list.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'amount-asc')  list.sort((a, b) => a.amount - b.amount);

    return list;
}

function renderExpensesTable() {
    const list   = getFilteredExpenses();
    const tbody  = document.getElementById('expense-table-body');
    const total  = list.reduce((s, e) => s + e.amount, 0);

    document.getElementById('expense-count-label').textContent = `${list.length} expense${list.length !== 1 ? 's' : ''}`;
    document.getElementById('expense-total-label').textContent = `Total: $${total.toFixed(2)}`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No expenses found</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(exp => {
        const acc   = accounts.find(a => a.id === exp.account_id);
        const accName = acc ? acc.name : 'Unknown';
        const cs    = categoryStyle(exp.category);
        return `
        <tr>
            <td class="td-title">${esc(exp.title)}</td>
            <td>
                <span class="category-badge" style="background:${cs.bg};color:${cs.text}">
                    <span style="width:6px;height:6px;border-radius:50%;background:${cs.dot};display:inline-block;flex-shrink:0"></span>
                    ${esc(exp.category)}
                </span>
            </td>
            <td><span class="account-tag">${esc(accName)}</span></td>
            <td>${esc(exp.date)}</td>
            <td class="text-right amount-cell">$${exp.amount.toFixed(2)}</td>
            <td class="text-center">
                <button class="action-btn edit" onclick="editExpense(${exp.id})" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="action-btn delete" onclick="deleteExpense(${exp.id})" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>`;
    }).join('');
}

/* ===================================================
   RENDER: ACCOUNTS LIST
   =================================================== */
function renderAccountsList() {
    const container = document.getElementById('accounts-list');
    if (accounts.length === 0) {
        container.innerHTML = '<div class="loading-state">No accounts yet. Add one!</div>';
        return;
    }
    container.innerHTML = accounts.map(a => `
        <div class="account-item">
            <div class="account-item-name">
                <div class="account-avatar">${esc(a.name.charAt(0).toUpperCase())}</div>
                ${esc(a.name)}
            </div>
            <button class="action-btn delete" onclick="deleteAccount(${a.id})" title="Delete Account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>
    `).join('');
}

/* ===================================================
   DASHBOARD
   =================================================== */
function refreshDashboard() {
    const expenses = allExpenses;
    const total    = expenses.reduce((s, e) => s + e.amount, 0);
    const avg      = expenses.length ? total / expenses.length : 0;

    // Category breakdown
    const catTotals = {};
    expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const topCat = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0] || '—';

    document.getElementById('stat-total').textContent    = `$${total.toFixed(2)}`;
    document.getElementById('stat-avg').textContent      = `$${avg.toFixed(2)}`;
    document.getElementById('stat-top-cat').textContent  = topCat;
    document.getElementById('stat-count').textContent    = expenses.length;

    renderRecentList(expenses);
    drawCategoryChart(catTotals);

    // Monthly breakdown
    const monthly = {};
    expenses.forEach(e => {
        const m = e.date.slice(0, 7);
        monthly[m] = (monthly[m] || 0) + e.amount;
    });
    drawMonthlyChart(monthly);
}

/* ===================================================
   RENDER: RECENT LIST (DASHBOARD)
   =================================================== */
function renderRecentList(expenses) {
    const container = document.getElementById('recent-expense-list');
    const recent    = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<div class="loading-state">No expenses yet. Click "Add Expense" to get started!</div>';
        return;
    }

    container.innerHTML = recent.map(exp => {
        const acc  = accounts.find(a => a.id === exp.account_id);
        const cs   = categoryStyle(exp.category);
        return `
        <div class="recent-item">
            <div class="recent-item-left">
                <span class="category-dot" style="background:${cs.dot}"></span>
                <div>
                    <div class="recent-title">${esc(exp.title)}</div>
                    <div class="recent-meta">${esc(exp.category)} • ${acc ? esc(acc.name) : ''} • ${esc(exp.date)}</div>
                </div>
            </div>
            <span class="recent-amount">$${exp.amount.toFixed(2)}</span>
        </div>`;
    }).join('');
}

/* ===================================================
   CHARTS (vanilla Canvas)
   =================================================== */
let categoryChartInstance = null;
let monthlyChartInstance  = null;

function drawCategoryChart(catTotals) {
    const canvas = document.getElementById('category-chart');
    const ctx    = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  || 400;
    canvas.height = canvas.offsetHeight || 180;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const entries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (entries.length === 0) return;

    const maxVal  = Math.max(...entries.map(e => e[1]));
    const barW    = Math.floor((canvas.width - 40) / entries.length) - 10;
    const barMaxH = canvas.height - 50;

    entries.forEach(([cat, val], i) => {
        const cs  = categoryStyle(cat);
        const h   = Math.max(4, (val / maxVal) * barMaxH);
        const x   = 20 + i * (barW + 10);
        const y   = canvas.height - 30 - h;

        // Bar with gradient
        const grad = ctx.createLinearGradient(x, y, x, canvas.height - 30);
        grad.addColorStop(0, cs.dot);
        grad.addColorStop(1, cs.bg);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]);
        ctx.fill();

        // Label
        ctx.fillStyle = '#5a6380';
        ctx.font      = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        const shortCat = cat.length > 5 ? cat.slice(0, 4) + '…' : cat;
        ctx.fillText(shortCat, x + barW / 2, canvas.height - 12);

        // Value
        ctx.fillStyle = '#9ba3bf';
        ctx.font      = '10px Inter, sans-serif';
        ctx.fillText(`$${val.toFixed(0)}`, x + barW / 2, y - 5);
    });
}

function drawMonthlyChart(monthly) {
    const canvas = document.getElementById('monthly-chart');
    const ctx    = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  || 400;
    canvas.height = canvas.offsetHeight || 180;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const entries = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length === 0) return;

    const maxVal  = Math.max(...entries.map(e => e[1]));
    const pad     = 30;
    const chartW  = canvas.width  - pad * 2;
    const chartH  = canvas.height - 50;
    const step    = entries.length > 1 ? chartW / (entries.length - 1) : 0;

    const points  = entries.map(([, val], i) => ({
        x: pad + i * step,
        y: pad + (1 - val / maxVal) * chartH,
        val,
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, canvas.height - 30);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, canvas.height - 30);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    areaGrad.addColorStop(0, 'rgba(108,142,255,0.25)');
    areaGrad.addColorStop(1, 'rgba(108,142,255,0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#6c8eff';
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Dots + labels
    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle   = '#6c8eff';
        ctx.fill();
        ctx.strokeStyle = '#12152a';
        ctx.lineWidth   = 2;
        ctx.stroke();

        ctx.fillStyle   = '#5a6380';
        ctx.font        = '10px Inter, sans-serif';
        ctx.textAlign   = 'center';
        ctx.fillText(entries[i][0].slice(5), p.x, canvas.height - 12);
    });
}
