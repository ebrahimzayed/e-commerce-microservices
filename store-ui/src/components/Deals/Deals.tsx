import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import axiosClient, { productsUrl } from '../../api/config';
import addToCart from '../../api/cart';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const Deals = () => {
    const navigate = useNavigate();
    const [deals, setDeals] = useState([])
    const [error, setError] = useState(null)

    const loadDeals = async () => {
        try {
            const response = await axiosClient.get(productsUrl + 'deals')
            setDeals(response.data)
            setError(null)
        } catch (err: any) {
            setError(err)
        }
    }

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

    useEffect(() => { loadDeals() }, [])

    return (
        <Paper elevation={3} sx={{ pl: 2, pb: 2 }}>
            <Typography variant="h6" sx={{ p: 1, color: 'text.primary' }}>Deals of the Day</Typography>
            <Grid container spacing={2}>
                <>
                    {deals.slice(0, 70).map((deal: any) => (
                        <Grid item key={deal.dealId}>
                            <Card sx={{ width: 250, height: 290 }}>
                                <Link component="button"
                                    onClick={() => navigate('product/' + deal.variantSku)}
                                    underline="none" sx={{ display: 'block', width: '100%' }}>
                                    <Box><img src={deal.thumbnail} height="150" alt={deal.name} /></Box>
                                    <CardContent sx={{ height: 50 }}>
                                        <Typography color="text.secondary">{deal.shortDescription}</Typography>
                                    </CardContent>
                                </Link>
                                <CardActions>
                                    <Grid container>
                                        <Grid item xs={5} sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="h6">$ {deal.price}</Typography>
                                        </Grid>
                                        <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Chip icon={<StarIcon />} label={deal.rating} />
                                        </Grid>
                                        <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <IconButton color="primary" onClick={(e) => handleAddToCart(e, deal)}>
                                                <ShoppingCartIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </>
            </Grid>
        </Paper>
    )
}

export default Deals
