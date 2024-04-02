import React, { useEffect, useState } from "react";
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
import { Container } from "@mui/material";

function MyApp({ Component, pageProps }: AppProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [dAppWallet, setDAppWallet] = useState({
    connected: false,
    name: "",
    addresses: [""],
  });
  const [expanded, setExpanded] = useState<string | false>(false);
  const [addWalletModalOpen, setAddWalletModalOpen] = useState(false);

  // const debounce = (func: () => void, delay: number) => {
  //   let timer: number;
  //   return () => {
  //     clearTimeout(timer);
  //     timer = window.setTimeout(() => {
  //       func();
  //     }, delay);
  //   };
  // };

  // useEffect(() => {
  //   const sendHeight = () => {
  //     const height = document.body.scrollHeight;
  //     // Use '*' for targetOrigin in examples; specify the domain in production for security
  //     window.parent.postMessage({ height: height }, '*');
  //   };

  //   // Debounce sendHeight for resize events
  //   const debouncedSendHeight = debounce(sendHeight, 100);

  //   // Send initial height
  //   sendHeight();

  //   // Add event listener for window resize
  //   window.addEventListener('resize', debouncedSendHeight);

  //   // Setup MutationObserver to observe body for height changes
  //   const observer = new MutationObserver(debouncedSendHeight);
  //   observer.observe(document.body, {
  //     childList: true,
  //     subtree: true,
  //     attributes: true
  //   });

  //   // Cleanup function
  //   return () => {
  //     window.removeEventListener('resize', debouncedSendHeight);
  //     observer.disconnect();
  //   };
  // }, []);


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
              <Container sx={{ pb: '60px', pt: '132px' }}>
                <Component {...pageProps} />
                <AlertComponent />
              </Container>
            </AlertProvider>
          </WalletContext.Provider>
        </ThemeProvider>
      </LocalizationProvider>
    </>
  );
}

export default trpc.withTRPC(MyApp);
