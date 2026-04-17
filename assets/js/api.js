// Centralized Backend URL
// For local testing, use http://127.0.0.1:8000
// For production, use your deployed Render URL

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8000' 
    : 'https://waste-backend1.onrender.com'; // Replace with actual Render/Railway URL

// Shared function to handle API calls
export async function fetchFromAPI(endpoint, options = {}) {
    try {
        const url = `${API_URL}${endpoint}`;
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
}
