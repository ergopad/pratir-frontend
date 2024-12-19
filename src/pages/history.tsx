import { useState, useContext, useMemo, useEffect } from "react";
import type { NextPage } from "next";
import { Button, Typography, Box, Paper, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { WalletContext } from "@contexts/WalletContext";
import { trpc } from "@server/utils/trpc";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import ViewCardsDialog from "@components/dialogs/ViewCardsDialog";
import { resolveIpfs } from "@utils/assets";
import AppBar from "@components/AppBar";

const randomInteger = (min: number, max: number) => {
  return (min + Math.random() * (max - min)).toFixed();
};

interface PackRows {
  id: string;
  date: string;
  packName: string;
  image: string;
  status: "FULLFILLED" | "CONFIRMING" | "REFUNDED";
  // action: boolean;
  tokens: {
    list: [string, number][];
    packType: "common" | "uncommon" | "rare";
  };
}

const Open: NextPage = ({}) => {
  const theme = useTheme();
  const { walletAddress, dAppWallet } = useContext(WalletContext);
  const [pageLoading, setPageLoading] = useState(true);
  const [rows, setRows] = useState<PackRows[]>([]);
  const [viewCardsOpen, setViewCardsOpen] = useState(false);
  const [cardsViewed, setCardsViewed] = useState<[string, number][]>([]);
  const [selectedPackType, setSelectedPackType] = useState<
    "common" | "uncommon" | "rare"
  >("common");
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 25,
    page: 0,
  });
  const [numberRows, setNumberRows] = useState(0);

  interface HistoryResponse {
    total: number;
    items: IPackTokenHistoryItem[];
  }

  const transactionApi = trpc.api.post.useMutation();
  const tokenInfo = trpc.api.getPackTokenMetadata.useMutation();

  useEffect(() => {
    const getHistory = async (
      walletAddresses: string[],
      limit: number = 25,
      page: number = 0
    ) => {
      setPageLoading(true);
      try {
        const body = {
          addresses: walletAddresses,
          sales: [process.env.BLITZ_SALE],
          offset: page * limit,
          limit: limit,
        };

        // console.log(body)
        const res: HistoryResponse = await transactionApi.mutateAsync({
          url: "/order/history",
          body,
        });

        // console.log(res)

        const uniqueTokenIds: string[] = [
          ...new Set(
            res.items
              .filter(
                (item: IPackTokenHistoryItem) => item.packToken !== undefined
              )
              .map((item) => item.packToken)
          ),
        ];
        // console.log(uniqueTokenIds)
        const tokenData = await tokenInfo.mutateAsync({
          tokenIds: uniqueTokenIds,
        });
        // console.log(tokenData);
        setNumberRows(res.total);

        const rarityKeywords = ["Common", "Uncommon", "Rare"];
        type PackTypes = "common" | "uncommon" | "rare";

        const transformedRows: PackRows[] = res.items
          .filter((item) =>
            tokenData.some((token) => token.tokenId === item.packToken)
          ) // Keep only items with a matching token
          .map((item) => {
            const packName =
              tokenData.find((token) => token.tokenId === item.packToken)
                ?.metadata.name || "";
            let packType: PackTypes = "common";

            for (const rarity of rarityKeywords) {
              if (packName.includes(rarity)) {
                packType = rarity.toLowerCase() as PackTypes; // Returns the first match in lowercase
              }
            }

            return {
              id: item.id,
              date: item.created_at,
              packName,
              image:
                tokenData.find((token) => token.tokenId === item.packToken)
                  ?.metadata.link || "",
              status: item.status as "FULLFILLED" | "CONFIRMING" | "REFUNDED",
              // action: item.status === "FULLFILLED",
              tokens: {
                list: item.tokensBought,
                packType: packType,
              },
            };
          });
        // console.log(transformedRows)
        setRows(transformedRows);
        setPageLoading(false);
        return res;
      } catch (e: any) {
        setPageLoading(false);
        console.error(e);
      }
    };

    if (process.env.BLITZ_SALE && walletAddress) {
      if (dAppWallet.connected === true) {
        getHistory(
          dAppWallet.addresses,
          paginationModel.pageSize,
          paginationModel.page
        );
      } else {
        getHistory(
          [walletAddress],
          paginationModel.pageSize,
          paginationModel.page
        );
      }
    }
  }, [
    dAppWallet,
    walletAddress,
    paginationModel.page,
    paginationModel.pageSize,
  ]);

  const rand = useMemo(() => randomInteger(1, 18), [1, 18]);

  const handleViewCards = (
    cards: [string, number][],
    packType: "common" | "uncommon" | "rare"
  ) => {
    setViewCardsOpen(true);
    setSelectedPackType(packType);
    setCardsViewed(cards);
  };

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
        <Box
          sx={{
            width: "36px",
            height: "36px",
            overflow: "hidden",
            display: "inline-block",
            position: "relative",
            mx: "auto",
          }}
        >
          {params.value && (
            <img
              src={resolveIpfs(params.value)}
              alt="nft-image"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
              }}
            />
          )}
        </Box>
      ),
      width: 40,
    },
    {
      field: "packName",
      headerName: "Pack Name",
      renderCell: (params) => <Box>{params.value}</Box>,
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
              sx={{
                mb: 0,
                width: "100%",
                "&:before": { background: "none", padding: 0 },
              }}
              severity={
                params.value === "FULLFILLED" || params.value === "FULLFILLING"
                  ? "success"
                  : params.value === "REFUNDED"
                  ? "error"
                  : "warning"
              }
            >
              {params.value.charAt(0).toUpperCase() +
                params.value.slice(1).toLowerCase()}
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
                onClick={() =>
                  handleViewCards(params.value.list, params.value.packType)
                }
              >
                View Cards
              </Button>
            </>
          );
        } else return <></>;
      },
      width: 140,
    },
  ];

  return (
    <>
      <AppBar title="Pack History" />

      <Box>
        {rows ? (
          <Paper sx={{ width: "100%" }}>
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
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="h4" color="text.secondary">
              You haven&apos;t opened any packs yet.
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ textAlign: "center", p: 2 }}>
        <Typography>
          To self-validate card token rarity spreads, you can review the{" "}
          <a
            href="https://tinyurl.com/blitz-tcg-rarity-validation"
            target="_blank"
            rel="noreferrer"
            style={{ color: theme.palette.primary.main }}
          >
            pack opening test metrics
          </a>
          .
        </Typography>
      </Box>

      <ViewCardsDialog
        open={viewCardsOpen}
        setOpen={setViewCardsOpen}
        cards={cardsViewed}
        packType={selectedPackType}
      />
    </>
  );
};

export default Open;
