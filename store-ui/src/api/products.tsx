import axios from "axios";

const getProductByVariantSku = async (id: any) => {
    try {
        const response = await axios.get('/api/products/products/sku/' + id);
        return response.data;
    } catch (err: any) {
        console.error("Error fetching product:", err);
    }
};

export default getProductByVariantSku;
