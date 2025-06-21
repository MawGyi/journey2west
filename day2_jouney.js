const movies = [
    { name: "John Wick ", genre: "Action", Actor: "Keanu Reeves" },
    { name: "Pirate of Caribean", genre: "Action", Actor: "Johnny Depp"},
    { name: "Angels", genre: "Drama", Actor: "Denzel Washington"},
    { name: "Harry Potter", genre: "Fantasy", Actor: "Daniel Radcliffe"}
];

// Challenge: Find all Action movies genre from movies, get their names and actors in uppercase
const result = movies
    .filter(movie => movie.genre === "Action")
    .map(movie => `${movie.name.trim().toUpperCase()} - ${movie.Actor.toUpperCase()}`);

console.log(result); // Should log: ["JOHN WICK - KEANU REEVES", "PIRATE OF CARIBEAN - JOHNNY DEPP"]