import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "poll data sources",
  { minutes: 15 },
  internal.polling.runPolls.runPolls,
  {},
);

export default crons;
