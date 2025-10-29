import axios from "axios";

// Determine backend base URL: prefer env, fallback to production backend
const BASE_URL = (
    "https://rich-agrisupply-backend.vercel.app"
).replace(/\/$/, "");

const buildAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
    };
};

export const fetchDataFromApi = async (url) => {
    try {
        const endpoint = `${BASE_URL}${url}`;
        const { data } = await axios.get(endpoint, { headers: buildAuthHeaders() });
        return data;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export const uploadImage = async (url, formData) => {
    try {
        const endpoint = `${BASE_URL}${url}`;
        const { data } = await axios.post(endpoint, formData, {
            headers: {
                ...buildAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            }
        });
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

export const postData = async (url, formData) => {
    try {
        const endpoint = `${BASE_URL}${url}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            try {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Request failed' };
            } catch (e) {
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
        const endpoint = `${BASE_URL}${url}`;
        const response = await axios.put(
            endpoint,
            updatedData,
            {
                headers: buildAuthHeaders()
            }
        );
        return response.data;
    } catch (error) {
        console.error('Edit data error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
    }
}

export const deleteData = async (url) => {
    const endpoint = `${BASE_URL}${url}`;
    const { data } = await axios.delete(endpoint, { headers: buildAuthHeaders() });
    return data;
}

export const deleteImages = async (url, image) => {
    const endpoint = `${BASE_URL}${url}`;
    const { data } = await axios.delete(endpoint, { headers: buildAuthHeaders(), data: image });
    return data;
}

// Resend OTP
export const resendOtp = async (url) => {
    try {
        const endpoint = `${BASE_URL}${url}`;
        const { data } = await axios.post(endpoint, {}, {
            headers: buildAuthHeaders(),
        });

        return data;
    } catch (error) {
        console.error("Error in resendOtp:", error.response?.data || error.message);
        throw error;
    }
};