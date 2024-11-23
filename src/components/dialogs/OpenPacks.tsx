import React, { FC, useState, useContext } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Image from "next/legacy/image";
import { Box, useTheme, useMediaQuery, Collapse, Button } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import { WalletContext } from "@contexts/WalletContext";
import { useAlert } from "@contexts/AlertContext";
import {
  BootstrapDialog,
  BootstrapDialogTitle,
} from "@components/StyledComponents/BootstrapDialog";
import ProcessPackOpening from "@components/ProcessPackOpening";
import { resolveIpfs } from "@utils/assets";

interface IOpenPacksProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  packs: {
    name: string;
    collection?: string;
    artist: string;
    imgUrl: string;
    tokenId: string;
  }[];
  saleListData: ISale[];
  setPackList: React.Dispatch<
    React.SetStateAction<IPackListItem[] | undefined>
  >;
  setSelectedPacks: React.Dispatch<React.SetStateAction<boolean[]>>;
}

interface IToken {
  tokenId: string;
  qty: number;
}

const findObjectByTokenId = (array: ISale[], tokenId: string) => {
  for (let i = 0; i < array.length; i++) {
    const obj = array[i];
    for (let j = 0; j < obj.packs.length; j++) {
      const pack = obj.packs[j];
      for (let k = 0; k < pack.price.length; k++) {
        const price = pack.price[k];
        if (price.tokenId === tokenId) {
          return {
            saleId: obj.id,
            packId: pack.id,
          };
        }
      }
    }
  }
  return null;
};

const OpenPacks: FC<IOpenPacksProps> = ({
  open,
  setOpen,
  packs,
  saleListData,
  setPackList,
  setSelectedPacks,
}) => {
  const { walletAddress, dAppWallet } = useContext(WalletContext);
  const { addAlert } = useAlert();
  const [order, setOrder] = useState<IOrder | undefined>(undefined);

  const buildOrder = async (tokenIdArray: IToken[]): Promise<IOrder> => {
    const fetchSaleData = async (
      tokenIds: IToken[]
    ): Promise<IOrderRequests[]> => {
      const saleList = saleListData;
      const orderRequests: IOrderRequests[] = [];
      tokenIds.forEach((tokenIdObj) => {
        const tokenId = tokenIdObj.tokenId;
        const count = tokenIdObj.qty;
        const sale = findObjectByTokenId(saleList, tokenId);
        if (sale) {
          const saleId = sale.saleId;
          let orderRequest = orderRequests.find(
            (request) => request.saleId === saleId
          );
          if (!orderRequest) {
            orderRequest = {
              saleId: saleId,
              packRequests: [],
            };
            orderRequests.push(orderRequest);
          }
          orderRequest.packRequests.push({
            packId: sale.packId,
            count: count,
            currencyTokenId: tokenId,
          });
        }
      });
      return orderRequests;
    };
    const reduceSaleList = await fetchSaleData(tokenIdArray);
    let walletArray = [];
    if (dAppWallet.connected === true) {
      walletArray = dAppWallet.addresses;
    } else walletArray = [walletAddress];
    return {
      targetAddress: walletArray[0],
      userWallet: walletArray,
      txType: "EIP-12",
      requests: reduceSaleList,
    };
  };

  const submit = async () => {
    try {
      const tokenIds = packs.reduce(
        (accumulator: { [key: string]: number }, current) => {
          if (current.tokenId in accumulator) {
            accumulator[current.tokenId] += 1;
          } else {
            accumulator[current.tokenId] = 1;
          }
          return accumulator;
        },
        {}
      );

      const tokenArray = Object.entries(tokenIds).map(([tokenId, qty]) => ({
        tokenId,
        qty,
      }));
      // console.log(tokenArray)
      const order = await buildOrder(tokenArray);

      if (order.requests.length > 0) {
        setOrder(order);
      } else {
        addAlert("error", "Not built correctly");
        // console.log(order);
      }
    } catch (e: any) {
      addAlert("error", e);
      console.error(e);
    }
  };

  const handleClose = () => {
    setOrder(undefined);
    setOpen(false);
  };

  const theme = useTheme();
  // const extraSmall = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        // fullScreen={extraSmall}
        theme={theme}
        sx={{ mt: "102px" }}
      >
        <BootstrapDialogTitle
          id="customized-dialog-title"
          onClose={handleClose}
        >
          Open Packs
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Collapse in={!order}>
            {packs.map((item, i) => {
              return (
                <Grid2
                  container
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    width: "100%",
                    p: "12px",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                  key={i}
                >
                  <Grid2 xs="auto">
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        overflow: "hidden",
                        display: "inline-block",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={resolveIpfs(item.imgUrl)}
                        layout="fill"
                        alt="nft-image"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </Grid2>
                  <Grid2 xs>
                    <Typography sx={{ fontWeight: "700" }}>
                      {item.name}
                    </Typography>
                    {/* {item.collection && (
                      <Typography>
                        {item.collection}
                      </Typography>
                    )} */}
                    <Typography>{item.artist}</Typography>
                  </Grid2>
                </Grid2>
              );
            })}
          </Collapse>
          <Collapse in={!!order} mountOnEnter unmountOnExit>
            <ProcessPackOpening
              order={order}
              setPackList={setPackList}
              setSelectedPacks={setSelectedPacks}
            />
          </Collapse>
        </DialogContent>
        <DialogActions
          sx={{
            display: !order ? "block" : "none",
          }}
        >
          <Button
            autoFocus
            fullWidth
            onClick={submit}
            variant="contained"
            // loading={!getSaleList.isFetched}
          >
            Confirm Open
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
};

export default OpenPacks;
