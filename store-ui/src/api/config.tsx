import axios from "axios";

export const productsUrl = "/api/products/";
export const cartUrl = "/api/cart/";
export const searchUrl = "/api/search";
export const usersUrl = "/api/users/";

const axiosClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default axiosClient;
