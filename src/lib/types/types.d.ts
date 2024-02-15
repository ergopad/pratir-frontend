interface ISale {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  sellerWallet: string;
  saleWallet: string;
  packs: IPack[];
  collection?: ICollection;
  artist?: IArtist;
  status: string;
}

interface IDerivedPrice {
  amount: number;
  derivedFrom: string;
  packId: string;
  tokenId: string;
}

interface IPack {
  id: string;
  name: string;
  image: string;
  price: IPrice[];
  derivedPrice: IDerivedPrice[];
  content: IContent[];
  soldOut: boolean;
}

interface IPrice {
  id: string;
  tokenId: string;
  amount: number;
  packId: string;
}

interface IContent {
  id: string;
  rarity: IRarity[];
  amount: number;
  packId: string;
}

interface IRarity {
  odds: number;
  rarity: string;
}

interface ICollection {
  id: string;
  artistId: string;
  name: string;
  tokenId: string | null;
  description: string;
  bannerImageUrl: string;
  featuredImageUrl: string;
  collectionLogoUrl: string;
  category: string;
  mintingExpiry: number;
  rarities: {
    image: string;
    rarity: string;
    description: string;
  }[];
  availableTraits: {
    max?: number;
    tpe: string;
    name: string;
    image: string;
    description: string;
  }[];
  saleId: string;
  status: string;
  mintingTxId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IArtist {
  id: string;
  address: string;
  name: string;
  website: string;
  tagline: string;
  avatarUrl: string;
  bannerUrl: string;
  social: {
    url: string;
    socialNetwork: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface IOrderRequests {
  saleId: string;
  packRequests: {
    packId: string;
    count: number;
    currencyTokenId: string;
  }[]
}

interface IOrder {
  targetAddress: string;
  userWallet: string[];
  txType: 'EIP-12';
  requests: IOrderRequests[]
}

type TSubmitting = "submitting" | "ergopay" | "success" | "failed" | undefined
