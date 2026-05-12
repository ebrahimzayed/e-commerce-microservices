import axiosClient, { cartUrl } from "./config"

const addToCart = async (item: any) => {
    try {
        // جيب الـ cart الحالي الأول
        const currentCart = await getCart();
        const existingItems = currentCart?.items || [];
        
        // شوف لو المنتج موجود زود الكمية
        const existingItem = existingItems.find((i: any) => i.sku === item?.sku);
        let newItems;
        if (existingItem) {
            newItems = existingItems.map((i: any) => 
                i.sku === item?.sku 
                    ? { ...i, quantity: i.quantity + item?.quantity }
                    : i
            );
        } else {
            newItems = [...existingItems, {
                productId: item?.productId,
                sku: item?.sku,
                title: item?.title,
                quantity: item?.quantity,
                price: parseFloat(item?.price),
                currency: item?.currency
            }];
        }

        const response = await axiosClient.post(cartUrl + 'cart', {
            customerId: "john@example.com",
            items: newItems
        });
        return response.data;
    } catch (err: any) {
        console.log(err);
    }
}

export const getCart = async () => {
    try {
        const response = await axiosClient.get(cartUrl + 'cart' + '/john@example.com')
        return response.data
    } catch (err: any) {
        console.log(err)
    }
}

export default addToCart
