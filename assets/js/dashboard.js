import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const notification = document.getElementById("notification");
    
    // Stats elements
    const totalScansEl = document.getElementById("totalScans");
    const totalItemsEl = document.getElementById("totalItems");
    const totalCategoriesEl = document.getElementById("totalCategories");
    const latestActivityEl = document.getElementById("latestActivity");
    
    let chartInstance = null;
    
    function showNotification(message, type = 'success') {
        notification.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}"></i> ${message}`;
        notification.className = `notification show ${type}`;
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    async function loadDashboardData() {
        try {
            const response = await fetch(`${API_URL}/history`);
            if (!response.ok) throw new Error("Failed to fetch history");
            
            const data = await response.json();
            const history = data.history || [];
            
            updateStats(history);
            updateChart(history);
            
        } catch (error) {
            console.error("Dashboard error:", error);
            showNotification("Failed to load dashboard data. Ensure backend is running.", "error");
        }
    }

    function updateStats(history) {
        totalScansEl.textContent = history.length;
        
        let totalItems = 0;
        let uniqueCategories = new Set();
        let latestTime = "N/A";
        
        if (history.length > 0) {
            latestTime = history[0].timestamp.split(' ')[1] || history[0].timestamp; // Just show time
        }

        history.forEach(record => {
            totalItems += record.count;
            record.detections.forEach(det => {
                uniqueCategories.add(det.class);
            });
        });
        
        totalItemsEl.textContent = totalItems;
        totalCategoriesEl.textContent = uniqueCategories.size;
        latestActivityEl.textContent = latestTime;
    }

    function updateChart(history) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Aggregate data
        const categoryCounts = {};
        history.forEach(record => {
            record.detections.forEach(det => {
                categoryCounts[det.class] = (categoryCounts[det.class] || 0) + 1;
            });
        });

        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);

        if (labels.length === 0) {
            labels.push('No Data');
            data.push(1); // dummy data for empty chart
        }

        // Modern colors for chart
        const backgroundColors = [
            '#3b82f6', // Blue
            '#10b981', // Emerald
            '#8b5cf6', // Purple
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#06b6d4'  // Cyan
        ];

        if (chartInstance) {
            chartInstance.destroy();
        }

        Chart.defaults.color = '#64748b';
        Chart.defaults.font.family = "'Poppins', sans-serif";

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#1e293b',
                            padding: 20,
                            font: {
                                size: 13,
                                family: "'Poppins', sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '75%'
            }
        });
    }

    // Initial load
    loadDashboardData();
    
    // Refresh data every 10 seconds
    setInterval(loadDashboardData, 10000);
});
