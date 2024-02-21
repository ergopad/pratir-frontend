import axios from "axios";

export async function fetchMetadataForTokenIds(tokenIds: string[]) {
  const baseUrl = `${process.env.CRUX_API}/crux/asset_info_v2`;

  try {
    const response = await axios.post(baseUrl, tokenIds);

    const metadataResults: { tokenId: string; metadata: IPackInfo }[] = response.data.map((metadata: IPackInfo, i: number) => ({
      tokenId: tokenIds[i],
      metadata,
    }));

    return metadataResults;
  } catch (error: unknown) {
    console.error(`Failed to fetch metadata:`, error);
    throw error;
  }
}
