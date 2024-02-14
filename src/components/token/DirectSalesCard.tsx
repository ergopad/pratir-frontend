import React, { FC, useState, useEffect, useContext } from 'react';
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
  Button
} from '@mui/material'
import NumberIncrement from '@components/forms/NumberIncrement';
import ConfirmPurchase from '@components/dialogs/ConfirmPurchase';
import { IDerivedPrice } from '@components/sales/MintSaleInfo';
import { WalletContext } from '@contexts/WalletContext';

export interface IDirectSalesCardProps {
  tokenName: string;
  openNow?: boolean | undefined;
  setOpenNow?: React.Dispatch<React.SetStateAction<boolean>>;
  price: number;
  currency: string;
  saleId: string;
  packId: string;
  soldOut: boolean;
  status: string;
  startTime: string;
  endTime: string;
  derivedPrices: IDerivedPrice[]
}

const DirectSalesCard: FC<IDirectSalesCardProps> = (props) => {
  const {
    tokenName,
    openNow,
    setOpenNow,
    price,
    currency,
    saleId,
    packId,
    soldOut,
    status,
    startTime,
    endTime,
    derivedPrices
  } = props
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))
  // const [openNow, setOpenNow] = useState<boolean | undefined>(props.openNow ? false : undefined)
  const [numberSold, setNumberSold] = useState<number>(1)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)
  const [purchaseCurrency, setPurchaseCurrency] = useState('Erg')

  const {
    walletAddress,
    setAddWalletModalOpen
  } = useContext(WalletContext);

  useEffect(() => {
    setNumberSold(1)
  }, [price])

  const [availablePrices, setAvailablePrices] = useState<{
    erg: number | undefined;
    blitz: number | undefined;
  }>({
    erg: undefined,
    blitz: undefined
  })
  useEffect(() => {
    const erg = derivedPrices.flat().find(dp => dp.tokenId === "0000000000000000000000000000000000000000000000000000000000000000")?.amount
    const blitz = derivedPrices.flat().find(dp => dp.tokenId === "BLITZTOKENID")?.amount
    setAvailablePrices({
      erg, blitz
    })
  }, [derivedPrices])

  const apiFormSubmit = (buyCurrency: string) => {
    if (buyCurrency === 'sigusd') {
      setTotalPrice(numberSold * price)
      setPurchaseCurrency('SigUSD')
      setConfirmationOpen(true)
    }
    else if (buyCurrency === 'erg') {
      if (availablePrices.erg) {
        setTotalPrice(Number((numberSold * availablePrices.erg * 0.000000001).toFixed(2)))
        setPurchaseCurrency('Erg')
        setConfirmationOpen(true)
      }
      else {
        console.log('no erg price set')
      }
    }
    else if (buyCurrency === 'blitz') {
      if (availablePrices.blitz) {
        setTotalPrice(Number((numberSold * availablePrices.blitz).toFixed(2)))
        setPurchaseCurrency('Blitz')
        setConfirmationOpen(true)
      }
      else {
        console.log('no blitz price given')
      }
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          {/* <Card sx={{ background: 'none', border: 'none', p: 0 }}>
        <CardContent sx={{ p: 0 }}> */}
          {price === 0 || status !== "LIVE" ? (
            <Typography>
              Not currently for sale
            </Typography>
          ) : (
            <>
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
                wrap="nowrap"
                sx={{
                  mb: '12px',
                  maxWidth: '100%',
                }}
              >
                <Grid item zeroMinWidth xs>
                  <Box
                    sx={{
                      // mb: '12px'
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 0,
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        lineHeight: 1.3
                      }}
                    >
                      ${(price * numberSold).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs="auto" sx={{ textAlign: 'right' }}>
                  <Box
                    sx={{
                      maxWidth: '180px'
                    }}
                  >
                    <NumberIncrement
                      value={numberSold}
                      setValue={setNumberSold}
                      label="Quantity"
                      name="Quantity"
                    />
                  </Box>
                </Grid>
              </Grid>
              {openNow !== undefined && setOpenNow !== undefined && (
                <FormGroup sx={{ mb: '12px' }}>
                  <FormControlLabel control={
                    <Checkbox
                      checked={openNow}
                      onChange={() => setOpenNow(prevState => !prevState)}
                      inputProps={{ 'aria-label': "Open right away (I don't need the pack tokens)" }}
                    />
                  } label="Open right away (I don't need the pack tokens)" />
                </FormGroup>
              )}

              {/* <Button
                onClick={() => apiFormSubmit(false)}
                fullWidth
                variant="contained"
                disabled={soldOut}
              >
                Buy with {currency}
              </Button> */}

              {!walletAddress
                ? <Box sx={{ textAlign: 'center' }}>
                  <Button variant="contained" onClick={() => setAddWalletModalOpen(true)}>
                    Connect wallet to purchase
                  </Button>
                </Box>
                : <>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        onClick={() => apiFormSubmit('erg')}
                        fullWidth
                        variant="outlined"
                        disabled={soldOut || !availablePrices.erg}
                      >
                        Buy with Erg
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        onClick={() => apiFormSubmit('sigusd')}
                        fullWidth
                        disabled={soldOut}
                        variant="contained"
                      >
                        Buy with SigUSD
                      </Button>
                    </Grid>
                  </Grid>

                  <Button
                    onClick={() => apiFormSubmit('blitz')}
                    fullWidth
                    disabled={soldOut || !availablePrices.blitz}
                    variant="contained"
                  >
                    Buy with Blitz (10% Discount)
                  </Button>
                </>}


              {soldOut && <Box>
                <Typography variant="body2" sx={{ mt: 1, mb: 0 }}>
                  These packs are sold out.
                </Typography>
              </Box>}
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
  )
}

export default DirectSalesCard