import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    const videoElement = document.getElementById("videoElement");
    const canvasElement = document.getElementById("canvasElement");
    const processedImage = document.getElementById("processedImage");
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const liveResults = document.getElementById("liveResults");
    const notification = document.getElementById("notification");
    
    let stream = null;
    let isDetecting = false;
    let detectionInterval;

    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    startBtn.addEventListener("click", async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            videoElement.srcObject = stream;
            
            videoElement.style.display = "none";
            processedImage.style.display = "block";
            
            startBtn.style.display = "none";
            stopBtn.style.display = "inline-block";
            
            isDetecting = true;
            startDetectionLoop();
            showNotification("Camera started successfully");
        } catch (err) {
            console.error("Error accessing webcam:", err);
            showNotification("Error accessing webcam. Please check permissions.", "error");
        }
    });

    stopBtn.addEventListener("click", () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        isDetecting = false;
        clearTimeout(detectionInterval);
        
        videoElement.srcObject = null;
        videoElement.style.display = "block";
        processedImage.style.display = "none";
        
        startBtn.style.display = "inline-block";
        stopBtn.style.display = "none";
        liveResults.innerHTML = "";
    });

    async function startDetectionLoop() {
        if (!isDetecting) return;

        const context = canvasElement.getContext("2d");
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;
        
        if (canvasElement.width > 0) {
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            
            // Get base64 image from canvas
            // Reduce quality for faster network transfer
            const base64Image = canvasElement.toDataURL("image/jpeg", 0.7);

            try {
                const response = await fetch(`${API_URL}/webcam`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ image: base64Image })
                });

                if (!response.ok) {
                    throw new Error("API stream error");
                }

                const data = await response.json();
                
                // Update processed image
                if (data.image_base64) {
                    processedImage.src = `data:image/jpeg;base64,${data.image_base64}`;
                }
                
                // Update detections
                if (data.detections && data.detections.length > 0) {
                    let html = '<div class="results-box" style="display: flex; gap: 10px; flex-wrap: wrap;">';
                    data.detections.forEach(det => {
                        html += `<span style="background: var(--primary); padding: 5px 10px; border-radius: 20px; font-size: 0.9rem; font-weight: 500">${det.class} ${(det.confidence * 100).toFixed(0)}%</span>`;
                    });
                    html += '</div>';
                    liveResults.innerHTML = html;
                } else {
                    liveResults.innerHTML = '<div class="results-box"><p>Scanning...</p></div>';
                }

            } catch (error) {
                console.error("Frame processing error:", error);
                // Try to reconnect or fail silently
            }
        }
        
        // Loop using setTimeout to avoid queueing up too many requests if backend is slow
        // ~3-4 FPS is enough for web demo
        detectionInterval = setTimeout(() => {
            if (isDetecting) {
                requestAnimationFrame(startDetectionLoop);
            }
        }, 300);
    }
});
