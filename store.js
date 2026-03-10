const Store = {
    getExpenses: () => {
        const data = localStorage.getItem('expenses');
        if (!data) {
            // Seed more history for AI trend analysis demo
            const seed = [];
            const now = new Date();
            const categories = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Education', 'Bills', 'Others'];

            // Last 30 days
            for (let i = 30; i >= 0; i--) {
                const date = new Date();
                date.setDate(now.getDate() - i);
                if (Math.random() > 0.4) {
                    seed.push({
                        id: Date.now() + i,
                        description: `Seed Entry ${i}`,
                        amount: Math.floor(Math.random() * 2000) + 100,
                        category: categories[Math.floor(Math.random() * categories.length)],
                        date: date.toISOString().split('T')[0]
                    });
                }
            }
            localStorage.setItem('expenses', JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(data);
    },

    saveExpense: (expense) => {
        const expenses = Store.getExpenses();
        if (expense.id) {
            const idx = expenses.findIndex(e => e.id === expense.id);
            if (idx !== -1) expenses[idx] = { ...expense };
        } else {
            expenses.push({ ...expense, id: Date.now() });
        }
        localStorage.setItem('expenses', JSON.stringify(expenses));
    },

    deleteExpense: (id) => {
        const filtered = Store.getExpenses().filter(e => e.id !== id);
        localStorage.setItem('expenses', JSON.stringify(filtered));
    },

    getBudget: () => parseFloat(localStorage.getItem('budget')) || 50000,
    setBudget: (val) => localStorage.setItem('budget', val),

    getTheme: () => localStorage.getItem('theme') || 'dark',
    setTheme: (t) => localStorage.setItem('theme', t),

    clearAll: () => localStorage.clear()
};
