const app = {
    state: {
        currentView: 'dashboard',
        editingId: null,
        filters: { search: '', category: '', month: '' },
        isListening: false,
        recognition: null,
        scanTimeout: null
    },

    init: () => {
        app.setupSpeech();
        app.bindEvents();
        app.loadInitialData();
        app.renderActiveView();
    },

    bindEvents: () => {
        // Sidebar Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                app.switchView(view);
            });
        });

        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', app.toggleTheme);

        // Expense Form
        document.getElementById('expense-form').addEventListener('submit', app.handleFormSubmit);
        document.getElementById('cancel-edit').addEventListener('click', app.cancelEdit);

        // AI Feature Buttons
        document.getElementById('form-voice-btn').addEventListener('click', () => app.toggleVoice());
        document.getElementById('scan-receipt-btn').addEventListener('click', () => document.getElementById('receipt-upload').click());
        document.getElementById('receipt_upload_legacy')?.addEventListener('change', (e) => {
            // support for older upload element if exists
        });
        document.getElementById('receipt-upload').addEventListener('change', (e) => {
            if (e.target.files.length > 0) app.simulateScan();
        });
        document.getElementById('filter-search').addEventListener('input', (e) => {
            app.state.filters.search = e.target.value;
            app.renderReports();
        });
        document.getElementById('filter-category').addEventListener('change', (e) => {
            app.state.filters.category = e.target.value;
            app.renderReports();
        });
        document.getElementById('filter-month').addEventListener('change', (e) => {
            app.state.filters.month = e.target.value;
            app.renderReports();
        });
    },

    loadInitialData: () => {
        const theme = Store.getTheme();
        document.body.setAttribute('data-theme', theme);

        const date = new Date();
        document.getElementById('current-date').textContent = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

        const hr = date.getHours();
        document.getElementById('greeting').textContent = hr < 12 ? 'Good Morning,' : hr < 17 ? 'Good Afternoon,' : 'Good Evening,';

        document.getElementById('budget-input').value = Store.getBudget();
        document.getElementById('exp-date').valueAsDate = new Date();
    },

    switchView: (viewId) => {
        // Update Sidebar Active Class
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('data-view') === viewId) l.classList.add('active');
        });

        // Toggle View Sections
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const nextView = document.getElementById(viewId);
        if (nextView) nextView.classList.add('active');

        app.state.currentView = viewId;
        app.renderActiveView();
    },

    renderActiveView: () => {
        if (app.state.currentView === 'dashboard') app.renderDashboard();
        if (app.state.currentView === 'reports') app.renderReports();
    },

    renderDashboard: () => {
        const expenses = Store.getExpenses();
        const budget = Store.getBudget();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthly = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const totalSpent = monthly.reduce((s, e) => s + e.amount, 0);
        const remaining = Math.max(budget - totalSpent, 0);
        const dailyAvg = totalSpent / Math.max(now.getDate(), 1);
        const prediction = dailyAvg * new Date(currentYear, currentMonth + 1, 0).getDate();

        // Stats UI
        app.animateNumber('total-spent', totalSpent, '₹');
        app.animateNumber('remaining-budget', remaining, '₹');
        app.animateNumber('predicted-spending', prediction, '₹');
        app.animateNumber('daily-avg', dailyAvg, '₹');

        app.updateInsights();
        app.updateCharts(expenses);
    },

    renderReports: () => {
        let expenses = Store.getExpenses();
        const { search, category, month } = app.state.filters;

        if (search) {
            expenses = expenses.filter(e =>
                (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
            );
        }
        if (category) expenses = expenses.filter(e => e.category === category);
        if (month) expenses = expenses.filter(e => e.date.startsWith(month));

        const tbody = document.getElementById('full-transaction-list');
        tbody.innerHTML = '';

        [...expenses].reverse().forEach(e => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 1rem;">${app.formatDate(e.date)}</td>
                    <td style="padding: 1rem;">${e.category}</td>
                    <td style="padding: 1rem;">${e.description}</td>
                    <td style="padding: 1rem; font-weight:800; text-align: right;">₹${e.amount.toLocaleString()}</td>
                    <td style="padding: 1rem; text-align: right;">
                        <button onclick="app.editExpense(${e.id})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-right: 0.5rem;"><i data-lucide="edit-3" size="18"></i></button>
                        <button onclick="app.deleteExpense(${e.id})" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i data-lucide="trash-2" size="18"></i></button>
                    </td>
                </tr>
            `;
        });

        lucide.createIcons();
    },

    updateInsights: () => {
        const container = document.getElementById('insights-container');
        if (!container) return;
        container.innerHTML = '';

        const expenses = Store.getExpenses();
        const budget = Store.getBudget();
        const insights = Advisor.analyzeExpenses(expenses, budget);

        if (insights.length === 0) {
            container.innerHTML = '<div class="card" style="grid-column: 1/-1;">Not enough data for AI analysis. Start adding expenses!</div>';
            return;
        }

        insights.forEach(s => {
            let colorClass = 'var(--primary)';
            if (s.type === 'warning') colorClass = 'var(--danger)';
            if (s.type === 'increase') colorClass = 'var(--accent)';
            if (s.type === 'decrease') colorClass = 'var(--success)';

            container.innerHTML += `
                <div class="card insight-card" style="border-left: 4px solid ${colorClass};">
                    <div class="insight-icon-container" style="background:rgba(99,102,241,0.08); color:${colorClass};">
                        <i data-lucide="${s.icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size:0.95rem; font-weight: 700;">${s.title}</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">${s.text}</p>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    },

    autoDetectCategory: (text) => {
        const lower = text.toLowerCase();
        const select = document.getElementById('exp-category');

        if (/restaurant|cafe|food|swiggy|zoma|pizza|burger|grill/.test(lower)) select.value = 'Food';
        else if (/uber|ola|taxi|ride|fare|transport|auto|bus|flight/.test(lower)) select.value = 'Travel';
        else if (/amazon|flip|shop|myntra|reliance|mall/.test(lower)) select.value = 'Shopping';
        else if (/bill|rent|electricity|phone|recharge|bescom|jio|airtel/.test(lower)) select.value = 'Bills';
        else if (/education|school|course|book/.test(lower)) select.value = 'Education';
        else if (/movie|cinema|netflix|show|entertainment/.test(lower)) select.value = 'Entertainment';
    },

    simulateScan: async () => {
        const status = document.getElementById('scan-status');
        status.style.display = 'block';

        const mockReceipts = [
            "STARBUCKS COFFEE\n123 MG ROAD\nBANGALORE\nCOFFEE 320\nTOTAL ₹320.00\nPAID VIA CARD",
            "MCDONA1D RESTAURANT\nBURGER 250\nFRIES 100\nCOKE 50\nSUBTOTAL 400\nGRAND TOTAL ₹418.00\nCASH 500\nCHANGE 82",
            "UBER INDIA\nTRIP TO AIRPORT\nBASE FARE 300\nTOTAL AMOUNT ₹456.50\nPAID VIA PAYTM",
            "AMAZON.IN INVOICE\nELECTRONIC ITEM 1200\nDELIVERY 40\nBILL TOTAL Rs 1240.00\nTHANKS FOR SHOPPING",
            "KFC CHICKEN\nZINGER BURGER 190\nPEPSI 60\nTOTAL ₹250.00",
            "PUNJAB GRILL\nCHICKEN TIKKA 410\nBUTTER NAAN 70\nSUBTOTAL 530\nGST 13.25\nTOTAL AMOUNT ₹556.50"
        ];

        const rawText = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];

        app.state.scanTimeout = setTimeout(() => {
            const result = app.analyzeReceipt(rawText);
            status.style.display = 'none';
            app.showToast('Receipt successfully analyzed. Please verify details.', 'camera');

            document.getElementById('exp-desc').value = result.description;
            document.getElementById('exp-amount').value = result.amount;
            document.getElementById('exp-category').value = result.category;
            document.getElementById('exp-date').valueAsDate = new Date();

            document.getElementById('receipt-upload').value = '';
            app.state.scanTimeout = null;
        }, 2000);
    },

    analyzeReceipt: (rawText) => {
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const description = lines[0] || "New Expense";

        let cleaned = rawText.toLowerCase();
        cleaned = cleaned.replace(/\s+/g, ' ');
        cleaned = cleaned.split('').filter(c => /[a-z0-9\s₹$rsinc\.]/.test(c)).join('');

        const cleanForNumbers = (t) => t.replace(/o/g, '0').replace(/l|i/g, '1').replace(/s/g, '5');
        const cleanedText = cleanForNumbers(cleaned);

        const currencyRegex = /(?:₹|rs|inr)\s?\d+(?:\.\d{1,2})?/gi;
        const detectedCurrencyValues = [];
        let match;
        while ((match = currencyRegex.exec(cleanedText)) !== null) {
            const valStr = match[0].replace(/[^\d.]/g, "");
            const val = parseFloat(valStr);
            if (!isNaN(val)) detectedCurrencyValues.push(val);
        }

        const allNumbers = cleanedText.match(/\d+(?:\.\d{1,2})?/g) || [];
        const numericValues = allNumbers.map(n => parseFloat(n)).filter(n => !isNaN(n));

        const totalKeywords = ['total', 'grand total', 'amount payable', 'net total', 'bill total', 'final amount', 'amount due'];
        const normalizedKeywords = totalKeywords.map(kw => cleanForNumbers(kw));

        let selectedTotal = 0;
        let foundViaKeyword = false;

        normalizedKeywords.forEach((kw) => {
            if (cleanedText.includes(kw)) {
                const idx = cleanedText.indexOf(kw);
                const nearbyText = cleanedText.substring(idx, idx + 40);
                const potentialMatch = nearbyText.match(/\d+(?:\.\d{1,2})?/);
                if (potentialMatch) {
                    const val = parseFloat(potentialMatch[0]);
                    if (val > selectedTotal) {
                        selectedTotal = val;
                        foundViaKeyword = true;
                    }
                }
            }
        });

        if (!foundViaKeyword) {
            if (detectedCurrencyValues.length > 0) selectedTotal = Math.max(...detectedCurrencyValues);
            else if (numericValues.length > 0) selectedTotal = Math.max(...numericValues);
        }

        let category = 'Others';
        const searchPool = rawText.toLowerCase();

        if (/restaurant|cafe|food|swiggy|zomato|grill|tikka|naan|bakery|coffee|starbucks|mcdonald|pizza|burger|kitchen|dinner|dhaba|biryani|caterer/.test(searchPool)) category = 'Food';
        else if (/uber|ola|taxi|metro|fuel|petrol|travel|flight|train|ride|fare|transport|auto|bus|rapido|indriver/.test(searchPool)) category = 'Travel';
        else if (/amazon|flipkart|shop|cloth|myntra|reliance|mall|store|fashion|supermarket|mart|grocery|bigbasket|blinkit/.test(searchPool)) category = 'Shopping';
        else if (/electricity|bill|water|rent|recharge|phone|utility|payment|invoice|bescom|airtel|jio|vi |bsnl/.test(searchPool)) category = 'Bills';

        return { amount: selectedTotal, category, description };
    },

    cancelScan: () => {
        if (app.state.scanTimeout) {
            clearTimeout(app.state.scanTimeout);
            app.state.scanTimeout = null;
        }
        document.getElementById('scan-status').style.display = 'none';
        document.getElementById('receipt-upload').value = '';
        app.showToast('Scanning cancelled.', 'x-circle');
    },

    handleFormSubmit: (e) => {
        e.preventDefault();
        const data = {
            id: app.state.editingId,
            description: document.getElementById('exp-desc').value,
            amount: parseFloat(document.getElementById('exp-amount').value),
            category: document.getElementById('exp-category').value,
            date: document.getElementById('exp-date').value
        };

        Store.saveExpense(data);
        app.showToast(data.id ? 'Entry Updated' : 'Entry Saved', 'check');
        app.cancelEdit();
        app.switchView('dashboard');
    },

    editExpense: (id) => {
        const exp = Store.getExpenses().find(e => e.id === id);
        if (!exp) return;
        app.state.editingId = id;
        app.switchView('add-expense');
        document.getElementById('exp-desc').value = exp.description;
        document.getElementById('exp-amount').value = exp.amount;
        document.getElementById('exp-category').value = exp.category;
        document.getElementById('exp-date').value = exp.date;
        document.getElementById('submit-btn').textContent = 'Update Transaction';
        document.getElementById('cancel-edit').style.display = 'block';
    },

    cancelEdit: () => {
        app.state.editingId = null;
        document.getElementById('expense-form').reset();
        document.getElementById('submit-btn').textContent = 'Register Transaction';
        document.getElementById('cancel-edit').style.display = 'none';
        document.getElementById('exp-date').valueAsDate = new Date();
    },

    deleteExpense: (id) => {
        if (confirm('Purge this record?')) {
            Store.deleteExpense(id);
            app.renderReports();
            app.showToast('Record Purged', 'trash');
        }
    },

    updateBudget: () => {
        const val = document.getElementById('budget-input').value;
        Store.setBudget(val);
        app.renderActiveView();
        app.showToast('Budget Updated', 'shield');
    },

    resetAll: () => {
        if (confirm('Wipe ALL data? AI memory will be cleared.')) {
            Store.clearAll();
            location.reload();
        }
    },

    animateNumber: (id, target, prefix = '') => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = `${prefix}${Math.round(target).toLocaleString()}`;
    },

    formatDate: (str) => new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),

    toggleTheme: () => {
        const curr = document.body.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        Store.setTheme(next);
        document.getElementById('theme-icon')?.setAttribute('data-lucide', next === 'dark' ? 'moon' : 'sun');
        lucide.createIcons();
    },

    showToast: (msg, icon) => {
        const t = document.getElementById('toast');
        if (!t) return;
        t.innerHTML = `<i data-lucide="${icon}"></i> ${msg}`;
        lucide.createIcons();
        t.style.transform = 'translateY(0)';
        setTimeout(() => t.style.transform = 'translateY(200px)', 3000);
    },

    setupSpeech: () => {
        const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!recognition) return;
        app.state.recognition = new recognition();
        app.state.recognition.lang = 'en-IN';
        app.state.recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript.toLowerCase();
            app.showToast(`AI Heard: "${txt}"`, 'mic');
            const amt = txt.match(/\d+/);
            if (amt) document.getElementById('exp-amount').value = amt[0];
            document.getElementById('exp-desc').value = `Voice: ${txt}`;
        };
    },

    toggleVoice: () => {
        if (!app.state.recognition) return alert('Speech not supported.');
        app.state.recognition.start();
        app.showToast('Listening...', 'mic-2');
    },

    updateCharts: (expenses) => {
        const cats = {};
        expenses.forEach(e => cats[e.category] = (cats[e.category] || 0) + e.amount);
        Charts.initPieChart(document.getElementById('pieChart'), cats);

        const barData = { labels: [], values: [] };
        for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const m = d.toLocaleString('default', { month: 'short' });
            barData.labels.push(m);
            barData.values.push(expenses.filter(e => new Date(e.date).getMonth() === d.getMonth()).reduce((s, e) => s + e.amount, 0));
        }
        Charts.initBarChart(document.getElementById('monthlyChart'), barData);

        const lineData = { labels: [], values: [] };
        for (let i = 14; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            lineData.labels.push(d.getDate());
            lineData.values.push(expenses.filter(e => new Date(e.date).toDateString() === d.toDateString()).reduce((s, e) => s + e.amount, 0));
        }
        Charts.initLineChart(document.getElementById('dailyLineChart'), lineData);
    },

    exportCSV: () => {
        const exp = Store.getExpenses();
        const csv = 'Date,Category,Description,Amount\n' + exp.map(e => `${e.date},${e.category},"${e.description}",${e.amount}`).join('\n');
        const b = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'Expenses.csv'; a.click();
    },

    exportPDF: () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('ExpenseAI Transaction Ledger', 14, 15);
        doc.autoTable({
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: Store.getExpenses().map(e => [e.date, e.category, e.description, `INR ${e.amount}`]),
            startY: 20
        });
        doc.save('ExpenseAI_Ledger.pdf');
    }
};

document.addEventListener('DOMContentLoaded', app.init);
