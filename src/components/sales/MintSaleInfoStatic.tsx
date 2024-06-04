import React, { FC, useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Skeleton,
  Link
} from '@mui/material'
import Grid from '@mui/system/Unstable_Grid/Grid';
import DirectSalesCard from '@components/token/DirectSalesCard';
import PackTokenSelector from '@components/token/PackTokenSelector';
import { formatNumber } from '@lib/utilities/general';
import UserMenu from '@components/user/UserMenu';
import { resolveIpfs } from '@utils/assets';


// Packs or no packs? 
//    a) If packs, are there more than one pack type? 
//        i) Just one type: show collection featured image and display "Open right away"
//        ii) More than one type: pack list with info in place of featured image
//    b) No packs, but its a mint: 
//        - Display collection featured image, 
//        - No "Open right away" displayed
//    c) No packs, its an NFT: display NFT image as featured image. Give token properties as well

const textSx = {
  mb: 0,
  fontSize: '16px',
  lineHeight: 1.25
}

const boldTextSx = {
  mb: 0,
  fontSize: '16px',
  lineHeight: 1.25,
  fontWeight: 700
}

interface JsonObject {
  [key: string]: any;
}

const flattenJSON = (jsonData: JsonObject): JsonObject => {
  const _flattenJSON = (obj: JsonObject = {}, res: JsonObject = {}): JsonObject => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] !== 'object') {
        res[key] = obj[key];
      } else {
        _flattenJSON(obj[key], res);
      }
    });
    return res;
  };
  return _flattenJSON(jsonData);
};

const parseDescription = (description: string) => {
  try {
    return flattenJSON(JSON.parse(description));
  } catch (e) {
    try {
      // parse error some descriptions have unicode escape characters as the first character
      return flattenJSON(JSON.parse(description.slice(1)));
    } catch (e) {
      // description is a string
      return { Description: description ? description : '' };
    }
  }
};

