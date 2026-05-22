import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url) throw new Error("UPSTASH_REDIS_REST_URL is not set");
if (!token) throw new Error("UPSTASH_REDIS_REST_TOKEN is not set");

export const redis = new Redis({ url, token });
