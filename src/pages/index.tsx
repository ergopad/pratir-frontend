import React, { useState, useEffect, useContext } from "react";
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/system/Unstable_Grid/Grid";
import DirectSalesCard from "@components/token/DirectSalesCard";
import PackTokenSelector from "@components/token/PackTokenSelector";
import { formatNumber } from "@lib/utilities/general";
import { resolveIpfs } from "@utils/assets";
import AppBar from "@components/AppBar";
import type { NextPage } from "next";
import { GetStaticProps } from "next";
import { fetchAllSaleDataNew } from "@utils/fetchSaleData";
import { WalletContext } from "@contexts/WalletContext";
import { SIGUSD_TOKEN_ID, sortAndGroupPacks } from "@utils/pack-helpers";

const textSx = {
  mb: 0,
  fontSize: "16px",
  lineHeight: 1.25,
};

const boldTextSx = {
  mb: 0,
  fontSize: "16px",
  lineHeight: 1.25,
  fontWeight: 700,
};

const plural = (str: string, num: number) => {
  if (num > 1) return str + "s";
  else return str;
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await fetchAllSaleDataNew();
    return {
      props: {
        data,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Failed to fetch sale data:", error);
    throw new Error(
      `Failed to fetch sale data: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
};

interface HomeProps {
  data: SaleData;
}

// const SIGUSD_TOKEN_ID =
//   "03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04";

const Home: NextPage<HomeProps> = ({ data }) => {
  const { chain } = useContext(WalletContext);
  const [selectedPack, setSelectedPack] = useState<Pack | undefined>(undefined);
  const [openRightAwayPack, setOpenRightAwayPack] = useState<Pack | undefined>(
    undefined
  );
  const [saleData, setSaleData] = useState<ISale | undefined>(undefined);
  const [sortedPacks, setSortedPacks] = useState<Pack[]>([]);
  const [openNow, setOpenNow] = useState<boolean>(false);

  // console.log(data);

  // Update sale data based on chain
  useEffect(() => {
    if (data) {
      switch (chain) {
        case "ergo":
          setSaleData(data.ergo);
          break;
        case "cardano":
          setSaleData(data.cardano);
          break;
      }
    }
  }, [data, chain]);

  useEffect(() => {
    if (openNow && selectedPack) {
      const matchingPacks = sortedPacks.filter(
        (pack) => pack.name === selectedPack.name
      );
      const openPack = matchingPacks.find((pack) => pack.price.length === 2);
      setOpenRightAwayPack(openPack);
    }
  }, [openNow, selectedPack, sortedPacks]);

  useEffect(() => {
    const newPack = sortedPacks.find((pack) => pack.id === selectedPack?.id);
    if (newPack) {
      setSelectedPack(newPack);
    }
  }, [selectedPack?.id]);

  // Sort packs and build metadata when sale data changes
  useEffect(() => {
    if (saleData && saleData.packs?.length > 0) {
      const sorted = sortAndGroupPacks(saleData.packs, chain);
      setSortedPacks(sorted);

      // Set initial selection
      const firstBuyPack = sorted.find((pack) => pack.packType === "buy");
      if (firstBuyPack) {
        setSelectedPack(firstBuyPack);
      }
    }
  }, [saleData, chain]);

  const filterBuyOnlyPacks = (pack: Pack) => {
    if (chain === "cardano") {
      return pack.price.length === 1 && pack.price[0].tokenId === "lovelace";
    }
    return pack.price.length === 1 && pack.price[0].tokenId === SIGUSD_TOKEN_ID;
  };

  return (
    <>
      <AppBar title="Buy Packs" />
      <Grid container spacing={2} sx={{ mb: "24px" }}>
        <Grid md={6} xs={12}>
          <Paper
            sx={{
              position: "relative",
              mb: "24px",
              width: "100%",
              transform: "height 0.2s linear",
            }}
          >
            {selectedPack && (
              <img
                src={
                  selectedPack.name.includes("Common Pack 1st Ed Base")
                    ? "/assets/Packs_Common.png"
                    : selectedPack.name.includes("Uncommon Pack 1st Ed Base")
                    ? "/assets/Packs_Uncommon.png"
                    : selectedPack.name.includes("Rare Pack 1st Ed Base")
                    ? "/assets/Packs_Rare.png"
                    : resolveIpfs(selectedPack.image)
                }
                height="100%"
                width="100%"
                style={{
                  borderRadius: "8px",
                  lineHeight: 1,
                  display: "block",
                }}
                alt="image"
                crossOrigin="anonymous"
              />
            )}
          </Paper>
        </Grid>
        <Grid md={6} xs={12}>
          {sortedPacks && (
            <>
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h5">Choose a Pack</Typography>
                {sortedPacks
                  .filter(filterBuyOnlyPacks)
                  .sort((a, b) => {
                    // Get price in smallest unit (nanoErgs or lovelace)
                    const priceA = a.price[0].amount;
                    const priceB = b.price[0].amount;
                    return priceA - priceB;
                  })
                  .map((pack) => (
                    <PackTokenSelector
                      key={pack.id}
                      packInfo={pack}
                      selectedPack={selectedPack}
                      onSelect={setSelectedPack}
                    />
                  ))}
              </Paper>
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h5">Pack Contents</Typography>
                <List
                  dense
                  sx={{ transition: "height 0.2s ease-out", height: "100%" }}
                >
                  {sortedPacks
                    .filter(
                      (pack) =>
                        pack.name === selectedPack?.name &&
                        pack.packType === "buyAndOpen"
                    )
                    .map((pack) =>
                      pack.content?.map((content, i) => {
                        const totalOdds = content.rarity.reduce(
                          (tot, arr) => tot + arr.odds,
                          0
                        );

                        return (
                          <React.Fragment key={`rarity${i}`}>
                            {content.rarity.length === 1 ? (
                              <ListItem>
                                <Typography>
                                  {content.amount} Randomly Selected{" "}
                                  {plural("Token", content.amount)}
                                </Typography>
                              </ListItem>
                            ) : (
                              <>
                                <ListItem>
                                  <Typography>
                                    {content.amount}{" "}
                                    {plural("Token", content.amount)} with
                                    Custom Probability
                                  </Typography>
                                </ListItem>
                                {content.rarity.map((item, i) => (
                                  <ListItem key={i} sx={{ pl: 4 }}>
                                    {formatNumber(
                                      (item.odds / totalOdds) * 100,
                                      1
                                    )}
                                    % Chance of {item.rarity}
                                  </ListItem>
                                ))}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                </List>
              </Paper>
            </>
          )}
          {/* Pack Info for single pack case */}
          {sortedPacks.length === 3 && (
            <Paper sx={{ mb: 2, p: 2 }}>
              <Typography variant="h5">Pack Info</Typography>
              <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                <Grid>
                  <Typography sx={boldTextSx}>Pack Name:</Typography>
                </Grid>
                <Grid>
                  <Typography color="text.secondary" sx={textSx}>
                    {sortedPacks[0].name}
                  </Typography>
                </Grid>
              </Grid>

              {/* Get content from the buyAndOpen pack */}
              {sortedPacks
                .find((pack) => pack.packType === "buyAndOpen")
                ?.content?.map((content, i) => {
                  const totalOdds = content.rarity.reduce(
                    (tot, arr) => tot + arr.odds,
                    0
                  );

                  return (
                    <React.Fragment key={i}>
                      <Grid
                        container
                        justifyContent="space-between"
                        sx={{ mb: 1 }}
                      >
                        <Grid>
                          <Typography sx={boldTextSx}>
                            Pack Contents:
                          </Typography>
                        </Grid>
                        <Grid>
                          {content.rarity.length === 1 && (
                            <Typography color="text.secondary" sx={textSx}>
                              {content.amount} Randomly Selected{" "}
                              {plural("Token", content.amount)}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>

                      {content.rarity.length !== 1 && (
                        <List dense disablePadding>
                          <ListItem>
                            <ListItemText>
                              {content.amount} {plural("Token", content.amount)}{" "}
                              with Custom Probability
                            </ListItemText>
                          </ListItem>
                          {content.rarity.map((item, i) => (
                            <ListItem key={i} sx={{ pl: 4 }}>
                              {formatNumber((item.odds / totalOdds) * 100, 2)}%
                              Chance of {item.rarity}
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </React.Fragment>
                  );
                })}
            </Paper>
          )}
          <Box sx={{ mb: 3 }}>
            <DirectSalesCard
              tokenName={
                (openNow ? openRightAwayPack?.name : selectedPack?.name) ?? ""
              }
              openNow={openNow}
              setOpenNow={setOpenNow}
              saleId={saleData?.id ?? ""}
              packId={
                openNow && openRightAwayPack?.id
                  ? openRightAwayPack?.id
                  : selectedPack?.id ?? ""
              }
              soldOut={
                openNow && openRightAwayPack?.soldOut
                  ? openRightAwayPack?.soldOut
                  : selectedPack?.soldOut ?? false
              }
              status={saleData?.status ?? ""}
              startTime={saleData?.startTime ?? ""}
              endTime={saleData?.endTime ?? ""}
              pack={
                openNow && openRightAwayPack ? openRightAwayPack : selectedPack
              }
              derivedPrices={
                openNow && openRightAwayPack?.derivedPrice
                  ? openRightAwayPack?.derivedPrice
                  : selectedPack?.derivedPrice ?? []
              }
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
