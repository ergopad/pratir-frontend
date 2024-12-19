import axios from "axios";

const saleId = process.env.BLITZ_SALE;

export async function fetchSaleData() {
  const apiUrl = `${process.env.API_URL}/sale/${saleId}`;
  try {
    const response = await axios.get(apiUrl);
    return response.data as ISale;
  } catch (error: any) {
    console.error("Failed to fetch sale data:", error);
    // Throw an error to halt the build process
    throw new Error(
      `Failed to fetch sale data: ${error.message ?? "unknown error"}`
    );
  }
}

export async function fetchAllSaleData() {
  const apiUrl = `${process.env.API_URL}/sale`;
  try {
    const response = await axios.get(apiUrl);
    return response.data as ISale[];
  } catch (error: any) {
    console.error("Failed to fetch sale data:", error);
    // Throw an error to halt the build process
    throw new Error(
      `Failed to fetch sale data: ${error.message ?? "unknown error"}`
    );
  }
}

export const fetchAllSaleDataNew = async () => {
  const [blitzData, cardanoData] = await Promise.all([
    // Fetch from primary API
    fetch(`${process.env.API_URL}/sale/${process.env.BLITZ_SALE}`).then((res) =>
      res.json()
    ),
    // Fetch from Cardano API
    fetch(
      `${process.env.CARDANO_API_URL}/sale/${process.env.CARDANO_SALE_ID}`
    ).then((res) => res.json()),
  ]);

  return {
    ergo: blitzData,
    cardano: cardanoData,
  };
};
