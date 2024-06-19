import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getGameDetails, getActivePlayersData } from '../api/apiGameMethods';
import { getRecentGameStats } from '../api/apiPlayerMethods';
import { getOddsEvents, getAllMarketOdds } from '../api/apiOddsMethods';
import Spinner from '../utilities/Spinner';
import ErrorPopup from '../utilities/ErrorPopup';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
    ChartDataLabels
);

const PlayerResearch = () => {
    const [gameDetails, setGameDetails] = useState(null);
    const [teamRosters, setTeamRosters] = useState({});
    const [isCardVisible, setIsCardVisible] = useState(false);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [expandedPlayer, setExpandedPlayer] = useState(null);
    const [selectedProp, setSelectedProp] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [playerGameStats, setPlayerGameStats] = useState([]);
    const [playerOddsMap, setPlayerOddsMap] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [openErrorModal, setOpenErrorModal] = useState(false);
    const [adjustedLine, setAdjustedLine] = useState(0);

    const memoizedPlayerData = useMemo(() => {
        return Object.values(teamRosters).flat();
    }, [teamRosters]);

    const propMap = {
        'PTS': 'player_points',
        'AST': 'player_assists',
        '3PM': 'player_threes',
        'REB': 'player_rebounds',
        'BLK': 'player_blocks',
        'STL': 'player_steals',
        'PTS+REB': 'player_points_rebounds',
        'REB+AST': 'player_rebounds_assists',
        'PTS+AST+REB': 'player_points_rebounds_assists',
        'PTS+AST': 'player_points_assists'
    };

    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                const data = await getGameDetails();
                console.log('Game Details:', data);
                const oddsEvents = await getOddsEvents();
                console.log('Odds Events:', oddsEvents);

                if (data && data.events && data.events.length > 0) {
                    const upcomingGame = data.events.find(event => event.status.type.completed === false);
                    if (upcomingGame) {
                        const oddsEvent = oddsEvents.find(event =>
                            event.home_team === upcomingGame.competitions[0].competitors[0].team.displayName &&
                            event.away_team === upcomingGame.competitions[0].competitors[1].team.displayName
                        );

                        if (oddsEvent) {
                            setGameDetails({ ...upcomingGame, oddsEventId: oddsEvent.id });

                            // Fetch rosters for both teams
                            const homeTeamId = upcomingGame.competitions[0].competitors[0].team.id;
                            const awayTeamId = upcomingGame.competitions[0].competitors[1].team.id;

                            const year = new Date().getFullYear();
                            const [homeRoster, awayRoster] = await Promise.all([
                                getActivePlayersData(homeTeamId, year),
                                getActivePlayersData(awayTeamId, year)
                            ]);

                            console.log('Home Roster:', homeRoster);
                            console.log('Away Roster:', awayRoster);

                            setTeamRosters({
                                [homeTeamId]: homeRoster,
                                [awayTeamId]: awayRoster
                            });

                            // Fetch all market odds for the game
                            const cachedMarketOdds = localStorage.getItem(`marketOdds_${oddsEvent.id}`);
                            if (cachedMarketOdds) {
                                setPlayerOddsMap(JSON.parse(cachedMarketOdds));
                                console.log('Loaded Market Odds from Cache:', JSON.parse(cachedMarketOdds));
                            } else {
                                const marketOdds = await getAllMarketOdds(oddsEvent.id);
                                console.log('Market Odds:', marketOdds);
                                setPlayerOddsMap(marketOdds);
                                localStorage.setItem(`marketOdds_${oddsEvent.id}`, JSON.stringify(marketOdds));
                            }
                        } else {
                            setGameDetails('no-upcoming-games');
                        }
                    } else {
                        setGameDetails('no-upcoming-games');
                    }
                } else {
                    setGameDetails('no-upcoming-games');
                }
            } catch (error) {
                console.error('Error fetching game or team details:', error);
                setError('Error fetching game or team details.');
                setOpenErrorModal(true);
                setTimeout(() => {
                    setError('');
                    setOpenErrorModal(false);
                }, 2500);
            }
        };

        fetchGameDetails();
    }, []);

    useEffect(() => {
        const fetchPlayerGameStats = async () => {
            if (expandedPlayer && selectedProp && selectedOption) {
                setIsLoading(true);
                try {
                    const stats = await getRecentGameStats(expandedPlayer.fullName, selectedOption, selectedProp);
                    console.log('Player Game Stats:', stats);
                    setPlayerGameStats(stats);

                    const propKey = propMap[selectedProp];
                    const playerLine = playerOddsMap[propKey]?.find(odds => odds.description === expandedPlayer.fullName)?.point;
                    setAdjustedLine(playerLine);

                    setIsLoading(false);
                } catch (error) {
                    console.error('Error fetching player game stats:', error);
                    setError('Error fetching player game stats.');
                    setOpenErrorModal(true);
                    setTimeout(() => {
                        setError('');
                        setOpenErrorModal(false);
                    }, 2500);
                }
            }
        };

        fetchPlayerGameStats();
    }, [expandedPlayer, selectedProp, selectedOption]);

    const calculateStats = (games, line, selectedOption) => {
        const splits = {
            'L5': games.slice(0, 5),
            'L10': games.slice(0, 10),
            'L15': games.slice(0, 15),
            'L20': games.slice(0, 20),
        };

        if (!selectedOption || !splits[selectedOption] || splits[selectedOption].length === 0) {
            return { hitRate: 0, average: 0, hitsCount: 0 };
        }

        const selectedGames = splits[selectedOption];
        const hitsCount = selectedGames.filter(game => game.stat >= line).length;
        const hitRate = (hitsCount / selectedGames.length) * 100;
        const average = selectedGames.reduce((sum, game) => sum + parseFloat(game.stat), 0) / selectedGames.length;

        return { hitRate, average, hitsCount };
    };

    const handleCardToggle = () => {
        setIsCardVisible(!isCardVisible);
    };

    const handleTeamToggle = (teamId) => {
        setExpandedTeam(expandedTeam === teamId ? null : teamId);
    };

    const handlePlayerToggle = (player) => {
        if (!selectedProp || !selectedOption) {
            setError('Please select a game and prop category.');
            setOpenErrorModal(true);
            setTimeout(() => {
                setError('');
                setOpenErrorModal(false);
            }, 2500);
            return;
        }
        setExpandedPlayer(expandedPlayer?.id === player.id ? null : player);

        // Move the selected player to the top of the list
        if (expandedTeam !== null) {
            setTeamRosters((prevRosters) => {
                const teamId = expandedTeam;
                const updatedTeamRoster = [...prevRosters[teamId]];

                // Find the index of the selected player
                const playerIndex = updatedTeamRoster.findIndex(p => p.id === player.id);

                // If player is found, move them to the top of the list
                if (playerIndex !== -1) {
                    const [selectedPlayer] = updatedTeamRoster.splice(playerIndex, 1);
                    updatedTeamRoster.unshift(selectedPlayer);
                }

                return {
                    ...prevRosters,
                    [teamId]: updatedTeamRoster,
                };
            });
        }
    };

    const handlePropClick = async (prop) => {
        setSelectedProp(prop);
    };

    const handleOptionClick = (option) => {
        setSelectedOption(option);
    };

    const handleSliderChange = (value) => {
        setAdjustedLine(value);
    };

    const filterPlayersWithOdds = (players) => {
        if (!selectedProp) {
            return players;
        }
        const propKey = propMap[selectedProp];
        return players.filter(player => {
            const oddsData = playerOddsMap[propKey]?.find(odds => odds.description === player.fullName);
            return oddsData !== undefined;
        });
    };

    const chartData = {
        labels: playerGameStats.map(game => `${game.shortName} (${game.date})`),
        datasets: [{
            label: selectedProp,
            data: playerGameStats.map(game => parseFloat(game.stat)),
            backgroundColor: playerGameStats.map(game => parseFloat(game.stat) >= adjustedLine ? '#37d98f' : '#ec3b47'),
            barPercentage: 0.4,
            categoryPercentage: 0.8,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
            },
            x: {
                ticks: {
                    callback: function (value, index, values) {
                        const label = this.getLabelForValue(value);
                        const [shortName, date] = label.split(' (');
                        const dateFormatted = date.slice(0, -1);
                        return `${shortName}\n${dateFormatted}`;
                    },
                    font: {
                        size: 10
                    }
                }
            }
        },
        plugins: {
            datalabels: {
                anchor: 'center',
                align: 'center',
                color: 'white',
                formatter: function (value) {
                    return value;
                }
            },
            annotation: {
                annotations: adjustedLine ? {
                    line1: {
                        type: 'line',
                        yMin: adjustedLine,
                        yMax: adjustedLine,
                        borderColor: '#616163',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            enabled: true,
                            content: 'Betting Line',
                            position: 'center'
                        }
                    }
                } : {}
            }
        }
    };

    const stats = selectedOption ? calculateStats(playerGameStats || [], adjustedLine, selectedOption) : null;

    const getAvailableHeight = (element) => {
        const rect = element.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        return viewHeight - rect.top - 20; // Subtract some margin
    };

    useEffect(() => {
        const handleResize = () => {
            if (expandedPlayer) {
                const element = document.getElementById(`player-card-${expandedPlayer.id}`);
                if (element) {
                    const availableHeight = getAvailableHeight(element);
                    element.style.maxHeight = `${availableHeight}px`;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [expandedPlayer]);

    const cardRef = useRef(null);

    useEffect(() => {
        if (expandedPlayer) {
            const element = cardRef.current;
            if (element) {
                element.style.maxHeight = `${element.scrollHeight}px`;
            }
        }
    }, [expandedPlayer, playerGameStats, selectedProp, selectedOption]);

    return (
        <div className="min-h-screen bg-webgray flex flex-col items-center">
            {error && (
                <ErrorPopup
                    open={openErrorModal}
                    onClose={() => setOpenErrorModal(false)}
                    message="Please select a game and prop category."
                />
            )}
            <div className="border border-gray-300 bg-webgray md:p-4 w-full flex flex-col md:flex-row md:justify-center items-center md:space-x-4">
                <div className="w-full md:w-auto text-center pt-2 md:text-left">
                    <span className="text-black text-lg font-semibold block mb-2 md:mb-1">Props</span>
                    <div className="flex flex-nowrap overflow-x-auto scrollbar-hide rounded-lg">
                        {['PTS', 'AST', '3PM', 'REB', 'BLK', 'STL', 'PTS+REB', 'REB+AST', 'PTS+AST+REB', 'PTS+AST'].map((prop) => (
                            <button
                                key={prop}
                                className={`border ${selectedProp === prop ? 'bg-webblue text-white' : 'bg-white text-gray-700'
                                    } font-bold py-2 px-4 hover:bg-webblue hover:text-white focus:outline-none focus:ring-2 focus:ring-webblue focus:ring-opacity-50`}
                                onClick={() => handlePropClick(prop)}
                            >
                                {prop.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-full md:w-auto text-center pt-2 md:text-left">
                    <span className="text-black text-lg font-semibold block mb-2 md:mb-1">Games</span>
                    <div className="flex flex-nowrap overflow-x-auto scrollbar-hide rounded-lg">
                        {['2024', 'L5', 'L10', 'L15', 'L20'].map((option) => (
                            <button
                                key={option}
                                className={`border border-gray-200 ${selectedOption === option ? 'bg-webblue text-white' : 'bg-white text-gray-700'
                                    } font-bold py-2 px-4 hover:bg-webblue hover:text-white focus:outline-none focus:ring-2 focus:ring-webblue focus:ring-opacity-50`}
                                onClick={() => handleOptionClick(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {gameDetails === 'no-upcoming-games' ? (
                <div className="flex flex-col items-center mt-8">
                    <p className="md:text-lg md:mt-4 pl-2">No currently available games, please check back later!</p>
                </div>
            ) : gameDetails ? (
                <div className="bg-white shadow-lg rounded-lg p-4 m-4 w-full md:w-3/4 lg:w-1/2">
                    <div onClick={handleCardToggle} className="cursor-pointer flex justify-between items-center transition duration-300">
                        <div className="flex items-center">
                            <img src={gameDetails.competitions[0].competitors[0].team.logo} alt="Home Team Logo" className="w-12 h-12" />
                            <img src={gameDetails.competitions[0].competitors[1].team.logo} alt="Away Team Logo" className="w-12 h-12 ml-2" />
                            <span className="text-xl font-semibold ml-4">{gameDetails.name}</span>
                            <span className="text-md ml-4">{new Date(gameDetails.date).toLocaleString()}</span>
                        </div>
                        <span className={`text-lg transition-transform transform duration-300 ${isCardVisible ? 'rotate-180 text-webblue' : 'rotate-0'}`}>
                            <FaChevronDown />
                        </span>
                    </div>
                    <div className={`mt-4 transition-all duration-300 ease-in-out overflow-hidden ${isCardVisible ? 'max-h-screen' : 'max-h-0'}`}>
                        {gameDetails.competitions[0].competitors.map((competitor) => (
                            <div
                                key={competitor.team.id}
                                className="border shadow-lg rounded-lg p-4 m-2 transition-all duration-300"
                            >
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => handleTeamToggle(competitor.team.id)}>
                                    <h4 className="text-md font-semibold mb-2">{competitor.team.displayName}</h4>
                                    <span className={`text-lg transition-transform transform duration-300 ${expandedTeam === competitor.team.id ? 'rotate-180 text-webblue' : 'rotate-0'}`}>
                                        <FaChevronDown />
                                    </span>
                                </div>
                                <div className="transition-all duration-300 ease-in-out overflow-hidden" style={{ maxHeight: expandedTeam === competitor.team.id ? '1000px' : '0px' }}>
                                    {filterPlayersWithOdds(teamRosters[competitor.team.id] || []).map((player) => (
                                        <div key={player.id} className="mb-2 p-2 bg-gray-100 rounded-lg cursor-pointer">
                                            <div className="flex justify-between items-center" onClick={() => handlePlayerToggle(player)}>
                                                <div className="flex items-center">
                                                    <img src={competitor.team.logo} alt={competitor.team.displayName} className="w-8 h-8 mr-4 rounded-full border" />
                                                    <img src={player.photo} alt={player.fullName} className="w-12 h-12 mr-4 rounded-full border object-cover" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{player.fullName}</p>
                                                        <p className="text-sm text-gray-600">{player.position}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-lg transition-transform transform duration-300 ${expandedPlayer?.id === player.id ? 'rotate-180 text-webblue' : 'rotate-0'}`}>
                                                    <FaChevronDown />
                                                </span>
                                            </div>
                                            {expandedPlayer?.id === player.id && selectedProp && selectedOption && (
                                                <div className="mt-2 bg-gray-100 shadow-lg p-6 rounded-lg overflow-auto" id={`player-card-${player.id}`} ref={cardRef}>
                                                    {isLoading ? (
                                                        <Spinner />
                                                    ) : (
                                                        <>
                                                            <div className="mb-2 flex items-center space-x-2">
                                                                <p className="text-xl font-semibold">{playerOddsMap[propMap[selectedProp]]?.find(odds => odds.description === player.fullName)?.point} {selectedProp}</p>
                                                                <p className='text-green-500 text-xl'>{`O ${playerOddsMap[propMap[selectedProp]]?.find(odds => odds.description === player.fullName && odds.name === 'Over')?.price}`}</p>
                                                                <p className='text-red-500 text-xl'>{`U ${playerOddsMap[propMap[selectedProp]]?.find(odds => odds.description === player.fullName && odds.name === 'Under')?.price}`}</p>
                                                            </div>
                                                            <div className="relative w-full h-64">
                                                                <Bar data={chartData} options={chartOptions} />
                                                            </div>
                                                            <p className='text-gray-700'>Alt Lines</p>
                                                            <Slider
                                                                min={Math.min(...playerGameStats.map(game => parseFloat(game.stat))) - 2}
                                                                max={Math.max(...playerGameStats.map(game => parseFloat(game.stat))) + 2}
                                                                step={0.5}
                                                                value={adjustedLine}
                                                                onChange={handleSliderChange}
                                                            />
                                                            {selectedOption && stats && (
                                                                <div className="flex border-t border-gray-200 pt-4">
                                                                    <div className="flex flex-col items-center w-1/3 border-r border-gray-200">
                                                                        <p className="text-gray-700 font-semibold">Split</p>
                                                                        <p className="text-gray-700">{selectedOption}</p>
                                                                    </div>
                                                                    <div className="flex flex-col items-center w-1/3 border-r border-gray-200">
                                                                        <p className="text-gray-700 font-semibold">Hit Rate</p>
                                                                        <p className={`${stats.hitRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>{stats.hitRate.toFixed(1)}%</p>
                                                                        <p className="text-gray-700 text-sm">{stats.hitsCount}/{selectedOption.slice(1)}</p>
                                                                    </div>
                                                                    <div className="flex flex-col items-center w-1/3">
                                                                        <p className="text-gray-700 font-semibold">Avg</p>
                                                                        <p className="text-gray-700">{stats.average.toFixed(1)}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center mt-8">
                    <Spinner />
                    <p className="text-lg">Fetching game details...</p>
                </div>
            )}
        </div>
    );
};

export default PlayerResearch;
