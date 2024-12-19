import React, { FC, useContext, useEffect } from "react";
import UserMenu from "./user/UserMenu";
import {
  Box,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { WalletContext } from "@contexts/WalletContext";
import { CardanoWallet } from "@meshsdk/react";
import Link from "next/link";

interface IAppBarProps {
  title?: string;
}

const AppBar: FC<IAppBarProps> = ({ title }) => {
  const { chain, setChain } = useContext(WalletContext);

  useEffect(() => {
    const storedChain = localStorage.getItem("preferredChain");
    if (storedChain && (storedChain === "ergo" || storedChain === "cardano")) {
      setChain(storedChain);
    }
  }, [setChain]);

  const handleChainSwitch = (newChain: "ergo" | "cardano") => {
    if (newChain) {
      // Guard against null
      setChain(newChain);
      localStorage.setItem("preferredChain", newChain);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          position: "relative",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {title && (
            <Typography variant="h2" sx={{ mb: 0 }}>
              {title}
            </Typography>
          )}
        </Box>

        {/* Centered navigation */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Link href="/" passHref>
            <Button variant="text">Buy Packs</Button>
          </Link>
          <Link href="/open-packs" passHref>
            <Button variant="text">Open Packs</Button>
          </Link>
          <Link href="/history" passHref>
            <Button variant="text">History</Button>
          </Link>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            value={chain}
            exclusive
            onChange={(e, newChain) => handleChainSwitch(newChain)}
          >
            <ToggleButton color="primary" size="small" value="cardano">
              Cardano
            </ToggleButton>
            <ToggleButton color="primary" size="small" value="ergo">
              Ergo
            </ToggleButton>
          </ToggleButtonGroup>
          {chain === "cardano" ? <CardanoWallet isDark={true} /> : <UserMenu />}
        </Box>
      </Box>
    </>
  );
};

export default AppBar;
