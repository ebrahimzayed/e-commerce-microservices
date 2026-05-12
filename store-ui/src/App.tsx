import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from './pages/Home/Home'
import Product from './pages/Product/Product'
import Cart from './pages/Cart/Cart'
import Search from './pages/Search/Search'
import Profile from './pages/Profile/Profile'
import Layout from './components/layout/Layout'
const App = (props: any) => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile" element={<Profile />} />
            </Routes>
        </Layout>
    )
}
export default App
