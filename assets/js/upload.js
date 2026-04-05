import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const previewContainer = document.getElementById("previewContainer");
    const previewImage = document.getElementById("previewImage");
    const resultsList = document.getElementById("resultsList");
    const loader = document.getElementById("loader");
    const notification = document.getElementById("notification");

    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Drag and Drop Handlers
    dropZone.addEventListener("click", () => fileInput.click());
    
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });
    
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener("change", function () {
        if (this.files.length) {
            handleFile(this.files[0]);
        }
    });

    async function handleFile(file) {
        if (!file.type.startsWith("image/")) {
            showNotification("Please upload an image file (JPG/PNG).", "error");
            return;
        }

        // Hide old results, show loader
        previewContainer.style.display = "none";
        loader.style.display = "block";
        resultsList.innerHTML = "";
        dropZone.style.display = "none";

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to process image. Make sure the backend is running.");
            }

            const data = await response.json();
            
            // Show new results
            previewImage.src = `data:image/jpeg;base64,${data.image_base64}`;
            
            if (data.detections && data.detections.length > 0) {
                let html = '<div class="results-box">';
                data.detections.forEach((det, index) => {
                    html += `
                        <div class="result-item">
                            <span style="font-weight: 600; text-transform: capitalize;">${det.class}</span>
                            <span style="color: var(--primary);">Confidence: ${(det.confidence * 100).toFixed(1)}%</span>
                        </div>
                    `;
                });
                html += '</div>';
                resultsList.innerHTML = html;
                showNotification(`Detected ${data.detections.length} objects`, 'success');
            } else {
                resultsList.innerHTML = '<div class="results-box"><p style="text-align: center;">No waste detected in this image.</p></div>';
                showNotification('No objects detected', 'success');
            }
            
            previewContainer.style.display = "block";
        } catch (error) {
            console.error(error);
            showNotification(error.message, 'error');
        } finally {
            loader.style.display = "none";
            dropZone.style.display = "block";
            // Reset input
            fileInput.value = "";
        }
    }
});
