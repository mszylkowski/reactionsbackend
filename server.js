const express = require('express')
const app = express()
app.use(express.json());
const port = 3000

/**
 * Map with all reaction data.
 * 
 * Schema:
 * {
 *   reactionId: [
 *     {'user1', 'user2'},
 *     {'user3'},
 *     {},
 *     {'user4', 'user5'}
 *   ]
 * }
 */
const allReactions = new Map();

// All reaction components will contain up to 4 options.
const MAX_OPTIONS = 4;

/**
 * Mock backend for a reactions connection.
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
    var document = "<div><h1>Polls results <a href='/fake'><button>Fake results</button></a></h1>";
    for (let [key, results] of allReactions) {
        var currElement = "<div><h3>" + key + "</h3><ul>";
        results.forEach((e, i) => {
            currElement += "<li>Option " + i.toString() + ": "+ e.size.toString() + " votes</li>";
        });
        currElement += "</ul></div>";
        document += currElement;
    }
    document += "</div>";
    res.send(document);
});

/**
 * Will create poll if does not exist.
 * @param {string} pollKey 
 */
function ensurePollExists(pollKey) {
    if (!allReactions.has(pollKey)) {
        allReactions.set(pollKey, new Array());
        for (let i = 0; i < MAX_OPTIONS; i++) {
            allReactions.get(pollKey).push(new Set());
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
    for (let votes of allReactions.get(pollKey).values()) {
        hasVoted |= votes.has(clientId);
    }
    if (hasVoted) {
        console.log('Vote duplicate:', vote, 'for', pollKey);
        return false;
    } else if (vote < 0 || vote >= allReactions.get(pollKey).size) {
        console.log('Vote outside bounds:', vote, 'for', pollKey);
        return false;
    }
    allReactions.get(pollKey)[vote].add(clientId);
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
    var options = allReactions.get(pollKey).map((votes, reactionValue) => {
        return {
            'optionIndex': reactionValue,
            'totalCount': votes.size,
            'selectedByUser': votes.has(clientId)
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
app.get('/reactions/:reactionId', (req, res) => {
    const clientId = req.query['clientId'];
    const backendId = req.params['reactionId'];
    res.json(makeResponse(backendId, clientId));
})

/**
 * Post a vote on a poll.
 * The body contains the data for casting the vote.
 */
app.post('/reactions/:reactionId/react', (req, res) => {
    console.log(req.params['reactionId'], req.query, req.body);
    if (!req.query || !req.query['clientId'] || !req.body || req.body['optionSelected'] == undefined) {
        return res.sendStatus(400);
    }
    const clientId = req.query['clientId'];
    const vote = req.body['optionSelected'];
    const backendId = req.params['reactionId'];
    castVote(backendId, clientId, vote);
    res.json(makeResponse(backendId, clientId));
})

/**
 * Clean results and fake votes.
 * NOTE: Used for testing only.
 */
app.get('/fake', (req, res) => {
    for (let votes of allReactions.values()) {
        for (let voteSet of votes) {
            voteSet.clear();
            let randNum = Math.random() * 10;
            for (let i = 0; i < randNum; i++) voteSet.add(i);
        }
    }
    res.redirect('/');
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));