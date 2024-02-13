import React, { useState } from "react";
import "@styles/globals.css";
import type { AppProps } from "next/app";
import { theme } from "@theme/theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import { WalletContext } from "@contexts/WalletContext";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { trpc } from "@server/utils/trpc"
import { AlertProvider } from "@contexts/AlertContext";
import AlertComponent from "@components/AlertComponent";

function MyApp({ Component, pageProps }: AppProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [dAppWallet, setDAppWallet] = useState({
    connected: false,
    name: "",
    addresses: [""],
  });
  const [expanded, setExpanded] = useState<string | false>(false);
  const [addWalletModalOpen, setAddWalletModalOpen] = useState(false);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1.0, user-scalable=yes"
        />
      </Head>
      <LocalizationProvider
        // @ts-ignore
        dateAdapter={AdapterDayjs}
      >
        <ThemeProvider theme={theme}>
          <WalletContext.Provider
            value={{
              walletAddress,
              setWalletAddress,
              dAppWallet,
              setDAppWallet,
              addWalletModalOpen,
              setAddWalletModalOpen,
              expanded,
              setExpanded,
            }}
          >
            <AlertProvider>
              <CssBaseline enableColorScheme />
              <AlertComponent />
              <Component {...pageProps} />
            </AlertProvider>
          </WalletContext.Provider>
        </ThemeProvider>
      </LocalizationProvider>
    </>
  );
}

export default trpc.withTRPC(MyApp);
