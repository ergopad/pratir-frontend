import React, { FC, useState, useContext, useEffect } from 'react';
import {
  useTheme,
  useMediaQuery,
  Collapse,
  Button,
  DialogActions,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { WalletContext } from '@contexts/WalletContext';
import ProcessTransaction from '@components/ProcessTransaction';
import { BootstrapDialog, BootstrapDialogTitle } from '@components/StyledComponents/BootstrapDialog';

interface IConfirmPurchaseProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tokenName: string;
  qty: number;
  openNow?: boolean;
  price: number;
  currency: string;
  isBid?: boolean;
  saleId: string;
  packId: string;
}

const ConfirmPurchase: FC<IConfirmPurchaseProps> = ({
  open, setOpen, saleId, packId, tokenName, qty, openNow, price, currency, isBid
}) => {
  const {
    walletAddress,
    dAppWallet
  } = useContext(WalletContext);
  const [order, setOrder] = useState<IOrder | undefined>(undefined)

  const buildOrder = (): IOrder => {
    let walletArray = []
    if (dAppWallet.connected === true) {
      walletArray = dAppWallet.addresses
    }
    else walletArray = [walletAddress]
    return {
      targetAddress: walletArray[0],
      userWallet: walletArray,
      txType: "EIP-12",
      requests: [{
        saleId: saleId,
        packRequests: [
          {
            packId: packId,
            count: qty,
            currencyTokenId: currency === "Erg" ? "0000000000000000000000000000000000000000000000000000000000000000" : currency === "SigUSD" ? "03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04" : "BLITZTOKENID"
          }]
      }]
    }
  }

  const submit = () => {
    const thisOrder = buildOrder()
    setOrder(thisOrder)
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
        maxWidth={'xs'}
        theme={theme}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
          Confirm Purchase
        </BootstrapDialogTitle>
        <DialogContent dividers sx={{ minHeight: '200px' }}>
          <Collapse in={!order}>
            <Table
              sx={{
                minWidth: 'auto',
              }}
              aria-label="Order Summary"
            >
              <TableBody
                sx={{
                  '& .MuiTableCell-root': {
                    borderBottom: 'none',
                    p: '6px 0',
                  },
                }}
              >
                <TableRow>
                  <TableCell>Name: </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{tokenName}</TableCell>
                </TableRow>
                {qty && (
                  <TableRow>
                    <TableCell>Quantity: </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{qty}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>{isBid ? 'Your Bid: ' : 'Total Price: '}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {price + ' ' + currency}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {openNow !== undefined && (
              <Typography variant="body2" sx={{ mb: 0, mt: '24px' }}>
                {openNow ? (
                  'Note: You have chosen to open the packs right away. You will receive the NFTs immediately and not be sent pack tokens. '
                ) : (
                  "Note:  You have chosen to receive the pack tokens to your wallet, and will be able to open them when you're ready, or trade them. "
                )}
              </Typography>
            )}
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
            Confirm Purchase
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}

export default ConfirmPurchase;