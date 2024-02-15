import React, { FC, useState, useContext, useEffect } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import Link from '@components/Link';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { getErgoWalletContext } from "@components/wallet/AddWallet";
import { WalletContext } from '@contexts/WalletContext';
import { useAlert } from '@contexts/AlertContext';
import { trpc } from '@server/utils/trpc';
import { BootstrapDialog, BootstrapDialogTitle } from '@components/StyledComponents/BootstrapDialog';
import ProcessTransaction from '@components/ProcessTransaction';


interface IOpenPacksProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  packs: {
    name: string;
    collection?: string;
    artist: string;
    imgUrl: string;
    tokenId: string;
  }[]
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
            packId: pack.id
          }
        }
      }
    }
  }
  return null; // return null if tokenId is not found in any object
}

const OpenPacks: FC<IOpenPacksProps> = ({ open, setOpen, packs }) => {
  const {
    walletAddress,
    dAppWallet
  } = useContext(WalletContext);
  const { addAlert } = useAlert();
  const getSaleList = trpc.api.get.useQuery(
    { url: "/sale" }
  )
  const [order, setOrder] = useState<IOrder | undefined>(undefined)

  const buildOrder = async (tokenIdArray: IToken[]): Promise<IOrder> => {
    const fetchSaleData = async (tokenIds: IToken[]): Promise<IOrderRequests[]> => {
      const saleList = getSaleList.data
      const orderRequests: IOrderRequests[] = [];
      tokenIds.forEach((tokenIdObj) => {
        const tokenId = tokenIdObj.tokenId;
        const count = tokenIdObj.qty;
        const sale = findObjectByTokenId(saleList, tokenId)
        if (sale) {
          const saleId = sale.saleId;
          let orderRequest = orderRequests.find((request) => request.saleId === saleId);
          if (!orderRequest) {
            orderRequest = {
              saleId: saleId,
              packRequests: []
            };
            orderRequests.push(orderRequest);
          }
          orderRequest.packRequests.push({
            packId: sale.packId,
            count: count,
            currencyTokenId: tokenId
          });
        }
      });
      return orderRequests;
    }
    if (getSaleList.isFetched) {
      const reduceSaleList = await fetchSaleData(tokenIdArray);
      let walletArray = []
      if (dAppWallet.connected === true) {
        walletArray = dAppWallet.addresses
      }
      else walletArray = [walletAddress]
      return {
        targetAddress: walletArray[0],
        userWallet: walletArray,
        txType: "EIP-12",
        requests: reduceSaleList
      }
    } else if (getSaleList.isLoading) {
      addAlert('warning', 'Data loading, please try again');
    } else throw Error
  }

  const submit = async () => {
    try {
      const tokenIds = packs.reduce((accumulator: { [key: string]: number }, current) => {
        if (current.tokenId in accumulator) {
          accumulator[current.tokenId] += 1;
        } else {
          accumulator[current.tokenId] = 1;
        }
        return accumulator;
      }, {});

      const tokenArray = Object.entries(tokenIds).map(([tokenId, qty]) => ({ tokenId, qty }));

      const order = await buildOrder(tokenArray)

      if (order.requests.length > 0) {
        setOrder(order)
      }
      else {
        addAlert('error', 'Not built correctly');
      }
    } catch (e: any) {
      addAlert('error', e);
      console.error(e);
    }
  }

  const handleClose = () => {
    setOrder(undefined)
    setOpen(false);
  };

  const theme = useTheme()
  const extraSmall = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullScreen={extraSmall}
        theme={theme}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
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
                    width: '100%',
                    p: '12px',
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                  key={i}
                >
                  <Grid2 xs="auto">
                    <div style={{ width: '48px', height: '48px', overflow: 'hidden', display: 'inline-block', position: 'relative' }}>
                      <Image
                        src={item.imgUrl}
                        layout="fill"
                        alt="nft-image"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </Grid2>
                  <Grid2 xs>
                    <Typography sx={{ fontWeight: '700' }}>
                      {item.name}
                    </Typography>
                    {item.collection && (
                      <Typography>
                        {item.collection}
                      </Typography>
                    )}
                    <Typography>
                      {item.artist}
                    </Typography>
                  </Grid2>
                </Grid2>
              )
            })}
          </Collapse>
          <Collapse in={!!order} mountOnEnter unmountOnExit>
            <ProcessTransaction
              order={order}
            />
          </Collapse>
        </DialogContent>
        <DialogActions sx={{
          display: !order ? 'block' : 'none'
        }}>
          <Button autoFocus fullWidth onClick={submit} variant="contained">
            Confirm Open
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}

export default OpenPacks;