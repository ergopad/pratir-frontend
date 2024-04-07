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

interface INftItem {
  imgUrl?: string;
  link: string;
  name: string;
  tokenId: string;
  qty?: number;
  price?: number;
  currency?: string;
  rarity?: string;
  saleType?: 'mint' | 'auction' | 'sale';
  artist?: string;
  artistLink?: string;
  collection?: string;
  collectionLink?: string;
  explicit?: boolean;
  type?: string;
  loading?: boolean;
  remainingVest?: number;
}

interface IPackTokenListItem {
  amount: number;
  packId: string;
  packToken: string;
  saleId: string;
}

interface IPackTokenHistoryItem {
  id: string;
  userAddress: string;
  saleId: string;
  packId: string;
  packToken: string;
  orderBoxId: string;
  followUpTxId: string;
  tokensBought: [string, number][];
  status: string;
  created_at: string;
  updated_at: string;
}

interface IRoyalty {
  address: string;
  percentage: number;
}

interface IProperties {
  [key: string]: string;
}

interface ILevelsStats {
  [key: string]: [number, number]; // value, max value
}

interface IPackInfo {
  name: string;
  description: string; // can be JSON string or string
  decimals: number;
  minted: number;
  hash: string;
  link: string; // empty string if not available
  royalties?: IRoyalty[];
  properties?: IProperties;
  levels?: ILevelsStats;
  stats?: ILevelsStats;
  collection?: string;
  additional_info?: {
    explicit?: string; // binary flag?
  };
}

interface ICardsViewed {
  name: string;
  image: string;
  description: string;
}

interface IPackListItem {
  tokenId: string;
  metadata: IPackInfo;
}