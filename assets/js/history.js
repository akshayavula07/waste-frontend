import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const historyTableBody = document.getElementById("historyTableBody");
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    const exportPdfBtn = document.getElementById("exportPdfBtn");
    const notification = document.getElementById("notification");
    
    function showNotification(message, type = 'success') {
        notification.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}"></i> ${message}`;
        notification.className = `notification show ${type}`;
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Export Excel
    exportExcelBtn.addEventListener("click", () => {
        showNotification("Starting Excel download...");
        window.open(`${API_URL}/export/excel`, '_blank');
    });

    // Export PDF
    exportPdfBtn.addEventListener("click", () => {
        showNotification("Generating PDF report...");
        const tableCard = document.querySelector('.card');
        const opt = {
            margin:       1,
            filename:     'ecovision-history-report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(tableCard).save().then(() => {
            showNotification("PDF report generated successfully!");
        });
    });

    async function loadHistoryData() {
        try {
            const response = await fetch(`${API_URL}/history`);
            if (!response.ok) throw new Error("Failed to fetch history");
            
            const data = await response.json();
            const history = data.history || [];
            
            updateTable(history);
            
        } catch (error) {
            console.error("History error:", error);
            showNotification("Failed to load history data", "error");
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Failed to load connection data.</td></tr>';
        }
    }

    function updateTable(history) {
        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No detection records found.</td></tr>';
            return;
        }

        let html = '';
        
        history.forEach((record, index) => {
            const classes = record.detections.map(d => `<span class="badge" style="margin-right: 4px; margin-bottom: 4px; display: inline-block;">${d.class}</span>`).join('') || '<span class="badge bg-secondary">None</span>';
            const statusColor = record.count > 0 ? "var(--secondary)" : "var(--text-muted)";
            const statusText = record.count > 0 ? "Detected" : "Clear";

            html += `
                <tr>
                    <td style="padding: 1.25rem 1.5rem; font-weight: 500;">EV-${record.id.toString().padStart(4, '0')}</td>
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-muted);">${record.timestamp}</td>
                    <td style="padding: 1.25rem 1.5rem;">${classes}</td>
                    <td style="padding: 1.25rem 1.5rem; font-weight: 600;">
                        ${record.count} items
                    </td>
                    <td style="padding: 1.25rem 1.5rem;">
                        <span style="display: flex; align-items: center; gap: 0.5rem; color: ${statusColor}; font-weight: 500;">
                            <span style="display: block; width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></span>
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        });
        historyTableBody.innerHTML = html;
    }

    // Initial load
    loadHistoryData();
});
