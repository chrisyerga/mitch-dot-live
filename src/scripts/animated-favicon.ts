import { bootAnimatedFavicon } from "../lib/animatedFavicon";

const meta = document.querySelector('meta[name="mitch-status-alive"]');
const initialIsAlive = meta?.getAttribute("content") !== "false";

bootAnimatedFavicon(initialIsAlive);
