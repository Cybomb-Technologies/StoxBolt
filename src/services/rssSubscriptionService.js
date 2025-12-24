import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/rss-subscriptions`;

// Get auth token from localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get user's current subscriptions
 */
export const getUserSubscriptions = async () => {
    const response = await axios.get(API_URL, {
        headers: getAuthHeader()
    });
    return response.data;
};

/**
 * Get available RSS feeds
 */
export const getAvailableFeeds = async () => {
    const response = await axios.get(`${API_URL}/available-feeds`, {
        headers: getAuthHeader()
    });
    return response.data;
};

/**
 * Create new subscription
 */
export const createSubscription = async (subscriptionData) => {
    const response = await axios.post(API_URL, subscriptionData, {
        headers: getAuthHeader()
    });
    return response.data;
};

/**
 * Update subscription channels
 */
export const updateSubscription = async (id, channels) => {
    const response = await axios.put(`${API_URL}/${id}`, { channels }, {
        headers: getAuthHeader()
    });
    return response.data;
};

/**
 * Delete subscription
 */
export const deleteSubscription = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};
