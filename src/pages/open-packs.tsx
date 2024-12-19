import { useState, useContext, useMemo, useEffect } from "react";
import type { GetStaticProps, NextPage } from "next";
import { Grid, Button, Typography, Box, CircularProgress } from "@mui/material";
import OpenPacks from "@components/dialogs/OpenPacks";
import { WalletContext } from "@contexts/WalletContext";
import NftCardV2 from "@components/NftCardV2";
import { fetchAllSaleDataNew } from "@utils/fetchSaleData";
import { trpc } from "@server/utils/trpc";
import { resolveIpfs } from "@utils/assets";
import AppBar from "@components/AppBar";
import { fetchMetadataForTokenIds } from "@server/utils/cruxApi";

const randomInteger = (min: number, max: number) => {
  return (min + Math.random() * (max - min)).toFixed();
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await fetchAllSaleDataNew();
    return {
      props: {
        data,
      },
      revalidate: 86400,
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

interface ApiResponse {
  saleId: string;
  packId: string;
  packToken: string;
  amount: number;
}

interface OpenProps {
  data: SaleData;
}

const Open: NextPage<OpenProps> = ({ data }) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const { walletAddress, setAddWalletModalOpen, dAppWallet } =
    useContext(WalletContext);
  const [nftList, setNftList] = useState<IPackListItem[] | undefined>();
  const [selected, setSelected] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);

  const transactionApi = trpc.api.post.useMutation();

  useEffect(() => {
    interface Pack {
      saleId: string;
      packId: string;
      packToken: string;
      amount: number;
    }

    const getPacksAndExpand = async (walletAddresses: string[]) => {
      try {
        const body = {
          addresses: walletAddresses,
          sales: [process.env.BLITZ_SALE],
        };
        const res = await transactionApi.mutateAsync({
          url: `/sale/packtokens`,
          body,
        });

        const packTokensDetails = await fetchMetadataForTokenIds(
          res
            .filter(
              (token: ApiResponse) => token.saleId === process.env.BLITZ_SALE
            )
            .map((pack: Pack) => pack.packToken)
        );

        // console.log(packTokensDetails);

        // Expand the pack tokens based on their amount
        const expandedPackList = res.flatMap((pack: Pack) => {
          // Find the matching token details
          const tokenDetails = packTokensDetails.find(
            (detail) => detail.tokenId === pack.packToken
          );
          // Duplicate the details based on amount
          if (tokenDetails)
            return Array.from({ length: pack.amount }, () => ({
              ...tokenDetails,
              packId: pack.packId,
            }));
          else return [];
        });

        setNftList(expandedPackList);
        setSelected(expandedPackList.map(() => false));
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    if (process.env.BLITZ_SALE && walletAddress) {
      if (dAppWallet.connected === true) {
        getPacksAndExpand(dAppWallet.addresses);
      } else {
        getPacksAndExpand([walletAddress]);
      }
    }
  }, [dAppWallet, walletAddress]);

  const selectAll = () => {
    setSelected((prev) => prev.map(() => true));
  };

  const selectNone = () => {
    setSelected((prev) => prev.map(() => false));
  };

  const rand = useMemo(() => randomInteger(1, 18), [1, 18]);

  return (
    <>
      <AppBar title="Unopened Packs" />
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1,
              width: { xs: "100%", sm: "auto" },
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              order: { sm: 2, xs: 3 },
            }}
          >
            <Button
              size="small"
              variant="text"
              sx={{ mr: "6px" }}
              onClick={() => selectAll()}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="text"
              sx={{ mr: "6px" }}
              onClick={() => selectNone()}
            >
              Select None
            </Button>
            <Button
              size="small"
              variant="text"
              disabled={selected.filter((item) => item === true).length < 1}
              onClick={() => setConfirmationOpen(true)}
            >
              Open Selected
            </Button>
          </Box>
        </Box>
        {!walletAddress ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body2" sx={{ mb: "12px" }}>
              You must connect a wallet to use this feature.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setAddWalletModalOpen(true)}
            >
              Connect Now
            </Button>
          </Box>
        ) : loading ? (
          <Box sx={{ textAlign: "center", py: "10vh", width: "100%" }}>
            <CircularProgress />
          </Box>
        ) : walletAddress !== "" && nftList && nftList.length > 0 ? (
          <Grid
            container
            spacing={2}
            columns={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          >
            {nftList.map((item: IPackListItem, i: number) => {
              return (
                <Grid key={i} item xs={1}>
                  <NftCardV2
                    nftData={item}
                    index={i}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="h6" color="text.secondary">
              You don&apos;t have any unopened packs.
            </Typography>
          </Box>
        )}
      </Box>

      {nftList && (
        <OpenPacks
          open={confirmationOpen}
          setOpen={setConfirmationOpen}
          saleListData={data}
          setPackList={setNftList}
          setSelectedPacks={setSelected}
          packs={nftList
            .filter((_item, i) => selected[i] === true)
            .map((item) => {
              const data = item.metadata;
              return {
                name: data.name,
                collection: data.collection ? data.collection : undefined,
                artist: "", // need to implement getArtist()
                imgUrl: data.link
                  ? resolveIpfs(data.link)
                  : `/images/placeholder/${rand}.jpg`,
                tokenId: item.tokenId,
              };
            })}
        />
      )}
    </>
  );
};

export default Open;
