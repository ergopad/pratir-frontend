import axios from "axios";

type Token = {
  token_amount: number;
  wrapped_tokens: any[];
  token_id: string;
  token_name: string;
  token_description: string;
  decimals: number;
  minted: number;
  value_in_erg: number;
};

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
    // console.error(`Failed to fetch metadata:`, error);
    throw error;
  }
}

export async function fetchUsersAssets(addresses: string[]) {
  const baseUrl = `${process.env.CRUX_API}/crux/portfolio`;
  // console.log("addresses", addresses)
  try {
    const response = await axios.post(baseUrl, { addresses });

    return response.data as Token[];
  } catch (error: unknown) {
    // console.error(`Failed to fetch tokens:`, error);
    throw error;
  }
}