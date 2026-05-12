import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

const Search = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('q') || '';
    const [results, setResults] = React.useState([]);

    React.useEffect(() => {
        if (query) {
            axios.get('/api/search/search?q=' + query)
                .then(res => {
                    const hits = res.data?.hits?.hits || [];
                    setResults(hits);
                })
                .catch(err => console.error(err));
        }
    }, [query]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6">Search results for: "{query}"</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                {results.map((hit: any) => (
                    <Grid item key={hit._id}>
                        <Link component="button" underline="none"
                            onClick={() => navigate('/product/' + hit._source.sku)}>
                            <Card sx={{ width: 200, height: 150 }}>
                                {hit._source.thumbnail && (
                                    <img src={hit._source.thumbnail} alt={hit._source.title} 
                                        style={{width:'100%', height:'150px', objectFit:'cover'}} />
                                )}
                                <CardContent>
                                    <Typography variant="body1">{hit._source.title}</Typography>
                                    <Typography color="text.secondary" variant="body2">{hit._source.category}</Typography>
                                </CardContent>
                            </Card>
                        </Link>
                    </Grid>
                ))}
                {results.length === 0 && (
                    <Grid item xs={12}>
                        <Typography>No results found for "{query}"</Typography>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default Search;
