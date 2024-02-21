import React, { useState, useContext, useMemo, useEffect } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import {
  Grid,
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import OpenPacks from '@components/dialogs/OpenPacks';
import { WalletContext } from '@contexts/WalletContext';
import NftCard from '@components/NftCard2';
import { getWalletList, tokenListInfo } from "@lib/utilities/assetsNew";
import UserMenu from '@components/user/UserMenu';
import { fetchAllSaleData } from '@utils/fetchSaleData';
import { trpc } from '@server/utils/trpc';
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { fetchMetadataForTokenIds } from '@server/utils/cruxApi';
import Image from 'next/image';

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

interface PackRows {
  id: string;
  date: string;
  packName: string;
  image: string;
  status: "FULLFILLED" | "CONFIRMING";
  action: boolean;
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
  const [nftList, setNftList] = useState<any[] | undefined>()
  const [selected, setSelected] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)
  const [openedPacks, setOpenedPacks] = useState<IPackTokenHistoryItem[]>([])
  const [rows, setRows] = useState<PackRows[]>([])

  const transactionApi = trpc.api.post.useMutation()
  const tokenInfo = trpc.api.getPackTokenMetadata.useMutation()
  useEffect(() => {
    const getHistory = async () => {
      try {
        const res: IPackTokenHistoryItem[] = await transactionApi.mutateAsync({
          url: "/order/history", body: {
            "addresses": [walletAddress],
            "sales": [process.env.BLITZ_SALE],
            "offset": 0,
            "limit": 10
          }
        });
        console.log(res)

        const uniqueTokenIds: string[] = [...new Set(res.filter((item: IPackTokenHistoryItem) => item.packToken !== undefined).map((item) => item.packToken))];
        const tokenData = await tokenInfo.mutateAsync({ tokenIds: uniqueTokenIds })

        const transformedRows: PackRows[] = res.map((item) => ({
          id: item.id,
          date: item.created_at,
          packName: tokenData.find((token) => token.tokenId === item.packToken)?.metadata.name || '',
          image: tokenData.find((token) => token.tokenId === item.packToken)?.metadata.link || '',
          status: item.status as "FULLFILLED" | "CONFIRMING",
          action: item.status === "FULLFILLED"
        }));

        setRows(transformedRows);
        return res
      } catch (e: any) {
        throw e;
      }
    };
    const getPacks = async () => {
      try {
        const res = await transactionApi.mutateAsync({
          url: `/sale/packtokens`, body: {
            "addresses": [walletAddress],
            "sales": [process.env.BLITZ_SALE]
          }
        });
        console.log(res)
        return res
      } catch (e: any) {
        throw e;
      }
    };

    if (walletAddress && process.env.BLITZ_SALE) {
      getHistory()
      getPacks()
    }
  }, [walletAddress])

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

  interface ObjectWithQty {
    [key: string]: any;
    qty: number;
  }

  function expandArrayObjects<T extends ObjectWithQty>(arr: T[]): T[] {
    return ([] as T[]).concat(...arr.map(obj => {
      let repeatedObjs = Array(obj.amount).fill({} as T);
      Object.keys(obj).forEach(key => {
        repeatedObjs.forEach((repeatedObj, i) => {
          repeatedObj[key] = obj[key];
        });
      });
      return repeatedObjs;
    }));
  }

  const fetchData = async (addresses: any[]) => {
    const tokenList: any[] = await getWalletList(addresses);
    const additionalData = await tokenListInfo(tokenList);
    const packTokenList = additionalData.filter((item) => item.type === 'PACK')
    const expandedList = expandArrayObjects(packTokenList)
    setNftList(expandedList)
    setSelected(expandedList.map(() => {
      return false
    }))
    setLoading(false)
  };

  useEffect(() => {
    if (dAppWallet.connected === true) {
      fetchData(dAppWallet.addresses);
    }
    else fetchData([walletAddress])
  }, [dAppWallet, walletAddress]);

  const rand = useMemo(() => randomInteger(1, 18), [1, 18]);

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
      headerName: "Image",
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
            src={params.value}
            layout="fill"
            alt="nft-image"
            style={{ objectFit: 'cover' }}
          />}
        </Box>
      ),
      minWidth: 100,
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
      width: 220,
      renderCell: (params) => {
        const setSeverity = (input: string) => {
          if (input === "CONFIRMING") return "warning";
          if (input === "FULLFILLED") return "success";
        };
        return (
          <>
            <Alert
              sx={{ mb: 0, width: "100%", '&:before': { background: 'none', padding: 0 } }}
              severity={setSeverity(params.value)}
            >
              {params.value}
            </Alert>
          </>
        );
      },
    },
    {
      field: "action",
      headerName: "Action",
      renderCell: (params) => {
        if (params.value !== undefined) {
          return (
            <>
              <Button
                disabled={!params.value}
                variant="contained"
                onClick={() => { }}
              >
                View Cards
              </Button>
            </>
          );
        }
      },
      width: 140,
    },
  ];

  return (
    <>
      <Container sx={{ py: 2 }}>
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
          {loading
            ? <Box sx={{ textAlign: 'center', py: '10vh', width: '100%' }}>
              <CircularProgress />
            </Box>
            : walletAddress !== '' && nftList && nftList.length > 0
              ? <Grid
                container
                spacing={2}
                columns={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
              >
                {nftList.map((item: any, i: number) => {
                  return (
                    <Grid key={i} item xs={1}>
                      <NftCard
                        nftData={item}
                        index={i}
                        selected={selected}
                        setSelected={setSelected}
                      />
                    </Grid>
                  )
                })}
              </Grid>
              : walletAddress !== '' && nftList && nftList.length === 0
                ? <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" color="text.secondary">
                    You don&apos;t have any unopened packs.
                  </Typography>
                </Box>
                : <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" sx={{ mb: '12px' }}>
                    You must connect a wallet to use this feature.
                  </Typography>
                  <Button variant="contained" onClick={() => setAddWalletModalOpen(true)}>
                    Connect Now
                  </Button>
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
                //disableColumnMenu
                autoHeight
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
      </Container>

      {nftList &&
        <OpenPacks
          open={confirmationOpen}
          setOpen={setConfirmationOpen}
          saleListData={data}
          packs={nftList.filter((_item, i) => selected[i] === true).map((item) => {
            return (
              {
                name: item.name,
                collection: item.collection ? item.collection : undefined,
                artist: '', // need to implement getArtist()
                imgUrl: item.imgUrl ? item.imgUrl : `/images/placeholder/${rand}.jpg`,
                tokenId: item.tokenId
              }
            )
          })}
        />
      }
    </>
  )
}

export default Open