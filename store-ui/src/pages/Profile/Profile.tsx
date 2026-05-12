import * as React from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

const Profile = () => {
    const [users, setUsers] = React.useState([]);

    React.useEffect(() => {
        axios.get('/api/users/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Users</Typography>
            <Grid container spacing={2}>
                {users.map((user: any) => (
                    <Grid item key={user.id} xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Grid container direction="column" alignItems="center">
                                <Avatar sx={{ width: 64, height: 64, mb: 1, bgcolor: 'primary.main' }}>
                                    <PersonIcon />
                                </Avatar>
                                <Typography variant="h6">{user.name}</Typography>
                            </Grid>
                            <Divider sx={{ my: 1 }} />
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Email" secondary={user.email} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Mobile" secondary={user.mobile} />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Profile;
