const express = require('express')
const app = express()
app.use(express.json());
const port = 3000

/**
 * Map with all interactive data.
 * 
 * Schema:
 * {
 *   interactiveId: [
 *     {'user1', 'user2'},
 *     {'user3'},
 *     {},
 *     {'user4', 'user5'}
 *   ]
 * }
 */
const allInteractives = new Map();

// All interactive components will contain up to 4 options.
const MAX_OPTIONS = 4;

/**
 * Mock backend for a interactives connection.
 * 
 * localhost:3000/
 *      Returns all the polls results.
 */

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/**
 * Admin view of all polls and the respective counts.
 */
app.get('/', (req, res) => {
    var document = "<div><h1 style=\"color: #5be7ff\">Polls results <a href='/fake'><button>Fake results</button></a></h1>";
    for (let [key, results] of allInteractives) {
        var currElement = "<div><h3>" + key + "</h3><ul>";
        results.forEach((e, i) => {
            currElement += "<li>Option " + i.toString() + ": "+ e.size.toString() + " votes</li>";
        });
        currElement += "</ul></div>";
        document += currElement;
    }
    document += "</div>";
    var html = "<html><head><title>Interactives Backend</title><link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap\" rel=\"stylesheet\"></head><body style=\"background-color: #242327;color:#fff;font-family:'Poppins'\">" + document + "</body><html>";
    res.send(html);
});

/**
 * Will create poll if does not exist.
 * @param {string} pollKey 
 */
function ensurePollExists(pollKey) {
    if (!allInteractives.has(pollKey)) {
        allInteractives.set(pollKey, new Array());
        for (let i = 0; i < MAX_OPTIONS; i++) {
            allInteractives.get(pollKey).push(new Set());
        }
        console.log('Poll created:', pollKey);
        return true;
    }
    return false;
}

/**
 * Adds the clientId to the set of votes for the option.
 * @param {string} pollKey 
 * @param {string} clientId 
 * @param {number} vote 
 */
function castVote(pollKey, clientId, vote) {
    ensurePollExists(pollKey);
    var hasVoted = false;
    for (let votes of allInteractives.get(pollKey).values()) {
        hasVoted |= votes.has(clientId);
    }
    if (hasVoted) {
        console.log('Vote duplicate:', vote, 'for', pollKey);
        return false;
    } else if (vote < 0 || vote >= allInteractives.get(pollKey).size) {
        console.log('Vote outside bounds:', vote, 'for', pollKey);
        return false;
    }
    allInteractives.get(pollKey)[vote].add(clientId);
    console.log('Vote casted:', vote, 'for', pollKey);
    return true;
}

/**
 * Creates the response JSON to return.
 * @param {string} pollKey 
 * @param {string} clientId 
 */
function makeResponse(pollKey, clientId) {
    ensurePollExists(pollKey);
    var options = allInteractives.get(pollKey).map((votes, interactiveValue) => {
        return {
            'index': interactiveValue,
            'count': votes.size,
            'selected': votes.has(clientId)
        };
    })
    return {'options': options};
}

/**
 * Get the results for a poll.
 * 
 * The query parameters contain the data for getting votes.
 * 
 */
app.get('/interactives/:interactiveId', (req, res) => {
    const clientId = req.query['client'];
    const backendId = req.params['interactiveId'];
    res.json(makeResponse(backendId, clientId));
})

/**
 * Post a vote on a poll.
 * The body contains the data for casting the vote.
 */
app.post('/interactives/:interactiveId/:vote', (req, res) => {
    console.log(req.params['interactiveId'], req.query, req.body);
    if (!req.query || !req.query['client'] || !req.body || req.body['option_selected'] == undefined) {
        return res.sendStatus(400);
    }
    const clientId = req.query['client'];
    const vote = req.body['option_selected'];
    const backendId = req.params['interactiveId'];
    castVote(backendId, clientId, vote);
    res.json(makeResponse(backendId, clientId));
})

/**
 * Clean results and fake votes.
 * NOTE: Used for testing only.
 */
app.get('/fake', (req, res) => {
    for (let votes of allInteractives.values()) {
        for (let voteSet of votes) {
            voteSet.clear();
            let randNum = Math.random() * 10;
            for (let i = 0; i < randNum; i++) voteSet.add(i);
        }
    }
    res.redirect('/');
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));