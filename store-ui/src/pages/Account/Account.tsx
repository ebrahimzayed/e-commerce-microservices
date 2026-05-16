import * as React from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';

const Account = () => {
    const [user, setUser] = React.useState({ name: '', email: '', mobile: '' } as any);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        axios.get('/api/users/users/2')
            .then(res => setUser(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        try {
            await axios.put(`/api/users/users/2?name=${user.name}&email=${user.email}&mobile=${user.mobile}`);
            setSuccess(true);
            setError(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(true);
            setSuccess(false);
        }
    };

    return (
        <Box sx={{ p: 2, maxWidth: 500, margin: '0 auto' }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 80, height: 80, mb: 1, bgcolor: 'primary.main' }}>
                        <PersonIcon sx={{ fontSize: 50 }} />
                    </Avatar>
                    <Typography variant="h5">My Account</Typography>
                </Box>
                {success && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully!</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>Something went wrong. Please try again.</Alert>}
                <TextField fullWidth label="Name" value={user.name || ''}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    sx={{ mb: 2 }} />
                <TextField fullWidth label="Email" value={user.email || ''}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    sx={{ mb: 2 }} />
                <TextField fullWidth label="Mobile" value={user.mobile || ''}
                    onChange={(e) => setUser({ ...user, mobile: e.target.value })}
                    sx={{ mb: 2 }} />
                <Button fullWidth variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                    Save Changes
                </Button>
            </Paper>
        </Box>
    );
};

export default Account;
