import axios from 'axios';

const BASE_URL = 'https://script.google.com/macros/s/AKfycbw79_ptWBl8WKq44IAowMF18GhK8FY9zVYUKmZ3iz37zZzLeICBKLIAZdw39Ap9kq4/';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded', // Apps Script espera este formato para POST
  },
});

export default apiClient;