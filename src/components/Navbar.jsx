import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { gatherAllTeamsRoster } from '../api/apiPlayerMethods';

const Navbar = ({ onPlayerNameChange }) => {
    const [playerName, setPlayerName] = useState('');
    const [allPlayers, setAllPlayers] = useState([]);
    const [suggestedText, setSuggestedText] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch all player names when the component mounts
        const fetchAllPlayers = async () => {
            const rosters = await gatherAllTeamsRoster();
            setAllPlayers(rosters.map(player => player.athlete_name));
        };

        fetchAllPlayers();
    }, []);

    const handleInputChange = (event) => {
        const value = event.target.value;
        setPlayerName(value);

        if (value.trim()) {
            const suggestion = allPlayers.find(player =>
                player.toLowerCase().startsWith(value.toLowerCase())
            );
            if (suggestion) {
                setSuggestedText(suggestion.slice(value.length));
            } else {
                setSuggestedText('');
            }
        } else {
            setSuggestedText('');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && playerName.trim()) {
            onPlayerNameChange(playerName.trim());
            setSuggestedText('');
        }
    };

    const handleClearInput = () => {
        setPlayerName('');
        setSuggestedText('');
        onPlayerNameChange('');
    };

    const handleBlur = () => {
        if (suggestedText) {
            setPlayerName(playerName + suggestedText);
            onPlayerNameChange(playerName + suggestedText);
        }
        setSuggestedText('');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        navigate('/login');
    };

    return (
        <nav className="font-roboto bg-webblue border w-full flex items-center py-2 px-4 z-10">
            <h1
                className="text-white font-bold text-2xl mr-4 cursor-pointer"
                onClick={() => navigate('/')}>
                tabs.bet
            </h1>
            <div className="relative flex items-center w-auto ml-5 flex-1">
                <input
                    type="search"
                    value={playerName}
                    className="bg-grayscale border-2 placeholder:italic placeholder:text-slate-400 border-gray-200 text-black text-sm rounded-lg focus:border-webblue focus:outline-none block w-48 sm:w-64 pl-10 p-2.5"
                    placeholder="Player Search"
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onBlur={handleBlur}
                />
                {playerName && (
                    <button
                        onClick={handleClearInput}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        <CloseIcon />
                    </button>
                )}
                <SearchIcon className="w-5 h-5 absolute left-3 text-gray-500" />
                <div className="absolute left-10 flex items-center pointer-events-none">
                    <span className='text-sm text-transparent pl-1'>{playerName}</span>
                    <span className='text-sm text-gray-200'>{suggestedText}</span>
                </div>
            </div>
            <div className="hidden md:flex space-x-4 text-white ml-auto">
                {/* <a
                    className="hover:text-gray-500 cursor-pointer"
                    onClick={handleLogout}
                >
                    Logout
                </a> */}
            </div>
            <div></div>
            <button
                className="md:hidden ml-4 text-white z-20"
                onClick={toggleMobileMenu}
            >
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-webblue text-white flex flex-col md:hidden z-20">
                    <div className="flex items-center justify-between w-full p-4">
                        <h1 className="text-white font-bold text-2xl z-10">tabs.bet</h1>
                        <button
                            className="text-white z-20"
                            onClick={toggleMobileMenu}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="flex flex-col items-start px-4">
                        <hr className="border-gray-500 w-full my-2" />
                        {/* <a
                            className="text-lg py-2 w-full text-left hover:bg-gray-500 hover:rounded-lg"
                            onClick={handleLogout}
                        >
                            Logout
                        </a> */}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
