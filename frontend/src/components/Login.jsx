import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './auth/ForgotPasswordModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [isTtomLoginOpen, setIsTtomLoginOpen] = useState(false);
    const [ttomMobile, setTtomMobile] = useState('');
    const [ttomPin, setTtomPin] = useState('');
    const [ttomError, setTtomError] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2 expects username
            formData.append('password', password);

            // Assuming backend runs on localhost:8000
            await axios.post('http://localhost:8000/api/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                withCredentials: true // needed for cookies
            });

            // After successful login, fetch user info to know role
            const userResponse = await axios.get('http://localhost:8000/api/me', {
                withCredentials: true
            });

            const role = userResponse.data.role;
            if (role === 'super_admin') navigate('/dashboard/super-admin');
            else if (role === 'admin') navigate('/dashboard/admin');
            else if (role === 'leader') navigate('/dashboard/leader');
            else if (role === 'student') navigate('/dashboard/student');
            else navigate('/dashboard');

        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    const handleTtomLogin = async (e) => {
        e.preventDefault();
        setTtomError('');
        try {
            await axios.post('http://localhost:8000/api/ttom-login', {
                mobile_number: ttomMobile,
                pin: ttomPin
            }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            navigate('/dashboard/ttom/player');
        } catch (err) {
            setTtomError(err.response?.data?.detail || 'Login failed.');
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center font-sans relative bg-white px-4 sm:px-0"
        >
            <div className="bg-[#051220] border border-[#ffffff]/20 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative mt-10 sm:mt-16 z-10">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#0f2136] border border-[#ffffff]/30 rounded-full w-24 h-24 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <i className="pi pi-user text-5xl text-[#ffffff]/80"></i>
                    </div>
                </div>

                <h2 className="text-center text-white text-xl sm:text-2xl font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-6 sm:mt-8 mb-6 sm:mb-8 text-shadow-sm">MEMBER LOGIN</h2>

                {error && <div className="text-red-300 text-center mb-4 bg-red-900/30 p-3 rounded-lg border border-red-500/30 text-sm shadow-inner">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Username Field */}
                    <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                        <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                            <i className="pi pi-envelope text-[#b8c6d3] text-xl"></i>
                        </div>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                        <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                            <i className="pi pi-lock text-[#b8c6d3] text-xl"></i>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                        />
                    </div>

                    {/* Options */}
                    <div className="flex flex-col sm:flex-row justify-between items-center text-[#c2d1df] text-sm mt-2 px-1 gap-3 sm:gap-0">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                inputId="remember"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.checked || false)}
                                className="bg-[#051220]/50 border-[#ffffff]/30 rounded-sm"
                            />
                            <label htmlFor="remember" className="cursor-pointer hover:text-white transition-colors">Remember me?</label>
                        </div>
                        <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPasswordOpen(true); }} className="hover:text-white transition-colors">Forgot Password?</a>
                    </div>

                    {/* Login Button */}
                    <div className="pt-6 pb-2">
                        <Button
                            type="submit"
                            label="LOGIN"
                            onClick={handleLogin}
                            className="w-full bg-[#cca673] hover:bg-[#b08c5c] text-[#121c27] font-bold tracking-[0.15em] py-3.5 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(204,166,115,0.4)] hover:shadow-[0_0_20px_rgba(204,166,115,0.6)] border-none"
                        />
                        <div className="mt-4 w-full text-center">
                            <a href="#" className="font-bold text-[#b8c6d3] text-sm tracking-widest hover:text-white transition-colors py-2 block w-full" onClick={(e) => { e.preventDefault(); setIsTtomLoginOpen(true); }}>LOGIN AS A T-TOM-T USER</a>
                        </div>
                    </div>
                </form>
            </div>

            <div className="mt-6 sm:mt-8 text-[#d1e0ed] flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#051220] px-5 sm:px-7 py-2 sm:py-3 rounded-xl sm:rounded-full border border-[#ffffff]/10 shadow-lg text-center">
                <span className="text-sm opacity-80">Don't have an account?</span>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="font-bold text-[#cca673] hover:text-[#ebd0a7] tracking-wider transition-colors ml-0 sm:ml-1">REGISTER AS A STUDENT</a>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                visible={isForgotPasswordOpen}
                onHide={() => setIsForgotPasswordOpen(false)}
            />

            {/* TTOM Login Modal */}
            <Dialog visible={isTtomLoginOpen} onHide={() => setIsTtomLoginOpen(false)} showHeader={false} className="max-w-md w-full mx-4" contentClassName="p-0 rounded-2xl overflow-hidden bg-[#051220] border border-[#ffffff]/20 shadow-2xl relative">
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-[#ffffff]/10 pb-4">
                        <h2 className="text-white text-xl font-bold tracking-[0.1em] text-shadow-sm m-0">T-TOM-T LOGIN</h2>
                        <Button icon="pi pi-times" rounded text className="text-[#b8c6d3] w-8 h-8 p-0" onClick={() => setIsTtomLoginOpen(false)} />
                    </div>

                    {ttomError && <div className="text-red-300 text-center mb-4 bg-red-900/30 p-3 rounded-lg border border-red-500/30 text-sm shadow-inner">{ttomError}</div>}

                    <form onSubmit={handleTtomLogin} className="space-y-5">
                        <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                            <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                                <i className="pi pi-phone text-[#b8c6d3] text-xl"></i>
                            </div>
                            <input
                                type="text"
                                value={ttomMobile}
                                onChange={(e) => setTtomMobile(e.target.value)}
                                placeholder="Mobile Number"
                                className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                            />
                        </div>

                        <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                            <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                                <i className="pi pi-lock text-[#b8c6d3] text-xl"></i>
                            </div>
                            <input
                                type="password"
                                value={ttomPin}
                                onChange={(e) => setTtomPin(e.target.value)}
                                placeholder="4-Digit PIN"
                                maxLength={4}
                                className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                            />
                        </div>

                        <div className="pt-4 pb-2">
                            <Button
                                type="submit"
                                label="ENTER PLAYER"
                                className="w-full bg-[#cca673] hover:bg-[#b08c5c] text-[#121c27] font-bold tracking-[0.15em] py-3.5 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(204,166,115,0.4)] hover:shadow-[0_0_20px_rgba(204,166,115,0.6)] border-none"
                            />
                        </div>
                    </form>
                </div>
            </Dialog>
        </div>
    );
};

export default Login;
