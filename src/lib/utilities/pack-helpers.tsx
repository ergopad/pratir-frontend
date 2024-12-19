export const SIGUSD_TOKEN_ID =
  "03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04";

// Helper function to determine pack type
export const getPackType = (
  pack: IPack,
  chain: Chain
): "buy" | "buyAndOpen" | "open" => {
  const currencyId = chain === "cardano" ? "lovelace" : SIGUSD_TOKEN_ID;

  // Buy only: single price with currency (lovelace/sigusd)
  if (pack.price.length === 1 && pack.price[0].tokenId === currencyId) {
    return "buy";
  }

  // Buy and open: two prices, one currency and one pack token
  if (
    pack.price.length === 2 &&
    pack.price.some((p) => p.tokenId === currencyId)
  ) {
    return "buyAndOpen";
  }

  // Open only: single price with non-currency token
  return "open";
};

// Function to sort and group packs
export const sortAndGroupPacks = (packs: IPack[], chain: Chain): Pack[] => {
  // Group packs by name first
  const groupedByName = packs.reduce(
    (groups: { [key: string]: IPack[] }, pack) => {
      if (!groups[pack.name]) groups[pack.name] = [];
      groups[pack.name].push(pack);
      return groups;
    },
    {}
  );

  // For each name group, sort by type
  const sortedPacks: Pack[] = [];
  Object.values(groupedByName).forEach((group) => {
    const sortedGroup = group.sort((a, b) => {
      const typeA = getPackType(a, chain);
      const typeB = getPackType(b, chain);
      const order = { buy: 0, buyAndOpen: 1, open: 2 };
      return order[typeA] - order[typeB];
    });

    sortedGroup.forEach((pack) => {
      sortedPacks.push({
        id: pack.id,
        name: pack.name,
        image: pack.image,
        price: pack.price,
        packType: getPackType(pack, chain),
        content: pack.content,
        soldOut: pack.soldOut,
        derivedPrice: pack.derivedPrice,
      });
    });
  });

  return sortedPacks;
};
