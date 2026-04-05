import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const historyTableBody = document.getElementById("historyTableBody");
    const exportBtn = document.getElementById("exportBtn");
    const notification = document.getElementById("notification");
    
    let chartInstance = null;
    
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Export functionality
    exportBtn.addEventListener("click", () => {
        window.open(`${API_URL}/export/excel`, '_blank');
    });

    async function loadDashboardData() {
        try {
            const response = await fetch(`${API_URL}/history`);
            if (!response.ok) throw new Error("Failed to fetch history");
            
            const data = await response.json();
            const history = data.history || [];
            
            updateTable(history);
            updateChart(history);
            
        } catch (error) {
            console.error("Dashboard error:", error);
            showNotification("Failed to load dashboard data. Is the backend running?", "error");
        }
    }

    function updateTable(history) {
        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No detections yet.</td></tr>';
            return;
        }

        let html = '';
        // Show only last 10 for the table
        const displayHistory = history.slice(0, 10);
        
        displayHistory.forEach(record => {
            const classes = record.detections.map(d => d.class).join(', ') || 'None';
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px;">#${record.id}</td>
                    <td style="padding: 10px;">${record.timestamp}</td>
                    <td style="padding: 10px; text-transform: capitalize;">${classes}</td>
                    <td style="padding: 10px;">
                        <span style="background: var(--primary); padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">
                            ${record.count}
                        </span>
                    </td>
                </tr>
            `;
        });
        historyTableBody.innerHTML = html;
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

        // Generate some colors
        const backgroundColors = [
            'rgba(16, 185, 129, 0.7)', // Emerald
            'rgba(59, 130, 246, 0.7)', // Blue
            'rgba(245, 158, 11, 0.7)', // Amber
            'rgba(239, 68, 68, 0.7)',  // Red
            'rgba(139, 92, 246, 0.7)', // Purple
            'rgba(14, 165, 233, 0.7)'  // Sky
        ];

        if (chartInstance) {
            chartInstance.destroy();
        }

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f8fafc',
                            padding: 20
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // Initial load
    loadDashboardData();
    
    // Refresh data every 10 seconds if user stays on page
    setInterval(loadDashboardData, 10000);
});
