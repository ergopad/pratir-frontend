import React, { FC, useState, useEffect, useContext } from "react";
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
} from "@mui/material";
import NumberIncrement from "@components/forms/NumberIncrement";
import ConfirmPurchase from "@components/dialogs/ConfirmPurchase";
import { WalletContext } from "@contexts/WalletContext";
import { getPriceAndCurrency } from "@utils/general";
import { CardanoWallet, useWallet } from "@meshsdk/react";

export interface IDirectSalesCardProps {
  tokenName: string;
  openNow: boolean;
  setOpenNow?: React.Dispatch<React.SetStateAction<boolean>>;
  saleId: string;
  packId: string;
  soldOut: boolean;
  status: string;
  startTime: string;
  endTime: string;
  pack?: Pack;
  derivedPrices: IDerivedPrice[];
}

const DirectSalesCard: FC<IDirectSalesCardProps> = ({
  tokenName,
  openNow,
  setOpenNow,
  saleId,
  packId,
  soldOut,
  status,
  startTime,
  endTime,
  pack,
  derivedPrices,
}) => {
  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up("sm"));
  const [numberSold, setNumberSold] = useState<number>(1);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [purchaseCurrency, setPurchaseCurrency] = useState("");
  const [priceAndCurrency, setPriceAndCurrency] = useState<{
    price: number;
    currency: string;
  }>({ price: 0, currency: "" });
  const [availablePrices, setAvailablePrices] = useState<{
    erg: number | undefined;
    blitz: number | undefined;
  }>({
    erg: undefined,
    blitz: undefined,
  });

  const { walletAddress, setAddWalletModalOpen, chain } =
    useContext(WalletContext);

  const { connected } = useWallet();

  useEffect(() => {
    if (pack) {
      const newPriceCurrency = getPriceAndCurrency(pack, chain);
      if (newPriceCurrency) setPriceAndCurrency(newPriceCurrency);
    }
  }, [pack, chain]);

  const handlePurchase = () => {
    const calculatedPrice = numberSold * priceAndCurrency.price;
    setTotalPrice(calculatedPrice);
    setPurchaseCurrency(priceAndCurrency.currency);
    setConfirmationOpen(true);
  };

  useEffect(() => {
    const erg = derivedPrices
      .flat()
      .find(
        (dp) =>
          dp.tokenId ===
          "0000000000000000000000000000000000000000000000000000000000000000"
      )?.amount
      ? derivedPrices
          .flat()
          .find(
            (dp) =>
              dp.tokenId ===
              "0000000000000000000000000000000000000000000000000000000000000000"
          )?.amount
      : priceAndCurrency.currency === "Erg"
      ? priceAndCurrency.price
      : undefined;
    const blitz = undefined; // derivedPrices.flat().find(dp => dp.tokenId === "BLITZTOKENID")?.amount
    setAvailablePrices({
      erg,
      blitz,
    });
  }, [derivedPrices]);

  const apiFormSubmit = (buyCurrency: string) => {
    if (buyCurrency === "sigusd") {
      setTotalPrice(numberSold * priceAndCurrency.price);
      setPurchaseCurrency("SigUSD");
      setConfirmationOpen(true);
    } else if (buyCurrency === "erg") {
      if (availablePrices.erg) {
        setTotalPrice(
          Number(
            (numberSold * availablePrices.erg * 0.000000001).toLocaleString(
              undefined,
              { maximumFractionDigits: 2 }
            )
          )
        );
        setPurchaseCurrency("Erg");
        setConfirmationOpen(true);
      } else {
        console.log("no erg price set");
      }
    } else if (buyCurrency === "blitz") {
      if (availablePrices.blitz) {
        setTotalPrice(
          Number(
            (numberSold * availablePrices.blitz).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })
          )
        );
        setPurchaseCurrency("Blitz");
        setConfirmationOpen(true);
      } else {
        console.log("no blitz price given");
      }
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          {status !== "LIVE" ? (
            <Typography>Not currently for sale</Typography>
          ) : (
            <>
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
                wrap="nowrap"
                sx={{ mb: "12px", maxWidth: "100%" }}
              >
                <Grid item zeroMinWidth xs>
                  <Box>
                    <Typography
                      sx={{
                        mb: 0,
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        lineHeight: 1.3,
                      }}
                    >
                      {priceAndCurrency.price * numberSold}{" "}
                      {priceAndCurrency.currency}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs="auto" sx={{ textAlign: "right" }}>
                  <Box sx={{ maxWidth: "180px" }}>
                    <NumberIncrement
                      value={numberSold}
                      setValue={setNumberSold}
                      label="Quantity"
                      name="Quantity"
                    />
                  </Box>
                </Grid>
              </Grid>

              {setOpenNow && (
                <FormGroup sx={{ mb: "12px" }}>
                  <FormControlLabel
                    className="custom-pointer"
                    control={
                      <Checkbox
                        checked={openNow}
                        onChange={() => setOpenNow(!openNow)}
                        inputProps={{
                          "aria-label":
                            "Open right away (I don't need the pack tokens)",
                        }}
                      />
                    }
                    label="Open right away (I don't need the pack tokens)"
                  />
                </FormGroup>
              )}

              {chain === "ergo" && !walletAddress ? (
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="contained"
                    onClick={() => setAddWalletModalOpen(true)}
                  >
                    Connect wallet to purchase
                  </Button>
                </Box>
              ) : chain === "ergo" ? (
                <>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        onClick={() => apiFormSubmit("erg")}
                        fullWidth
                        variant="outlined"
                        disabled={soldOut || !availablePrices.erg}
                      >
                        Buy with ERG
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        onClick={() => apiFormSubmit("sigusd")}
                        fullWidth
                        disabled={soldOut}
                        variant="contained"
                      >
                        Buy with SigUSD
                      </Button>
                    </Grid>
                  </Grid>
                  {/* <Button
                      onClick={() => apiFormSubmit("blitz")}
                      fullWidth
                      disabled={soldOut || !availablePrices.blitz}
                      variant="contained"
                    >
                      Buy with BLTZ (10% Discount)
                    </Button> */}
                </>
              ) : chain === "cardano" && !connected ? (
                <Box sx={{ textAlign: "center" }}>
                  <CardanoWallet isDark={true} />
                </Box>
              ) : (
                <Button
                  onClick={handlePurchase}
                  fullWidth
                  variant="contained"
                  disabled={soldOut}
                >
                  Buy with {priceAndCurrency.currency}
                </Button>
              )}

              {soldOut && (
                <Box>
                  <Typography variant="body2" sx={{ mt: 1, mb: 0 }}>
                    These packs are sold out.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmPurchase
        open={confirmationOpen}
        setOpen={setConfirmationOpen}
        tokenName={tokenName}
        qty={numberSold}
        openNow={openNow}
        price={totalPrice}
        currency={purchaseCurrency}
        saleId={saleId}
        packId={packId}
      />
    </>
  );
};

export default DirectSalesCard;
