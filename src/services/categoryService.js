// src/services/categoryService.js
import api from './api';

export const categoryService = {
  async getCategories() {
    try {
      const response = await api.get('/categories');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async getCategory(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }
};