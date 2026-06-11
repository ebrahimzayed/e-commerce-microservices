import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axiosClient, { productsUrl } from '../../api/config';
import addToCart from '../../api/cart';

const Deals = () => {
    const navigate = useNavigate();
    const [deals, setDeals] = useState([]);
    const [error, setError] = useState(null);

    const loadDeals = async () => {
        try {
            const response = await axiosClient.get(productsUrl + 'deals');
            setDeals(response.data);
            setError(null);
        } catch (err: any) {
            setError(err);
        }
    };

    const handleAddToCart = async (e: React.MouseEvent, deal: any) => {
        e.stopPropagation();
        e.preventDefault();
        const item = {
            productId: deal.productId,
            sku: deal.variantSku,
            title: deal.shortDescription,
            quantity: 1,
            price: deal.price,
            currency: 'USD'
        };
        await addToCart(item);
        navigate('/cart');
    };

    useEffect(() => { loadDeals(); }, []);

    return (
        <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Deals of the Day</h2>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
            }}>
                {deals.slice(0, 70).map((deal: any) => (
                    <div
                        key={deal.dealId}
                        onClick={() => navigate('product/' + deal.variantSku)}
                        style={{
                            background: '#fff',
                            border: '0.5px solid #e5e5e5',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, transform 0.15s',
                            position: 'relative',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = '#aaa';
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                            const overlay = e.currentTarget.querySelector('.card-overlay') as HTMLElement;
                            if (overlay) overlay.style.opacity = '1';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e5e5';
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                            const overlay = e.currentTarget.querySelector('.card-overlay') as HTMLElement;
                            if (overlay) overlay.style.opacity = '0';
                        }}
                    >
                        {/* Image */}
                        <div style={{
                            height: '180px',
                            background: '#f8f8f8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <img
                                src={deal.thumbnail}
                                alt={deal.shortDescription}
                                style={{ height: '150px', objectFit: 'contain' }}
                            />
                            {/* Overlay with Add to Cart */}
                            <div
                                className="card-overlay"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.04)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    paddingBottom: '12px'
                                }}
                                onClick={(e) => handleAddToCart(e, deal)}
                            >
                                <button style={{
                                    background: '#1a1a2e',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 20px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    🛒 Add to cart
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '12px 14px' }}>
                            <p style={{
                                fontSize: '13px',
                                color: '#666',
                                margin: '0 0 10px',
                                lineHeight: 1.4,
                                height: '36px',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as any,
                            }}>
                                {deal.shortDescription}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '18px', fontWeight: 500 }}>
                                    ${deal.price}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '12px',
                                        color: '#666',
                                        background: '#f5f5f5',
                                        padding: '3px 8px',
                                        borderRadius: '20px'
                                    }}>
                                        ⭐ {deal.rating}
                                    </span>
                                    <div
                                        onClick={(e) => handleAddToCart(e, deal)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: '0.5px solid #ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '16px'
                                        }}
                                    >
                                        🛒
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Deals;
