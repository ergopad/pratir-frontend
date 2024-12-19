import React, { createContext } from "react";

export interface IWalletContext {
  chain: Chain;
  setChain: React.Dispatch<React.SetStateAction<Chain>>;
  walletAddress: string;
  setWalletAddress: React.Dispatch<React.SetStateAction<string>>;
  dAppWallet: IDAppWallet;
  setDAppWallet: React.Dispatch<React.SetStateAction<IDAppWallet>>;
  addWalletModalOpen: boolean;
  setAddWalletModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expanded: string | false;
  setExpanded: React.Dispatch<React.SetStateAction<string | false>>;
}

export const WalletContext = createContext({} as IWalletContext);
