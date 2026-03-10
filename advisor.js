const Advisor = {
    /**
     * Main analysis engine that generates insights based on expense data.
     * @param {Array} expenses - Full array of expense objects.
     * @param {number} budget - Monthly budget.
     * @returns {Array} - Array of insight objects.
     */
    analyzeExpenses: (expenses, budget) => {
        const insights = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Basic Stats Calculation
        const monthlyExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        if (monthlyExpenses.length === 0) {
            return [{
                icon: 'zap',
                title: 'Ready to Start?',
                text: 'Add your first expense for this month to see smart financial feedback!',
                type: 'tip'
            }];
        }

        const totalSpent = monthlyExpenses.reduce((s, e) => s + e.amount, 0);

        // 2. Highest Spending Category
        const categories = {};
        monthlyExpenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });
        const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCats[0];

        insights.push({
            icon: 'trending-up',
            title: 'Top Category',
            text: `You are spending most of your money on ${topCategory[0]} this month.`,
            type: 'increase'
        });

        // 3. Largest Expense
        const largest = monthlyExpenses.reduce((max, e) => e.amount > max.amount ? e : max, monthlyExpenses[0]);
        insights.push({
            icon: 'shopping-bag',
            title: 'Largest Expense',
            text: `Your biggest expense this month was ₹${largest.amount.toLocaleString()} on ${largest.description}.`,
            type: 'tip'
        });

        // 4. Daily Spending Pattern
        const dayOfMonth = now.getDate();
        const dailyAvg = totalSpent / Math.max(dayOfMonth, 1);
        insights.push({
            icon: 'bar-chart-3',
            title: 'Daily Average',
            text: `Your average daily spending is ₹${Math.round(dailyAvg).toLocaleString()}.`,
            type: 'tip'
        });

        // 5. Budget Warning (80% rule)
        const budgetUsage = (totalSpent / budget) * 100;
        if (budgetUsage >= 80) {
            insights.push({
                icon: 'alert-triangle',
                title: 'Budget Alert',
                text: `Warning: You have already used ${Math.round(budgetUsage)}% of your monthly budget.`,
                type: 'warning'
            });
        }

        // 6. Weekly Comparison
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(now.getDate() - 14);

        const currentWeekExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= oneWeekAgo && d <= now;
        }).reduce((s, e) => s + e.amount, 0);

        const lastWeekExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= twoWeeksAgo && d < oneWeekAgo;
        }).reduce((s, e) => s + e.amount, 0);

        if (lastWeekExpenses > 0) {
            const diff = currentWeekExpenses - lastWeekExpenses;
            const percent = Math.abs((diff / lastWeekExpenses) * 100);
            if (diff > 0) {
                insights.push({
                    icon: 'trending-up',
                    title: 'Weekly Hike',
                    text: `You spent ${Math.round(percent)}% more this week compared to last week.`,
                    type: 'increase'
                });
            } else {
                insights.push({
                    icon: 'trending-down',
                    title: 'Saving Progress',
                    text: `Your spending decreased by ${Math.round(percent)}% compared to last week.`,
                    type: 'decrease'
                });
            }
        }

        // 7. Category Recommendations (>40% of spending)
        sortedCats.forEach(([cat, amt]) => {
            const share = (amt / totalSpent) * 100;
            if (share > 40) {
                insights.push({
                    icon: 'lightbulb',
                    title: 'Smart Recommendation',
                    text: `You spent ${Math.round(share)}% of your money on ${cat}. Consider reducing restaurant or leisure expenses in this area.`,
                    type: 'tip'
                });
            }
        });

        // 8. Smart Dynamic Tips
        if (topCategory[0] === 'Food' && topCategory[1] > 2000) {
            const potentialSavings = Math.round(topCategory[1] * 0.1);
            insights.push({
                icon: 'piggy-bank',
                title: 'Savings Potential',
                text: `If you reduce food spending by 10%, you can save ₹${potentialSavings.toLocaleString()} per month.`,
                type: 'tip'
            });
        }

        // 9. Tone Check & Slice (Limit to 5 as requested by UI design usually, but user asked for 3-5)
        return insights.sort((a, b) => (a.type === 'warning' ? -1 : 1)).slice(0, 5);
    },

    /**
     * Maps insight type to Lucide icons and colors for rich aesthetics.
     */
    getIcon: (type) => {
        switch (type) {
            case 'warning': return 'alert-triangle';
            case 'increase': return 'trending-up';
            case 'decrease': return 'trending-down';
            default: return 'lightbulb';
        }
    }
};
