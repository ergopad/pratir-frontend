import React, { useState, useContext, useMemo, useEffect } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import {
  Grid,
  Button,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import OpenPacks from '@components/dialogs/OpenPacks';
import { WalletContext } from '@contexts/WalletContext';
import NftCardV2 from '@components/NftCardV2';
import UserMenu from '@components/user/UserMenu';
import { fetchAllSaleData } from '@utils/fetchSaleData';
import { trpc } from '@server/utils/trpc';
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Image from 'next/legacy/image'
import ViewCardsDialog from '@components/dialogs/ViewCardsDialog';
import { resolveIpfs } from '@utils/assets';

const randomInteger = (min: number, max: number) => {
  return (min + Math.random() * (max - min)).toFixed();
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await fetchAllSaleData();
    return {
      props: {
        data,
      },
      revalidate: 86400,
    };
  } catch (error) {
    console.error("Failed to fetch sale data:", error);
    throw new Error(`Failed to fetch sale data: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
};

interface ApiResponse {
  saleId: string;
  packId: string;
  packToken: string;
  amount: number;
}

interface PackRows {
  id: string;
  date: string;
  packName: string;
  image: string;
  status: "FULLFILLED" | "CONFIRMING" | "REFUNDED";
  // action: boolean;
  tokens: {
    list: [string, number][],
    packType: "common" | "uncommon" | "rare"
  };
}

interface OpenProps {
  data: ISale[];
}

const Open: NextPage<OpenProps> = ({ data }) => {
  const theme = useTheme();
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const {
    walletAddress,
    setAddWalletModalOpen,
    dAppWallet
  } = useContext(WalletContext);
  const [nftList, setNftList] = useState<IPackListItem[] | undefined>()
  const [selected, setSelected] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const [rows, setRows] = useState<PackRows[]>([])
  const [viewCardsOpen, setViewCardsOpen] = useState(false)
  const [cardsViewed, setCardsViewed] = useState<[string, number][]>([])
  const [selectedPackType, setSelectedPackType] = useState<"common" | "uncommon" | "rare">('common')
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 25,
    page: 0,
  });
  const [numberRows, setNumberRows] = useState(0)

  interface HistoryResponse {
    total: number;
    items: IPackTokenHistoryItem[]
  }

  const transactionApi = trpc.api.post.useMutation()
  const tokenInfo = trpc.api.getPackTokenMetadata.useMutation()
  useEffect(() => {
    interface Pack {
      saleId: string;
      packId: string;
      packToken: string;
      amount: number;
    }

    const getHistory = async (walletAddresses: string[], limit: number = 25, page: number = 0) => {
      setPageLoading(true)
      try {
        const body = {
          "addresses": walletAddresses,
          "sales": [process.env.BLITZ_SALE],
          "offset": page * limit,
          "limit": limit
        }

        // console.log(body)
        const res: HistoryResponse = await transactionApi.mutateAsync({
          url: "/order/history", body
        });

        // console.log(res)

        const uniqueTokenIds: string[] = [...new Set(res.items.filter((item: IPackTokenHistoryItem) => item.packToken !== undefined).map((item) => item.packToken))];
        // console.log(uniqueTokenIds)
        const tokenData = await tokenInfo.mutateAsync({ tokenIds: uniqueTokenIds })
        console.log(tokenData)
        setNumberRows(res.total)

        const rarityKeywords = ['Common', 'Uncommon', 'Rare'];
        type PackTypes = "common" | "uncommon" | "rare"

        const transformedRows: PackRows[] = res.items
          .filter(item => tokenData.some(token => token.tokenId === item.packToken)) // Keep only items with a matching token
          .map((item) => {
            const packName = tokenData.find((token) => token.tokenId === item.packToken)?.metadata.name || ''
            let packType: PackTypes = 'common'

            for (const rarity of rarityKeywords) {
              if (packName.includes(rarity)) {
                packType = rarity.toLowerCase() as PackTypes; // Returns the first match in lowercase
              }
            }

            return {
              id: item.id,
              date: item.created_at,
              packName,
              image: tokenData.find((token) => token.tokenId === item.packToken)?.metadata.link || '',
              status: item.status as "FULLFILLED" | "CONFIRMING" | "REFUNDED",
              // action: item.status === "FULLFILLED",
              tokens: {
                list: item.tokensBought,
                packType: packType
              }
            }
          });
        // console.log(transformedRows)
        setRows(transformedRows);
        setPageLoading(false)
        return res
      } catch (e: any) {
        setPageLoading(false)
        console.log(e);
      }
    };

    const getPacksAndExpand = async (walletAddresses: string[]) => {
      try {
        const body = {
          "addresses": walletAddresses,
          "sales": [process.env.BLITZ_SALE]
        }
        const res = await transactionApi.mutateAsync({
          url: `/sale/packtokens`,
          body
        });

        const packTokensDetails = await tokenInfo.mutateAsync({
          tokenIds: res.filter((token: ApiResponse) => token.saleId === process.env.BLITZ_SALE).map((pack: Pack) => pack.packToken)
        });

        // console.log(packTokensDetails)

        // Expand the pack tokens based on their amount
        const expandedPackList = res.flatMap((pack: Pack) => {
          // Find the matching token details
          const tokenDetails = packTokensDetails.find(detail => detail.tokenId === pack.packToken);
          // Duplicate the details based on amount
          if (tokenDetails) return Array.from({ length: pack.amount }, () => ({ ...tokenDetails, packId: pack.packId }))
          else return [];
        });

        setNftList(expandedPackList);
        setSelected(expandedPackList.map(() => false));
        setLoading(false);
      } catch (e) {
        console.error(e);
        throw e;
      }
    };

    if (process.env.BLITZ_SALE && walletAddress) {
      if (dAppWallet.connected === true) {
        getHistory(dAppWallet.addresses, paginationModel.pageSize, paginationModel.page)
        getPacksAndExpand(dAppWallet.addresses)
      }
      else {
        getHistory([walletAddress], paginationModel.pageSize, paginationModel.page)
        getPacksAndExpand([walletAddress])
      }
    }
  }, [dAppWallet, walletAddress, paginationModel.page, paginationModel.pageSize])

  const selectAll = () => {
    setSelected(prev => (
      prev.map(() => true)
    ))
  }

  const selectNone = () => {
    setSelected(prev => (
      prev.map(() => false)
    ))
  }

  // const getUserContents = trpc.api.getUsersWalletContents.useMutation()
  // const fetchData = async (addresses: string[]) => {
  //   const tokenList = await getUserContents.mutateAsync({ addresses });
  //   const packTokenList = tokenList.filter((token) => packTokenIds.includes(token.token_id))
  //   const packTokens = await tokenInfo.mutateAsync({ tokenIds: packTokenList.map(token => token.token_id) })
  //   const expandedNftList = packTokenList.flatMap(token => {
  //     // Find the matching token details from packTokens
  //     const tokenDetails = packTokens.find(detail => detail.tokenId === token.token_id);
  //     // Duplicate the details based on token_amount, ignoring token_amount in the final objects
  //     if (tokenDetails) return Array.from({ length: token.token_amount }, () => ({ ...tokenDetails }))
  //     else return []
  //   });
  //   setNftList(expandedNftList)
  //   setSelected(expandedNftList.map(() => {
  //     return false
  //   }))
  //   setLoading(false)
  // };

  // useEffect(() => {
  //   if (dAppWallet.connected === true) {
  //     fetchData(dAppWallet.addresses);
  //   }
  //   else fetchData([walletAddress])
  // }, [dAppWallet, walletAddress]);

  const rand = useMemo(() => randomInteger(1, 18), [1, 18]);

  const handleViewCards = (cards: [string, number][], packType: "common" | "uncommon" | "rare") => {
    setViewCardsOpen(true)
    setSelectedPackType(packType)
    setCardsViewed(cards)
  }

  const columns: GridColDef[] = [
    // {
    //   field: "id",
    //   headerName: "ID",
    //   width: 60,
    // },
    {
      field: "date",
      headerName: "Date Opened",
      type: "dateTime",
      width: 240,
      valueGetter: ({ value }) => value && new Date(value),
    },
    {
      field: "image",
      headerName: "",
      renderCell: (params) => (
        <Box sx={{
          width: '36px',
          height: '36px',
          overflow: 'hidden',
          display: 'inline-block',
          position: 'relative',
          mx: 'auto'
        }}>
          {params.value && <Image
            src={resolveIpfs(params.value)}
            layout="fill"
            alt="nft-image"
            style={{ objectFit: 'cover' }}
          />}
        </Box>
      ),
      width: 40,
    },
    {
      field: "packName",
      headerName: "Pack Name",
      renderCell: (params) => (
        <Box>
          {params.value}
        </Box>
      ),
      flex: 1,
      minWidth: 170,
    },
    // {
    //   field: "edition",
    //   headerName: "Edition",
    //   renderCell: (params) => (
    //     <>
    //       <Link href={"/collections/" + stringToUrl(params.value)}>
    //         {params.value}
    //       </Link>
    //     </>
    //   ),
    //   flex: 1,
    //   minWidth: 200,
    // },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      renderCell: (params) => {
        return (
          <>
            <Alert
              icon={false}
              sx={{ mb: 0, width: "100%", '&:before': { background: 'none', padding: 0 } }}
              severity={params.value === 'FULLFILLED' || params.value === 'FULLFILLING' ? 'success' : params.value === 'REFUNDED' ? 'error' : 'warning'}
            >
              {params.value.charAt(0).toUpperCase() + params.value.slice(1).toLowerCase()}
            </Alert>
          </>
        );
      },
    },
    {
      field: "tokens",
      headerName: "Action",
      renderCell: (params) => {
        if (params.value.list.length > 0) {
          return (
            <>
              <Button
                disabled={!params.value}
                variant="contained"
                onClick={() => handleViewCards(params.value.list, params.value.packType)}
              >
                View Cards
              </Button>
            </>
          );
        }
        else return <></>
      },
      width: 140,
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ maxWidth: '800px' }}>
          <Typography variant="h2">
            Your Packs
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            order: { sm: 3, xs: 2 },
          }}
        >
          <UserMenu />
        </Box>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Unopened Packs
            </Typography>
          </Box>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            order: { sm: 2, xs: 3 },
          }}>
            <Button
              size="small"
              variant="text"
              sx={{ mr: '6px' }}
              onClick={() => selectAll()}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="text"
              sx={{ mr: '6px' }}
              onClick={() => selectNone()}
            >
              Select None
            </Button>
            <Button
              size="small"
              variant="text"
              disabled={selected.filter(item => item === true).length < 1}
              onClick={() => setConfirmationOpen(true)}
            >
              Open Selected
            </Button>
          </Box>
        </Box>
        {!walletAddress
          ? <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" sx={{ mb: '12px' }}>
              You must connect a wallet to use this feature.
            </Typography>
            <Button variant="contained" onClick={() => setAddWalletModalOpen(true)}>
              Connect Now
            </Button>
          </Box>
          : loading
            ? <Box sx={{ textAlign: 'center', py: '10vh', width: '100%' }}>
              <CircularProgress />
            </Box>
            : walletAddress !== '' && nftList && nftList.length > 0
              ? <Grid
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
                  )
                })}
              </Grid>
              : <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" color="text.secondary">
                  You don&apos;t have any unopened packs.
                </Typography>
              </Box>

        }
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Opened Packs
          </Typography>
        </Box>
      </Box>
      <Box>
        {rows
          ? <Paper sx={{ width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={pageLoading}
              autoHeight
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pagination
              paginationMode="server"
              rowCount={numberRows}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 25,
                  },
                },
              }}
              // rowHeight={64}
              disableColumnMenu
              disableRowSelectionOnClick
              sx={{
                border: "none",
                mb: 0,
                "& .MuiDataGrid-row": {
                  "&:hover": {
                    background: theme.palette.divider,
                    // cursor: 'pointer',
                  },
                },
                "& .MuiDataGrid-cell": {
                  "&:focus": {
                    outline: "none",
                  },
                  "&:first-of-type": {
                    pl: 2,
                  },
                  "&:last-child": {
                    pr: 2,
                  },
                },
                "& .MuiDataGrid-columnHeader": {
                  "&:focus": {
                    outline: "none",
                  },
                  "&:first-of-type": {
                    pl: 2,
                  },
                  "&:last-child": {
                    pr: 2,
                  },
                },
              }}
            />
          </Paper>
          : <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h4" color="text.secondary">
              You haven&apos;t opened any packs yet.
            </Typography>
          </Box>
        }</Box>
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography>To self-validate card token rarity spreads, you can review the <a href="https://tinyurl.com/blitz-tcg-rarity-validation" target="_blank" rel="noreferrer" style={{ color: theme.palette.primary.main }}>pack opening test metrics</a>.</Typography>
      </Box>
      {nftList &&
        <OpenPacks
          open={confirmationOpen}
          setOpen={setConfirmationOpen}
          saleListData={data}
          setPackList={setNftList}
          setSelectedPacks={setSelected}
          packs={nftList.filter((_item, i) => selected[i] === true).map((item) => {
            const data = item.metadata
            return (
              {
                name: data.name,
                collection: data.collection ? data.collection : undefined,
                artist: '', // need to implement getArtist()
                imgUrl: data.link ? resolveIpfs(data.link) : `/images/placeholder/${rand}.jpg`,
                tokenId: item.tokenId
              }
            )
          })}
        />
      }
      <ViewCardsDialog
        open={viewCardsOpen}
        setOpen={setViewCardsOpen}
        cards={cardsViewed}
        packType={selectedPackType}
      />
    </>
  )
}

export default Open