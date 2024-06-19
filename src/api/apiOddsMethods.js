import axios from 'axios';

const ODDS_API_KEY = '66ae8d7f564efd05d93ac73ee1da083b';

export const getOddsEvents = async () => {
    try {
        const response = await axios.get(`https://api.the-odds-api.com/v4/sports/basketball_nba/events`, {
            params: {
                apiKey: ODDS_API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching odds events:', error.message);
        return [];
    }
};

export const getPlayerOdds = async (eventId, market) => {
    try {
        const response = await axios.get(`https://api.the-odds-api.com/v4/sports/basketball_nba/events/${eventId}/odds`, {
            params: {
                apiKey: ODDS_API_KEY,
                regions: 'us',
                markets: market,
                dateFormat: 'iso',
                oddsFormat: 'american',
                bookmakers: 'draftkings'
            }
        });

        if (response.data && response.data.bookmakers && response.data.bookmakers.length > 0) {
            const draftKings = response.data.bookmakers.find(bookmaker => bookmaker.key === 'draftkings');
            if (draftKings) {
                return draftKings.markets[0].outcomes;
            }
        }
        return [];
    } catch (error) {
        console.error('Error fetching player odds:', error.message);
        return [];
    }
};


export const getAllMarketOdds = async (eventId) => {
    const markets = [
        'player_points',
        'player_rebounds',
        'player_assists',
        'player_threes',
        'player_blocks',
        'player_steals',
        'player_points_rebounds',
        'player_rebounds_assists',
        'player_points_rebounds_assists',
        'player_points_assists'
    ].join(',');

    try {
        const response = await axios.get(`https://api.the-odds-api.com/v4/sports/basketball_nba/events/${eventId}/odds`, {
            params: {
                apiKey: ODDS_API_KEY,
                regions: 'us',
                markets,
                dateFormat: 'iso',
                oddsFormat: 'american',
                bookmakers: 'draftkings'
            }
        });

        if (response.data && response.data.bookmakers && response.data.bookmakers.length > 0) {
            const draftKings = response.data.bookmakers.find(bookmaker => bookmaker.key === 'draftkings');
            if (draftKings) {
                const marketOdds = {};
                draftKings.markets.forEach(market => {
                    marketOdds[market.key] = market.outcomes;
                });
                return marketOdds;
            }
        }
        return {};
    } catch (error) {
        console.error('Error fetching player odds:', error.message);
        return {};
    }
};
