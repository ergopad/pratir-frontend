import { SIGUSD_TOKEN_ID } from "./pack-helpers";

export const bytesToSize = (bytes: any) => {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
};

export const aspectRatioResize = (
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
  const isLandscape: boolean = sourceWidth > sourceHeight;

  let newHeight: number;
  let newWidth: number;

  if (isLandscape) {
    newHeight = (maxWidth * sourceHeight) / sourceWidth;
    newWidth = maxWidth;
  } else {
    newWidth = (maxHeight * sourceWidth) / sourceHeight;
    newHeight = maxHeight;
  }

  return {
    width: newWidth.toString() + "px",
    // height: newHeight.toString() + 'px',
    "&::after": {
      paddingTop: ((newHeight / newWidth) * 100).toString() + "%",
      display: "block",
      content: '""',
    },
  };
};

export const formatNumber = (num: number, sigFig?: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else if (num >= 0.001) {
    return num.toFixed(sigFig && sigFig < 3 ? sigFig : 3).replace(/\.?0+$/, "");
  } else {
    if (sigFig && sigFig === 2) return "0.01";
    if (sigFig && sigFig === 1) return "0.1";
    return "0.001";
  }
};

export const stringToUrl = (str: string): string | undefined => {
  if (str) {
    // Replace all spaces with dashes and convert to lowercase
    str = str.replace(/\s+/g, "-").toLowerCase();
    // Remove all special characters using a regular expression
    str = str.replace(/[^\w-]+/g, "");
    return str;
  } else return undefined;
};

export const slugify = (str: string) => {
  const urlSafeChars = /[a-z0-9-]/;
  const slug = str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  return encodeURIComponent(
    [...slug]
      .map((c) => (urlSafeChars.test(c) ? c : encodeURIComponent(c)))
      .join("")
  );
};

export const getShorterAddress = (
  address: string,
  substring?: number
): string => {
  let shortAddress = address ? address : "";
  shortAddress =
    shortAddress.length < 5
      ? shortAddress
      : shortAddress.substring(0, substring ? substring : 3) +
        ".." +
        shortAddress.substring(
          shortAddress.length - (substring ? substring : 3),
          shortAddress.length
        );

  return shortAddress;
};

export const flattenJSON = (jsonData: JsonObject): JsonObject => {
  const _flattenJSON = (
    obj: JsonObject = {},
    res: JsonObject = {}
  ): JsonObject => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] !== "object") {
        res[key] = obj[key];
      } else {
        _flattenJSON(obj[key], res);
      }
    });
    return res;
  };
  return _flattenJSON(jsonData);
};

export const parseDescription = (description: string) => {
  try {
    return flattenJSON(JSON.parse(description));
  } catch (e) {
    try {
      // parse error some descriptions have unicode escape characters as the first character
      return flattenJSON(JSON.parse(description.slice(1)));
    } catch (e) {
      // description is a string
      return { Description: description ? description : "" };
    }
  }
};

export const getPriceAndCurrency = (pack: Pack, chain: Chain) => {
  switch (chain) {
    case "ergo": {
      // Find SigUSD price first
      const sigUSDPrice = pack.price.find((p) => p.tokenId === SIGUSD_TOKEN_ID);
      if (sigUSDPrice) {
        return {
          price: Number(sigUSDPrice.amount * 0.01), // SigUSD conversion
          currency: "SigUSD",
        };
      }

      // If no SigUSD, look for ERG price (all zeros token ID)
      const ergPrice = pack.price.find(
        (p) =>
          p.tokenId ===
          "0000000000000000000000000000000000000000000000000000000000000000"
      );
      if (ergPrice) {
        return {
          price: Number(ergPrice.amount * 0.000000001), // ERG conversion
          currency: "Erg",
        };
      }
    }

    case "cardano": {
      // Look for lovelace price
      const adaPrice = pack.price.find((p) => p.tokenId === "lovelace");
      if (adaPrice) {
        return {
          price: Number(adaPrice.amount * 0.000001), // ADA conversion
          currency: "Ada",
        };
      }
    }
  }
};
