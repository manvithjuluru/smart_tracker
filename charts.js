const Charts = {
    instances: {},

    colors: [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'
    ],

    initPieChart: (ctx, data) => {
        if (Charts.instances.pie) Charts.instances.pie.destroy();

        Charts.instances.pie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: Charts.colors,
                    borderWidth: 0,
                    hoverOffset: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 25,
                            color: '#94a3b8',
                            font: { family: 'Plus Jakarta Sans', weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleFont: { family: 'Plus Jakarta Sans' },
                        bodyFont: { family: 'Plus Jakarta Sans' },
                        callbacks: {
                            label: (context) => ` ₹${context.raw.toLocaleString()}`
                        }
                    }
                },
                cutout: '75%'
            }
        });
    },

    initBarChart: (ctx, data) => {
        if (Charts.instances.bar) Charts.instances.bar.destroy();

        Charts.instances.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Monthly Spend',
                    data: data.values,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    hoverBackgroundColor: '#6366f1',
                    borderRadius: 10,
                    barThickness: 24
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: {
                            color: '#94a3b8',
                            callback: (val) => '₹' + val.toLocaleString(),
                            font: { family: 'Plus Jakarta Sans' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString()}` }
                    }
                }
            }
        });
    },

    initLineChart: (ctx, data) => {
        if (Charts.instances.line) Charts.instances.line.destroy();

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

        Charts.instances.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Daily Spend',
                    data: data.values,
                    borderColor: '#6366f1',
                    borderWidth: 3,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: {
                            color: '#94a3b8',
                            callback: (val) => '₹' + val.toLocaleString(),
                            font: { family: 'Plus Jakarta Sans' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString()}` }
                    }
                }
            }
        });
    }
};
