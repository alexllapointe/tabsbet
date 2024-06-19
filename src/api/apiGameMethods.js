import axios from 'axios';

// Fetch game details
export const getGameDetails = async () => {
    try {
        const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
        return response.data;
    } catch (error) {
        console.error('Error fetching game details:', error);
        throw error;
    }
};

// Fetch team roster and filter active players
export const getTeamRoster = async (teamId) => {
    try {
        const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`);
        console.log(`Roster data for team ${teamId}:`, response.data.athletes);
        if (response.data.athletes.length > 0) {
            console.log('Sample player data:', response.data.athletes[0]);
        }
        const players = response.data.athletes.filter(player => player.status.type === 'active');
        console.log(`Active players for team ${teamId}:`, players);
        return players;
    } catch (error) {
        console.error(`Error fetching roster for team ${teamId}:`, error);
        throw error;
    }
};

// Fetch player info (fullName and position)
const fetchPlayerInfo = async (playerId, year) => {
    try {
        const response = await axios.get(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${year}/athletes/${playerId}`);
        const playerInfo = response.data;
        return {
            fullName: playerInfo.displayName,
            position: playerInfo.position.abbreviation,
        };
    } catch (error) {
        console.error(`Error fetching info for player ${playerId}:`, error);
        throw error;
    }
};

// Fetch player photo URL
const fetchPlayerPhoto = (playerId) => {
    return `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`;
};

// Combine player data
export const getActivePlayersData = async (teamId, year) => {
    try {
        const activePlayers = await getTeamRoster(teamId);
        console.log(`Active players for team ${teamId}:`, activePlayers);
        const playerDataPromises = activePlayers.map(async (player) => {
            const playerInfo = await fetchPlayerInfo(player.id, year);
            const playerPhoto = fetchPlayerPhoto(player.id);
            return {
                id: player.id,
                fullName: playerInfo.fullName,
                position: playerInfo.position,
                photo: playerPhoto,
            };
        });
        const playerData = await Promise.all(playerDataPromises);
        console.log(`Player data for team ${teamId}:`, playerData);
        return playerData;
    } catch (error) {
        console.error(`Error fetching active player data for team ${teamId}:`, error);
        throw error;
    }
};
