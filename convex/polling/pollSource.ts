import type { PollResult } from "../lib/pollStatus";
import { fetchWikidataEntity } from "./wikidata";
import { fetchWikipediaPage } from "./wikipedia";
import { fetchCongressMember } from "./congressGov";
import { fetchWireHeadlines } from "./newsSearch";
import { fetchXSignal } from "./xSearch";
import type { EnabledDataSource } from "../lib/pollStatus";

export async function pollSource(source: EnabledDataSource): Promise<PollResult> {
  switch (source.key) {
    case "wikidata": {
      const entityId = source.config?.wikidataEntityId;
      if (!entityId) {
        throw new Error(`Missing wikidataEntityId for source ${source.key}`);
      }
      const result = await fetchWikidataEntity(entityId);
      return {
        parsedStatus: result.parsedStatus,
        currentStatusDetail: result.detail,
        payload: result.rawPayload,
        summary: result.payloadSummary,
      };
    }
    case "wikipedia": {
      const pageTitle = source.config?.wikipediaPageTitle;
      if (!pageTitle) {
        throw new Error(`Missing wikipediaPageTitle for source ${source.key}`);
      }
      const result = await fetchWikipediaPage(pageTitle);
      return {
        parsedStatus: result.parsedStatus,
        currentStatusDetail: result.detail,
        payload: result.rawPayload,
        summary: result.payloadSummary,
      };
    }
    case "congressgov": {
      const bioguideId = source.config?.bioguideId;
      if (!bioguideId) {
        throw new Error(`Missing bioguideId for source ${source.key}`);
      }
      const result = await fetchCongressMember(bioguideId);
      return {
        parsedStatus: result.parsedStatus,
        currentStatusDetail: result.detail,
        payload: result.rawPayload,
        summary: result.payloadSummary,
      };
    }
    case "google_news_wires": {
      const result = await fetchWireHeadlines(source.config ?? {});
      return {
        parsedStatus: result.parsedStatus,
        currentStatusDetail: result.detail,
        payload: result.rawPayload,
        summary: result.payloadSummary,
      };
    }
    case "x_trends": {
      const result = await fetchXSignal(source.config ?? {});
      return {
        parsedStatus: result.parsedStatus,
        currentStatusDetail: result.detail,
        payload: result.rawPayload,
        summary: result.payloadSummary,
      };
    }
    default:
      throw new Error(`Unsupported data source key: ${source.key}`);
  }
}
