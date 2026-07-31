const statboticsAPIUrl = "https://api.statbotics.io/v3"
const tbaUrl = "https://www.thebluealliance.com/api/v3"

const tbaKey = "8AkcVwTGB8OuJNQrxoM2tADm8pcQamwOADpKEzU5E6VpFnlafLCnJxJG0rfO9b4k"

let eventTable = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
let textBox = document.getElementById("Team Number");
let eventText = document.getElementById("Next Event")
let matchTable = document.getElementById("matchTable").getElementsByTagName("tbody")[0];
let teamData;
let teamNumberLoader = document.getElementById("teamNumberLoader");

const fetchTbaData = async (teamNumber) => {
    try {
        const response = await fetch(`${tbaUrl}/team/frc${teamNumber}`, {
            headers: {
                "X-TBA-Auth-Key": tbaKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
    }
};

const fetchStatboticsEPA = async (teamNumber) => {
    try {
        const response = await fetch(`${statboticsAPIUrl}/team_year/${teamNumber}/2025`)

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data.epa.total_points.mean;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
        return 0;
    }
};

const fetchStatboticsMatches = async (teamNumber, event) => {
    try {
        const response = await fetch(`${statboticsAPIUrl}/matches?team=${teamNumber}&&event=${event}`)

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
        return 0;
    }
};

const fetchNextEvent = async (teamNumber) => {
    try {
        let response = await fetch(`${tbaUrl}/team/frc${teamNumber}/events/simple`, {
            headers: {
                "X-TBA-Auth-Key": tbaKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        let data = await response.json();

        let nextEventKey = ""
        let date = new Date();
        let lastDate = ""
        let firstTrue = true
        let currentDate = date.getTime()
        let nextEventName = ""
        for(let i = data.length - 1; i >= 0; i--) {
            let eventDate = Date.parse(data[i].end_date)
            if(eventDate > currentDate && (eventDate < lastDate || firstTrue)) {
                nextEventKey = data[i].key
                lastDate = eventDate
                firstTrue = false
                nextEventName = data[i].name
            }
        }
        eventText.innerHTML = "Next Event: " + nextEventName;

        return nextEventKey;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
    }
}
const fetchEventTeams = async (eventKey) => {
    let data;
    let response;
    try {
        response = await fetch(`${tbaUrl}/event/${eventKey}/teams`, {
            headers: {
                "X-TBA-Auth-Key": tbaKey,
            },
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
    }
}
const fetchEventStatuses = async (eventKey) => {
    let data;
    let response;
    try {
        response = await fetch(`${tbaUrl}/event/${eventKey}/teams/statuses`, {
            headers: {
                "X-TBA-Auth-Key": tbaKey,
            },
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
    }
}
const fetchTeamMatches = async (teamNumber, eventKey) => {
    let data;
    let response;
    try {
        response = await fetch(`${tbaUrl}/team/frc${teamNumber}/event/${eventKey}/matches/simple`, {
            headers: {
                "X-TBA-Auth-Key": tbaKey,
            },
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch team data:", error);
    }
}

let eventDataOrder = {
    NAME: 0,
    NUMBER: 1,
    EPA: 2,
    RANK: 3,
    WIN_LOSS: 4,
    RP_AVG: 5,
    COOP_AVG: 6,
    MATCH_AVG: 7
}

function printEventData(teamData){
    eventTable.innerHTML = "";
    for (let team of teamData) {
        let row = eventTable.insertRow();
        row.insertCell(eventDataOrder.NAME).innerHTML = team.name;
        row.insertCell(eventDataOrder.NUMBER).innerHTML = team.number;
        row.insertCell(eventDataOrder.EPA).innerHTML = team.EPA; // Formatting EPA to 2 decimal places
        row.insertCell(eventDataOrder.RANK).innerHTML = team.rank;
        row.insertCell(eventDataOrder.WIN_LOSS).innerHTML = team.winLoss;
        row.insertCell(eventDataOrder.RP_AVG).innerHTML = team.rpAvg;
        row.insertCell(eventDataOrder.COOP_AVG).innerHTML = team.coopAvg;
        row.insertCell(eventDataOrder.MATCH_AVG).innerHTML = team.matchAvg;
    }
}

let matchDataOrder = {
    NUMBER: 0,
    MATCH_TIME: 1,
    RED_ALLIANCE: 2,
    BLUE_ALLIANCE: 3,
    WIN_PERCENTAGE: 4
}

function printMatchData(matchData){
    matchTable.innerHTML = "";
    for (let match of matchData) {
        let row = matchTable.insertRow();
        row.insertCell(matchDataOrder.NUMBER).innerHTML = match.number;
        row.insertCell(matchDataOrder.MATCH_TIME).innerHTML = formatTimestamp(match.time);
        row.insertCell(matchDataOrder.RED_ALLIANCE).innerHTML = match.redAlliance;
        row.insertCell(matchDataOrder.BLUE_ALLIANCE).innerHTML = match.blueAlliance;
        row.insertCell(matchDataOrder.WIN_PERCENTAGE).innerHTML= match.winPercentage
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);

    const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return formatter.format(date);
}

async function addTeamData(teamNumber)  {
    eventTable.innerHTML = "";
    matchTable.innerHTML = "";

    let event = await fetchNextEvent(teamNumber);
    let teams = await fetchEventTeams(event);
    let eventStatus = await fetchEventStatuses(event);
    let matches = await fetchTeamMatches(teamNumber, event)
    let statboticsMatches = await fetchStatboticsMatches(teamNumber, event)
    teamData = []
    let matchData = []

    let teamStatus;
    let statboticsData;
    for (let team of teams) {
        statboticsData = await fetchStatboticsEPA(team.team_number);
        teamStatus = eventStatus[team.key]
        let winLoss = (teamStatus?.qual?.ranking?.record?.wins || 0) + " / " + (teamStatus?.qual?.ranking?.record?.losses || 0)
        if (teamStatus?.qual?.ranking?.record?.ties !== 0) winLoss += " / " + (teamStatus?.qual?.ranking?.record?.ties || 0)

        teamData.push({
            name: team.nickname,
            number: team.team_number,
            EPA: statboticsData,
            rank: teamStatus?.qual?.ranking?.rank || "N/A",
            winLoss: winLoss,
            rpAvg: parseFloat(teamStatus?.qual?.ranking?.sort_orders[0] || 0)?.toFixed(2),
            coopAvg: parseFloat(teamStatus?.qual?.ranking?.sort_orders[1] || 0)?.toFixed(2),
            matchAvg: parseFloat(teamStatus?.qual?.ranking?.sort_orders[2] || 0)?.toFixed(2)
        });
    }

    for(let match of matches){
        let redAlliance = match.alliances.red.team_keys
        let blueAlliance = match.alliances.blue.team_keys
        let onRedAlliance = true
        redAlliance.forEach((team, index) => {
            if(team.slice(3) == teamNumber) {
                redAlliance[index] = `<u>${team.slice(3)}</u>`
                onRedAlliance = true
            }
            else redAlliance[index] = team.slice(3)
        })
        blueAlliance.forEach((team, index) => {
            if(team.slice(3) == teamNumber) {
                blueAlliance[index] = `<u>${team.slice(3)}</u>`
                onRedAlliance = false
            }
            else blueAlliance[index] = team.slice(3)
        })
        redAlliance = redAlliance.join("<br>")
        blueAlliance = blueAlliance.join("<br>")

        let matchNumber = match.match_number
        if(match.comp_level === "qm"){
            matchNumber = "Q" + matchNumber
        }else if(match.comp_level === "sf"){
            matchNumber = "SF" + match.set_number
        }else if(match.comp_level === 'f'){
            matchNumber = "F" + matchNumber
        }

        let statboticsMatch = statboticsMatches.find((element) => {
            return match.key === element.key;
        })

        matchData.push({
            number: matchNumber,
            time: match.predicted_time,
            redAlliance: redAlliance,
            blueAlliance: blueAlliance,
            winPercentage: ((onRedAlliance ? statboticsMatch.pred.red_win_prob : 1 - statboticsMatch.pred.red_win_prob) * 100).toFixed(1) + "%"
        })
    }
    matchData = matchData.sort((a, b) => {return a.time - b.time})

    eventTable.innerHTML = "";
    matchTable.innerHTML = "";

    teamData.forEach(team => {if(team.EPA === 0) team.EPA = "unknown"})

    printEventData(teamData);
    printMatchData(matchData);
}

let currentSort = { column: null, ascending: true }; // Tracks current sort state

function sortTeamData(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = !(column === 'EPA' || column === 'winLoss' || column === 'rpAvg'
            || column === 'coopAvg' || column === 'matchAvg' );
    }

    teamData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        if(column === 'winLoss'){
            valueA = valueA.split(" / ").map(Number)[0]
            valueB = valueB.split(" / ").map(Number)[0]
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
            return currentSort.ascending ? valueA - valueB : valueB - valueA;
        }else if(typeof valueA === "number" && typeof valueB === "string" ) {
            return currentSort.ascending ? 1 : -1
        }else if(typeof valueA === "string" && typeof valueB === "number" ) {
                return currentSort.ascending ? -1 : 1
        } else {
            valueA = valueA.toString().toLowerCase();
            valueB = valueB.toString().toLowerCase();
            return currentSort.ascending ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
    });

    printEventData(teamData);
}

let isLoading= false
teamNumberLoader.hidden = true
textBox.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !isLoading) {
        isLoading = true;
        textBox.disabled = true;
        teamNumberLoader.hidden = false
        await addTeamData(textBox.value).then(() => sortTeamData("EPA"));
        teamNumberLoader.hidden = true
        isLoading = false;
        textBox.disabled = false;
    }
});