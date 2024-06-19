import axios from 'axios';

const base_url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{}/roster';
let teamNames = {};

const fetchDataFromUrl = async (url) => {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL');
    }

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching data from URL');
    }
};

export const getTeamName = async (teamId) => {
    if (!teamNames[teamId]) {
        const teamUrl = base_url.replace('{}', teamId);
        const response = await axios.get(teamUrl);
        teamNames[teamId] = response.data.team.displayName;
    }
    return teamNames[teamId];
};

export const rosterSearch = async (teamNumber) => {
    const teamUrl = base_url.replace('{}', teamNumber);
    const response = await axios.get(teamUrl);
    const teamData = response.data;

    let outputData = [];
    if (teamData.athletes) {
        const teamName = await getTeamName(teamNumber);
        outputData = teamData.athletes.map(athlete => ({
            athlete_id: athlete.id,
            athlete_name: athlete.fullName,
            team_id: teamNumber,
            athlete_team: teamName,
        }));
    }
    return outputData;
};

export const gatherAllTeamsRoster = async () => {
    let allTeamsData = [];
    for (let teamId = 1; teamId <= 30; teamId++) {
        const teamRoster = await rosterSearch(teamId);
        allTeamsData = allTeamsData.concat(teamRoster);
    }
    return allTeamsData;
};

export const getPlayerId = async (playerName) => {
    const allRosters = await gatherAllTeamsRoster();
    const athlete = allRosters.find(athlete => athlete.athlete_name.toLowerCase() === playerName.toLowerCase());
    return athlete ? athlete.athlete_id : null;
};

export const searchOffensivePlayerStat = async (playerName, statType, year) => {
    const playerId = await getPlayerId(playerName);
    const statsUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${year}/types/2/athletes/${playerId}/statistics`;
    const response = await axios.get(statsUrl);
    const statsData = response.data.splits;

    const offensiveStats = statsData.categories[2].stats;
    const stat = offensiveStats.find(stat => stat.shortDisplayName === statType);
    return stat ? `${stat.displayValue}` : `No offense stats found for ${playerName} for category ${statType}`;
};

export const searchDefensivePlayerStat = async (playerName, statType, year) => {
    const playerId = await getPlayerId(playerName);
    const statsUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${year}/types/2/athletes/${playerId}/statistics`;
    const response = await axios.get(statsUrl);
    const statsData = response.data.splits;

    const offensiveStats = statsData.categories[0].stats;
    const stat = offensiveStats.find(stat => stat.shortDisplayName === statType);
    return stat ? `${stat.displayValue}` : `No defensive stats found for ${playerName} for category ${statType}`;
};

export const searchPlayerInfo = async (playerName, year) => {
    const playerId = await getPlayerId(playerName);

    const infoUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${year}/athletes/${playerId}`;
    const response = await axios.get(infoUrl);
    const infoData = response.data.position;
    const teamRef = response.data.team?.$ref;

    if (!teamRef) {
        throw new Error('Team reference not found');
    }

    const teamData = await fetchDataFromUrl(teamRef);
    const playerPosition = infoData.abbreviation;

    return {
        playerPosition,
        teamData
    };
};

export const getRecentGameStats = async (playerName, numOfGamesOption, statType) => {
    try {
        console.log(`getRecentGameStats called with ${statType}`);
        const playerId = await getPlayerId(playerName);
        if (!playerId) {
            console.error('Player not found');
            return null;
        }

        const numOfGames = parseInt(numOfGamesOption.slice(1));
        const baseUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2024/athletes/${playerId}/eventlog?lang=en&region=us`;

        const initialResponse = await axios.get(baseUrl);
        const { pageCount, pageSize } = initialResponse.data.events;

        let recentGames = [];
        let currentPage = pageCount;

        while (recentGames.length < numOfGames && currentPage > 0) {
            const pageUrl = `${baseUrl}&page=${currentPage}`;
            const pageResponse = await axios.get(pageUrl);
            const pageEvents = pageResponse.data.events.items;

            recentGames = recentGames.concat(pageEvents.reverse());
            currentPage--;

            if (recentGames.length >= numOfGames) {
                recentGames = recentGames.slice(0, numOfGames);
                break;
            }
        }

        if (recentGames.length < numOfGames) {
            console.warn(`Only ${recentGames.length} games found for player ${playerName}`);
        }

        const gameStats = await Promise.all(recentGames.map(async (game) => {
            if (game.played) {
                const statsResponse = await axios.get(game.statistics.$ref.replace('http:', 'https:'));
                const statsData = statsResponse.data.splits;

                const offensiveStats = statsData.categories[2].stats;
                const defensiveStats = statsData.categories[0].stats;
                const generalStats = statsData.categories[1].stats;

                let desiredStat;

                switch (statType) {
                    case 'PTS':
                        desiredStat = offensiveStats.find(stat => stat.shortDisplayName === 'PTS')?.displayValue;
                        break;
                    case 'REB':
                        desiredStat = generalStats.find(stat => stat.shortDisplayName === 'REB')?.displayValue;
                        break;
                    case 'STL':
                        desiredStat = defensiveStats.find(stat => stat.shortDisplayName === 'STL')?.displayValue;
                        break;
                    case 'BLK':
                        desiredStat = defensiveStats.find(stat => stat.shortDisplayName === 'BLK')?.displayValue;
                        break;
                    case 'AST':
                        desiredStat = offensiveStats.find(stat => stat.shortDisplayName === 'AST')?.displayValue;
                        break;
                    case '3PM':
                        desiredStat = offensiveStats.find(stat => stat.shortDisplayName === '3PM')?.displayValue;
                        break;
                    case 'PTS+REB':
                        desiredStat = parseInt(offensiveStats.find(stat => stat.shortDisplayName === 'PTS')?.displayValue || 0) +
                            parseInt(generalStats.find(stat => stat.shortDisplayName === 'REB')?.displayValue || 0);
                        break;
                    case 'REB+AST':
                        desiredStat = parseInt(generalStats.find(stat => stat.shortDisplayName === 'REB')?.displayValue || 0) +
                            parseInt(offensiveStats.find(stat => stat.shortDisplayName === 'AST')?.displayValue || 0);
                        break;
                    case 'PTS+AST':
                        desiredStat = parseInt(offensiveStats.find(stat => stat.shortDisplayName === 'PTS')?.displayValue || 0) +
                            parseInt(offensiveStats.find(stat => stat.shortDisplayName === 'AST')?.displayValue || 0);
                        break;
                    case 'PTS+AST+REB':
                        desiredStat = parseInt(offensiveStats.find(stat => stat.shortDisplayName === 'PTS')?.displayValue || 0) +
                            parseInt(offensiveStats.find(stat => stat.shortDisplayName === 'AST')?.displayValue || 0) +
                            parseInt(generalStats.find(stat => stat.shortDisplayName === 'REB')?.displayValue || 0);
                        break;
                    default:
                        desiredStat = null;
                }

                const eventResponse = await axios.get(game.event.$ref.replace('http:', 'https:'));
                const shortName = eventResponse.data.shortName;
                const date = eventResponse.data.date;
                const formattedDate = new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' });

                return {
                    shortName,
                    stat: desiredStat,
                    date: formattedDate
                };
            }
        }));

        return gameStats.filter(game => game); // Filter out undefined values
    } catch (error) {
        console.error('Error fetching game stats:', error.message);
        return null;
    }
};

const run = async () => {
    getPlayerId('Luka Doncic')
        .then(data => {
            console.log('Scraped Data:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

run();