const MintSaleInfoStatic: FC<{
  saleData: ISale;
}> = ({ saleData }) => {
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))
  const [selected, setSelected] = useState<boolean[]>([])
  const [salesProps, setSalesProps] = useState({
    tokenName: '',
    openNow: false,
    price: 0,
    currency: 'Erg',
    saleId: '',
    packId: '',
    soldOut: false,
    status: '',
    startTime: '',
    endTime: ''
  })
  const [featuredImage, setFeaturedImage] = useState('')
  const [openNow, setOpenNow] = useState<boolean>(false)
  const [derivedPrices, setDerivedPrices] = useState<IDerivedPrice[]>([])


  // Utility function to calculate price and determine currency
  const getPriceAndCurrency = (pack: IPack) => {
    const isSigUSD = pack.price[0].tokenId === '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';
    const price = isSigUSD
      ? Number((pack.price[0].amount * 0.01))
      : Number((pack.price[0].amount * 0.000000001))
    const currency = isSigUSD ? 'SigUSD' : 'Erg';

    return { price, currency };
  };

  useEffect(() => {
    if (saleData.packs?.length > 0) {
      const { price, currency } = getPriceAndCurrency(saleData.packs[0]);

      // Set initial selected state
      const initialSelected = saleData.packs.map((_item, i) => i === 0);

      setSelected(initialSelected);

      const initialPackId = openNow && saleData.packs.length >= 3 ? saleData.packs[2].id : saleData.packs[0].id;
      const initialSoldOut = openNow && saleData.packs.length >= 3 ? saleData.packs[2].soldOut : saleData.packs[0].soldOut;
      const initialDerivedPrices = openNow && saleData.packs.length >= 3 ? saleData.packs[2].derivedPrice : saleData.packs[0].derivedPrice

      setDerivedPrices(initialDerivedPrices)

      // console.log(initialDerivedPrices)

      setSalesProps({
        tokenName: saleData.packs[0].name,
        openNow,
        price,
        currency,
        saleId: saleData.id,
        packId: initialPackId,
        soldOut: initialSoldOut,
        status: saleData.status,
        startTime: saleData.startTime,
        endTime: saleData.endTime
      });

      setFeaturedImage(saleData.packs[0].image);
    }
  }, [saleData]);

  useEffect(() => {
    const selectedIndex = selected.findIndex(item => item);
    if (selectedIndex !== -1) {
      const packIndex = selectedIndex * 3;
      if (saleData.packs[packIndex]) {
        const { price, currency } = getPriceAndCurrency(saleData.packs[packIndex]);

        // console.log(saleData.packs[packIndex], price);

        const packId = openNow ? saleData.packs[packIndex + 2]?.id : saleData.packs[packIndex]?.id;
        const soldOut = openNow ? saleData.packs[packIndex + 2]?.soldOut : saleData.packs[packIndex]?.soldOut;
        const currentDerivedPrices = openNow ? saleData.packs[packIndex + 2]?.derivedPrice : saleData.packs[packIndex]?.derivedPrice

        setDerivedPrices(currentDerivedPrices)

        setSalesProps({
          tokenName: saleData.packs[packIndex].name,
          openNow,
          price,
          currency,
          saleId: saleData.id,
          packId,
          soldOut,
          status: saleData.status,
          startTime: saleData.startTime,
          endTime: saleData.endTime
        });

        setFeaturedImage(saleData.packs[packIndex].image);
      }
    }
  }, [selected, saleData, openNow]);

  useEffect(() => {
    console.log(salesProps)
  }, [salesProps])

  return (
    <>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'baseline',
        mb: 2
      }}>
        {/* <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            {saleData.name}
          </Typography>
          <Typography variant="body2">
            {saleData.description}
          </Typography>
        </Box> */}
        <Box>
          <UserMenu />
        </Box>
      </Box>
      <Grid
        container
        spacing={2}
        sx={{ mb: '24px' }}
      >
        <Grid md={6} xs={12}>
          <Paper
            sx={{
              position: 'relative',
              mb: '24px',
              width: '100%',
              transform: 'height 0.2s linear',
            }}
          >
            {featuredImage &&
              <img
                src={
                  salesProps.tokenName.includes("Common Pack 1st Ed Base")
                    ? '/assets/Packs_Common.png'
                    : salesProps.tokenName.includes("Uncommon Pack 1st Ed Base")
                      ? '/assets/Packs_Uncommon.png'
                      : salesProps.tokenName.includes("Rare Pack 1st Ed Base")
                        ? '/assets/Packs_Rare.png'
                        : resolveIpfs(featuredImage)
                }
                height='100%'
                width='100%'
                style={{
                  borderRadius: '8px',
                  lineHeight: 1,
                  display: 'block'
                }}
                alt="image"
                crossOrigin="anonymous"
              />
            }
          </Paper>
        </Grid>
        <Grid md={6} xs={12}>
          {saleData.packs.length > 3 && (
            <>
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h5">
                  Choose a Pack
                </Typography>
                {saleData.packs.filter((_item, i) => i % 3 === 0).map((item, i) => {
                  const packIndex = i * 3
                  return (
                    <PackTokenSelector
                      key={i}
                      index={i}
                      packInfo={saleData.packs[packIndex]}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  )
                })}
              </Paper>
              <Paper sx={{ mb: 2, p: 2, }}>
                <Typography variant="h5">
                  Pack Contents
                </Typography>
                <List dense sx={{ transition: 'height 0.2s ease-out', height: '100%' }}>
                  {saleData.packs.filter((_item, i) => i % 3 === 1).map((pack, index) => {
                    return (
                      <Collapse key={index} in={selected[index]}>
                        {pack.content.map((content, i) => {
                          const totalOdds = content.rarity.reduce(function (tot, arr) {
                            return tot + arr.odds;
                          }, 0);
                          return (
                            <React.Fragment key={`${content.packId}`}>
                              {content.rarity.length === 1 ? (
                                <ListItem>
                                  <Typography>
                                    {content.amount} Randomly Selected {plural('Token', content.amount)}
                                  </Typography>
                                </ListItem>
                              ) : (
                                <>
                                  <ListItem>
                                    <Typography>
                                      {content.amount} {plural('Token', content.amount)} with Custom Probability
                                    </Typography>
                                  </ListItem>
                                  {content.rarity.map((item, i) => {
                                    return (
                                      <ListItem key={i} sx={{ pl: 4 }}>
                                        {formatNumber((item.odds / totalOdds * 100), 1)}% Chance of {item.rarity}
                                      </ListItem>
                                    )
                                  })}
                                </>
                              )
                              }
                            </React.Fragment>
                          )
                        })}
                      </Collapse>
                    )
                  })}
                </List>
              </Paper>
            </>
          )}
          {saleData.packs.length === 3 && saleData.packs[1].content.map((content, i) => {
            const totalOdds = content.rarity.reduce(function (tot, arr) {
              return tot + arr.odds;
            }, 0);
            return (
              <Paper sx={{ mb: 2, p: 2, }} key={i}>
                <Typography variant="h5">
                  Pack Info
                </Typography>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Grid>
                    <Typography sx={boldTextSx}>
                      Pack Name:
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography color="text.secondary" sx={textSx}>
                      {saleData.packs[0].name}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Grid>
                    <Typography sx={boldTextSx}>
                      Pack Contents:
                    </Typography>
                  </Grid>
                  <Grid>
                    {content.rarity.length === 1 &&
                      <Typography color="text.secondary" sx={textSx}>
                        {content.amount} Randomly Selected {plural('Token', content.amount)}
                      </Typography>
                    }
                  </Grid>
                </Grid>
                {content.rarity.length != 1 &&
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemText>
                        {content.amount} {plural('Token', content.amount)} with Custom Probability
                      </ListItemText>
                    </ListItem>
                    {content.rarity.map((item, i) => {
                      return (
                        <ListItem key={i} sx={{ pl: 4 }}>
                          {formatNumber((item.odds / totalOdds * 100), 2)}% Chance of {item.rarity}
                        </ListItem>
                      )
                    })}
                  </List>
                }
              </Paper>
            )
          })}
          <Box sx={{ mb: 3 }}>
            <DirectSalesCard {...salesProps} openNow={openNow} setOpenNow={setOpenNow} derivedPrices={derivedPrices} />
          </Box>
        </Grid>
      </Grid >
    </>
  )
};

export default MintSaleInfoStatic;

const plural = (str: string, num: number) => {
  if (num > 1) return str + 's'
  else return str
}





