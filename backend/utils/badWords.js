const BAD_WORDS = [
    "fuck",
    "fucked",
    "fucker",
    "fucking",
    "shit",
    "shitty",
    "bullshit",
    "bitch",
    "bitches",
    "asshole",
    "bastard",
    "mf",
    "motherfucker",
    "dick",
    "dicks",
    "dickhead",
    "cock",
    "cocks",
    "cocksucker",
    "suck",
    "ass",
    "asses",
    "asshat",
    "asswipe",
    "pussy",
    "pussies",
    "cunt",
    "slut",
    "whore",
    "damn",
    "hell",
    "nigga",
    "nigger",
    "fag",
    "faggot",
    "retard",
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const filterBadWords = (text = "") => {
    if (!text) return text;
    const pattern = BAD_WORDS.map((w) => escapeRegExp(w)).join("|");
    if (!pattern) return text;
    const regex = new RegExp(`\\b(${pattern})\\b`, "gi");
    return text.replace(regex, (match) => "*".repeat(match.length));
};
