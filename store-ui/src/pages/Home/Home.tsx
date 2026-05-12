import './Home.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Deals from '../../components/Deals/Deals'
import * as React from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    axios.get('https://dummyjson.com/products/categories')
      .then(res => {
        const cats = res.data.slice(0, 12);
        Promise.all(cats.map((cat: any) =>
          axios.get(`https://dummyjson.com/products/category/${cat.slug}?limit=1`)
            .then(r => ({
              name: cat.name,
              slug: cat.slug,
              image: r.data.products[0]?.thumbnail || ''
            }))
        )).then(setCategories);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Deals />
      </Box>
      <Grid container>
        <Grid item sx={{ pl: 2, pr: 2, width: '100%'}}>
          <Paper elevation={3} sx={{ pl: 2, pb: 2 }}>
            <Typography variant="h6" sx={{ p: 1, color: 'text.primary' }}>Shop by Category</Typography>
            <Grid container spacing={2}>
              {categories.map((category: any, index: number) => (
                <Grid item key={index}>
                  <Card sx={{ width: 160, height: 200, cursor: 'pointer' }}
                    onClick={() => navigate('/search?q=' + category.slug)}>
                    <CardMedia
                      component="img"
                      height="130"
                      image={category.image}
                      alt={category.name}
                    />
                    <CardContent sx={{ p: 1 }}>
                      <Typography color="text.secondary" variant="body2">
                        {category.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
export default Home;
