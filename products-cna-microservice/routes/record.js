const express = require('express');
const recordRoutes = express.Router();
const https = require('https');

const fetchFromDummy = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

recordRoutes.route('/deals').get(async function (_req, res) {
    try {
        const data = await fetchFromDummy('https://dummyjson.com/products?limit=70');
        const deals = data.products.map((p) => ({
            dealId: 'd-' + p.id,
            productId: String(p.id),
            variantSku: p.sku,
            department: p.category,
            thumbnail: p.thumbnail,
            image: p.images[0] || p.thumbnail,
            title: p.title,
            description: p.description,
            shortDescription: p.title,
            price: String(p.price),
            currency: 'USD',
            rating: String(p.rating)
        }));
        res.json(deals);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

recordRoutes.route('/products').get(async function (_req, res) {
    try {
        const data = await fetchFromDummy('https://dummyjson.com/products?limit=70');
        res.json(data.products);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

recordRoutes.route('/products/sku/:id').get(async function (_req, res) {
    try {
        const sku = _req.params.id;
        const data = await fetchFromDummy('https://dummyjson.com/products?limit=70');
        const product = data.products.find(p => p.sku === sku);
        if (!product) { res.json(null); return; }
        res.json({
            _id: String(product.id),
            department: product.category,
            category: product.category,
            thumbnail: product.thumbnail,
            image: product.images[0] || product.thumbnail,
            title: product.title,
            description: product.description,
            shortDescription: product.title,
            price: String(product.price),
            currency: 'USD',
            rating: String(product.rating),
            attributes: { brand: product.brand || 'Generic' },
            secondaryAttributes: {},
            variants: [{ sku: product.sku, thumbnail: product.thumbnail, image: product.images[0] || product.thumbnail }]
        });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

module.exports = recordRoutes;
