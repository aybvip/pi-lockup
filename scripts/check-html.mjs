import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const srcs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
const local = srcs.filter((s) => !/^(https?:|data:|#|mailto:)/.test(s));
console.log("total refs:", srcs.length);
console.log("local refs:", local.length ? local : "none (all absolute)");
const opens = (html.match(/<div\b/g) || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
console.log("div open/close:", opens, closes, opens === closes ? "OK" : "MISMATCH");
console.log("doctype:", html.startsWith("<!doctype html>"));
console.log("title:", (html.match(/<title>(.*?)<\/title>/) || [])[1]);
