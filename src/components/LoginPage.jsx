import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ErrorPopup from '../utilities/ErrorPopup';
import SuccessPopup from '../utilities/SuccessPopup';
import api from '../api/axiosConfig';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const loginUser = async () => {
        try {
            const params = new URLSearchParams();
            params.append('email', email);
            params.append('password', password);

            const response = await api.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.status === 200) {
                setPopupMessage('Welcome, ' + email);
                setEmail('');
                setPassword('');
                localStorage.setItem('userToken', response.data);

                login(); // Set the user as authenticated in the AuthContext

                setShowSuccessPopup(true);

                setTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/');
                }, 2000);
            }
        } catch (error) {
            console.error('Login failed', error);
            setPopupMessage('Login failed. Please try again.');
            setShowErrorPopup(true);
            setTimeout(() => {
                setShowErrorPopup(false);
            }, 3000);
        }
    };

    return (
        <section className="h-screen bg-webgray">
            <div className="container mx-auto py-5 h-full">
                <div className="flex justify-center items-center h-full">
                    <div className="w-full max-w-sm md:max-w-md">
                        <div className="bg-white text-gray-700 rounded-lg shadow-xl">
                            <div className="p-5 text-center">
                                <h1 className="text-4xl font-bold text-webblue mb-5">tabs.bet</h1>
                                <h2 className="text-2xl font-bold mb-7 uppercase">Sign in</h2>
                                <div className="w-full mb-4">
                                    <div className="relative h-10 w-full min-w-[200px]">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 text-sm text-black outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-blue-500 focus:border-t-transparent focus:outline-0"
                                            placeholder=" "
                                        />
                                        <label className="before:content-[' '] after:content-[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 after:pointer-events-none after:mt-[6.5px] after:ml-1 after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 peer-placeholder-shown:text-sm peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:text-blue-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-blue-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-blue-500">
                                            Email
                                        </label>
                                    </div>
                                </div>
                                <div className="w-full mb-5">
                                    <div className="relative h-10 w-full min-w-[200px]">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 text-sm text-black outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-blue-500 focus:border-t-transparent focus:outline-0"
                                            placeholder=" "
                                        />
                                        <label className="before:content-[' '] after:content-[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 after:pointer-events-none after:mt-[6.5px] after:ml-1 after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 peer-placeholder-shown:text-sm peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:text-blue-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-blue-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-blue-500">
                                            Password
                                        </label>
                                    </div>
                                </div>
                                <button
                                    className="w-full px-5 py-2 border border-gray-200 text-gray-700 font-bold py-2 rounded hover:bg-webblue hover:text-white transition duration-300"
                                    type="submit"
                                    onClick={loginUser}
                                >
                                    Login
                                </button>
                                <div className="mt-5">
                                    <p className="text-xs">
                                        Don't have an account?
                                        <a href="/register" className="text-gray-400 font-bold hover:text-webblue transition duration-300"> Sign Up</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showErrorPopup && (
                <ErrorPopup open={showErrorPopup} onClose={() => setShowErrorPopup(false)} message={popupMessage} />
            )}
            {showSuccessPopup && (
                <SuccessPopup open={showSuccessPopup} onClose={() => setShowSuccessPopup(false)} message={popupMessage} />
            )}
        </section>
    );
}

export default LoginPage;
