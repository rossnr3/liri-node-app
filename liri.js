/******************************************************************************
 * LIRI Bot Script - Dependencies
 ******************************************************************************/

require("dotenv").config();                     // Load configuration
let keys = require("./keys.js");                // ...and create keys object

let Spotify = require('node-spotify-api');      // Load spotify
let spotify = new Spotify(keys.spotify);        // ...and get the key from keys.js

let moment = require('moment');                 // moment for date manipulation
// moment().format();                              

let axios = require('axios');                   // Axios    

let fs = require('fs');                         // file io

let args = {                                    // Arguments object
    command: "",
    criteria: ""
}

const CMD_IDX = 2;                              // argument indexes
const CRITERIA_IDX = 3;

const CONCERT_THIS = "concert-this";            // Application commands
const SPOTIFY_THIS_SONG = "spotify-this-song";
const MOVIE_THIS = "movie-this";
const DO_WHAT_IT_SAYS = "do-what-it-says";

const DEFAULT_ARTIST = "Ace of Base";           // Default criteria
const DEFAULT_SONG = "The Sign";
const DEFAULT_MOVIE = "Mr. Nobody";

const BANDS_URL1 = "https://rest.bandsintown.com/artists/";
const BANDS_URL2 = "/events?app_id=codingbootcamp";
const MOVIE_URL1 = "http://www.omdbapi.com/?t=";
const MOVIE_URL2 = "&y=&plot=short&apikey=trilogy";

const ROTTEN_TOMATOES = "Rotten Tomatoes";
const MAX_SONGS = 5;
const txtFile = "random.txt";

/******************************************************************************
 * Helper Functions
 ******************************************************************************/

// Set command criteria. If none specified, notify the user, and use default
function setCriteria(type, def) {
    if (!args.criteria) {
        displaySep();
        console.log(`No ${type} specified, using default: ${def}`);
        args.criteria = def;
    }
}

// Display a separator to break up console messages
function displaySep() {
    console.log("\n" + "-".repeat(80));
}

/******************************************************************************
 * Search for Events
 * If no artist is specified, use the default artist. Make an axios request to
 * Bands In Town API. If no events found, notify the user. Display the
 * venue, location, and date of each upcoming event.
 ******************************************************************************/
function concertThis() {
    setCriteria("artist", DEFAULT_ARTIST);
    axios.get(BANDS_URL1 + args.criteria + BANDS_URL2)
    .then(function (response) {
        let concerts = response.data;
        if (concerts.length > 0) {          // Any events?
            displaySep();                   // yes, display them
            console.log(`Displaying upcoming events for ${args.criteria}:`);
            concerts.forEach(function(concert) {    
                console.log(`\n\tVenue: ${concert.venue.name}`);
                console.log(`\tLocation: ${concert.venue.city}, ${concert.venue.region}`);
                console.log(`\tDate: ${moment(concert.datetime).format("MM/DD/YYYY")}`);
            });
        } else {                            // No events found - notify user
            displaySep();
            console.log(`No events found for: ${args.criteria}.`);
        }
    })
    .catch(function (error) {
        console.log(error);
    });
}

/******************************************************************************
 * Search for a Song
 * If no song is specified, use the default song. Make a request to Spotify.
 * There is a limit to the number of matches returned.
 ******************************************************************************/
// Extract the artists
function getArtists(artists) {
    let result = "";
    artists.forEach(function(artist) {
        result += artist.name + ", ";
    });
    return result.substr(0, result.length - 2);
}
function spotifySong() {
    setCriteria("song", DEFAULT_SONG);
    spotify
        .search({ type: 'track', query: args.criteria })
        .then(function (response) {
            displaySep();
            let matches = response.tracks.items.length;
            if (matches > MAX_SONGS) {
                console.log(
                    `There are ${matches} songs matching the search criteria.`);
                console.log(`The first ${MAX_SONGS} will be displayed.`);
            }
            for (let i = 0; i < MAX_SONGS; i++) {
                console.log(
                    `\nArtist(s): ${getArtists(response.tracks.items[i].artists)}`);
                console.log(`Song Name: ${response.tracks.items[i].name}`);
                console.log(`Album Name: ${response.tracks.items[i].album.name}`);
                console.log(`Preview Link: ${response.tracks.items[i].preview_url}`);
            }
        })
        .catch(function (err) {
            console.log(err);
        });
}

/******************************************************************************
 * Search for a Movie
 * If no movie is specified, use the default movie. Make an axios request to
 * the OMDB API. If no movie is found, notify the user. Display the
 * movie's title, year released, IMDB rating, Rotten Tomatoes rating, country
 * produced, language, plot, and actors.
 ******************************************************************************/
// Extract the year released
function yearReleased(movie) {
    return moment(movie.Released, "DD MMM YYYY").format("YYYY");
}

// Extract Rotten Tomatoes rating
function rottenTomatoes(movie) {
    let result = "Not rated";
    movie.Ratings.forEach(function(rating) {
        if (rating.Source === ROTTEN_TOMATOES) {
            result = rating.Value;
        }
    });
    return result;
}

function movieThis() {
    setCriteria("movie", DEFAULT_MOVIE);
    axios.get(MOVIE_URL1 + args.criteria + MOVIE_URL2)
    .then(function (response) {
        let movie = response.data;
        if (movie.Response) {                   // Was the movie found?
            displaySep();                       // yes, display information
            console.log(`Movie Title:      ${movie.Title}`);
            console.log(`Year Released:    ${yearReleased(movie)}`);
            console.log(`IMDB Rating:      ${movie.imdbRating}`);
            console.log(`Rotten Tomatoes:  ${rottenTomatoes(movie)}`);
            console.log(`Country Produced: ${movie.Country}`);
            console.log(`Language(s):      ${movie.Language}`);
            console.log(`Actors:           ${movie.Actors}`);
            console.log(`Plot:\n${movie.Plot}`);
        } else {                                // movie not found
            displaySep();
            console.log(`No movie found for: ${args.criteria}.`);
        }
    })
    .catch(function (error) {
        console.log(error);
    });
}

/******************************************************************************
 * Process Text Input
 * Reads a single command and criteria from a text file, and processes like
 * arguments received.
 ******************************************************************************/
function doThis() {
    let content = fs.readFileSync(txtFile, "utf8");
    let dataArr = content.split(",");
    args.command = dataArr[0].trim();
    args.criteria = dataArr[1].trim();
    displaySep();
    console.log(`Using ${txtFile}: command=${args.command}, criteria=${args.criteria}`);
}

/******************************************************************************
 * Main Process
 ******************************************************************************/

// The Liri application is executed with command line arguments. If a valid
// command is received, it is executed, and the application exits. Otherwise
// the user is notified of the error.
args.command = process.argv[CMD_IDX];           // Extract arguments
args.criteria = process.argv[CRITERIA_IDX];
if (args.command === DO_WHAT_IT_SAYS) {         // text input?
    console.log("Do What it says");
    doThis();                                   // yes, get arguments
}

switch (args.command) {                         // Process the command
    case CONCERT_THIS:                          // Search for event
        concertThis();
        break;
    case SPOTIFY_THIS_SONG:                     // Search for song
        spotifySong();
        break;
    case MOVIE_THIS:                            // Search for movie
        movieThis();
        break;
    default:                                    // Undefined or missing command
        displaySep();
        console.log("Missing or invalid command argument. Try again.");
        break;
}
