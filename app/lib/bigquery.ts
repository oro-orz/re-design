/**
 * BigQuery クライアント初期化
 */

import { BigQuery } from "@google-cloud/bigquery";

let bigQueryClient: BigQuery | null = null;

/**
 * BigQuery クライアントを取得
 */
export function getBigQueryClient(): BigQuery {
  if (bigQueryClient) {
    return bigQueryClient;
  }

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    try {
      const credentials =
        typeof credentialsJson === "string"
          ? (JSON.parse(credentialsJson) as { project_id?: string })
          : credentialsJson;
      bigQueryClient = new BigQuery({
        projectId:
          process.env.GOOGLE_CLOUD_PROJECT || credentials.project_id,
        credentials,
      });
    } catch (error) {
      console.error("Failed to parse BigQuery credentials:", error);
      bigQueryClient = new BigQuery({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
    }
  } else {
    bigQueryClient = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  }

  return bigQueryClient;
}
