import axios from "axios";

const token = localStorage.getItem("token");

// Prefer CRA-style env var; fall back for legacy name; default to empty string
const API_BASE_URL = (process.env.REACT_APP_BASE_URL || process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

const params = {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
}

export const fetchDataFromApi = async (url) => {
    try {
        const endpoint = `${API_BASE_URL}${url}`;
        const { data } = await axios.get(endpoint, params)
        return data;
    } catch (error) {
        console.log(error);
        return [];
    }
}


export const uploadImage = async (url, formData) => {
    try {
        const endpoint = `${API_BASE_URL}${url}`;
        const { data } = await axios.post(endpoint, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Important for file uploads
            }
        });
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error; // Rethrow to handle in the component
    }
}

export const postData = async (url, formData) => {

    try {
        const endpoint = `${API_BASE_URL}${url}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Include your API key in the Authorization header
                'Content-Type': 'application/json', // Adjust the content type as needed
              },
           
            body: JSON.stringify(formData)
        });


      

        // First check if response is ok before trying to parse JSON
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            // For error responses, first try to get JSON error message
            try {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Request failed' };
            } catch (e) {
                // If response is not JSON, return generic error
                return { 
                    success: false, 
                    message: `Request failed with status: ${response.status}`
                };
            }
        }
    } catch (error) {
        console.error('Error:', error);
        return { 
            success: false, 
            message: error.message || 'Network error occurred'
        };
    }


}


export const editData = async (url, updatedData) => {
    try {
        const endpoint = `${API_BASE_URL}${url}`;
        const response = await axios.put(
            endpoint,
            updatedData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Edit data error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
    }
}

export const deleteData = async (url ) => {
    const endpoint = `${API_BASE_URL}${url}`;
    const { res } = await axios.delete(endpoint, params)
    return res;
}


export const deleteImages = async (url,image ) => {
    const endpoint = `${API_BASE_URL}${url}`;
    const { res } = await axios.delete(endpoint, image);
    return res;
}


// Resend OTP
export const resendOtp = async (url) => {
    try {
        const token = localStorage.getItem("token");

        const endpoint = `${API_BASE_URL}${url}`;
        const { data } = await axios.post(endpoint, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            // withCredentials: true
        });

        return data;
    } catch (error) {
        console.error("Error in resendOtp:", error.response?.data || error.message);
        throw error;
    }
};