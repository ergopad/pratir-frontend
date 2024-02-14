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
import { trpc } from '@server/utils/trpc';

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

const MintSaleInfo: FC<{
  saleId: string;
}> = (props) => {
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
  const [loading, setLoading] = useState(true)
  const [apiGetSaleById, setApiGetSaleById] = useState<ISale>({
    id: "",
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    sellerWallet: "",
    saleWallet: "",
    status: "",
    packs: [{
      id: "",
      name: "",
      image: "",
      soldOut: false,
      derivedPrice: [],
      price: [
        {
          id: "",
          tokenId: "",
          amount: 1,
          packId: ""
        }
      ],
      content: [
        {
          id: "",
          rarity: [
            {
              odds: 100,
              rarity: ""
            }
          ],
          amount: 1,
          packId: ""
        }
      ]
    }]
  })
  const [openNow, setOpenNow] = useState<boolean>(false)
  const [derivedPrices, setDerivedPrices] = useState<IDerivedPrice[]>([])
  const currentSale = trpc.api.get.useQuery(
    { url: `/sale/${props.saleId}` },
    {
      enabled: !!props.saleId
    }
  )

  useEffect(() => {
    const fetchData = async () => {
      setApiGetSaleById(currentSale.data)
      console.log(currentSale.data)
      setLoading(false)
    }

    if (currentSale.isFetched && !currentSale.isError) fetchData();
  }, [currentSale.isFetched])

  // Utility function to calculate price and determine currency
  const getPriceAndCurrency = (pack: IPack) => {
    const isSigUSD = pack.price[0].tokenId === '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';
    const price = isSigUSD
      ? Number((pack.price[0].amount * 0.01).toFixed(2))
      : Number((pack.price[0].amount * 0.000000001).toFixed(3));
    const currency = isSigUSD ? 'SigUSD' : 'Erg';

    return { price, currency };
  };

  useEffect(() => {
    if (apiGetSaleById?.packs?.length > 0) {
      const { price, currency } = getPriceAndCurrency(apiGetSaleById.packs[0]);

      // Set initial selected state
      const initialSelected = apiGetSaleById.packs.map((_item, i) => i === 0);

      setSelected(initialSelected);

      const initialPackId = openNow && apiGetSaleById.packs.length >= 3 ? apiGetSaleById.packs[2].id : apiGetSaleById.packs[0].id;
      const initialSoldOut = openNow && apiGetSaleById.packs.length >= 3 ? apiGetSaleById.packs[2].soldOut : apiGetSaleById.packs[0].soldOut;
      const initialDerivedPrices = openNow && apiGetSaleById.packs.length >= 3 ? apiGetSaleById.packs[2].derivedPrice : apiGetSaleById.packs[0].derivedPrice

      setDerivedPrices(initialDerivedPrices)

      // console.log(initialDerivedPrices)

      setSalesProps({
        tokenName: apiGetSaleById.packs[0].name,
        openNow,
        price,
        currency,
        saleId: apiGetSaleById.id,
        packId: initialPackId,
        soldOut: initialSoldOut,
        status: apiGetSaleById.status,
        startTime: apiGetSaleById.startTime,
        endTime: apiGetSaleById.endTime
      });

      setFeaturedImage(apiGetSaleById.packs[0].image);
    }
  }, [apiGetSaleById, openNow]);

  useEffect(() => {
    const selectedIndex = selected.findIndex(item => item);
    if (selectedIndex !== -1) {
      const packIndex = selectedIndex * 3;
      if (apiGetSaleById.packs[packIndex]) {
        const { price, currency } = getPriceAndCurrency(apiGetSaleById.packs[packIndex]);

        // console.log(apiGetSaleById.packs[packIndex], price);

        const packId = openNow ? apiGetSaleById.packs[packIndex + 2]?.id : apiGetSaleById.packs[packIndex]?.id;
        const soldOut = openNow ? apiGetSaleById.packs[packIndex + 2]?.soldOut : apiGetSaleById.packs[packIndex]?.soldOut;
        const currentDerivedPrices = openNow ? apiGetSaleById.packs[packIndex + 2]?.derivedPrice : apiGetSaleById.packs[packIndex]?.derivedPrice

        setDerivedPrices(currentDerivedPrices)

        setSalesProps({
          tokenName: apiGetSaleById.packs[packIndex].name,
          openNow,
          price,
          currency,
          saleId: apiGetSaleById.id,
          packId,
          soldOut,
          status: apiGetSaleById.status,
          startTime: apiGetSaleById.startTime,
          endTime: apiGetSaleById.endTime
        });

        setFeaturedImage(apiGetSaleById.packs[packIndex].image);
      }
    }
  }, [selected, apiGetSaleById, openNow]);

  return (
    <>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            {apiGetSaleById.name}
          </Typography>
          <Typography variant="body2">
            {apiGetSaleById.description}
          </Typography>
        </Box>
        <Box>
          <UserMenu />
        </Box>
      </Box>
      <Grid
        container
        spacing={2}
        sx={{ mb: '24px' }}
      >
        <Grid

          md={6}
          xs={12}
        >
          <Paper
            sx={{
              position: 'relative',
              mb: '24px',
              width: '100%',
              transform: 'height 0.2s linear',
            }}
          >
            {loading ?
              <Box
                sx={{
                  width: '100%',
                  pb: '100%',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    height: '100%',
                    width: '100%',
                    borderRadius: '8px',
                  }}
                />
              </Box>
              :
              <>
                {featuredImage && (
                  <>
                    <img
                      src={featuredImage}
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
                  </>
                )}
              </>
            }
          </Paper>

        </Grid>
        <Grid md={6} xs={12}>
          {/* <Card sx={{ mb: 2 }}>
            <CardContent sx={{ pb: '8px!important', zIndex: 2 }}>
              {apiGetSaleById.collection && (
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Grid>
                    <Typography sx={boldTextSx}>
                      Collection:
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography color="text.secondary" sx={textSx}>
                      <Link href={'/collections/' + apiGetSaleById.collection.id}>
                        {apiGetSaleById.collection.name}
                      </Link>
                    </Typography>
                  </Grid>
                </Grid>
              )}
              {apiGetSaleById.artist && (
                <Grid container justifyContent="space-between" sx={{ mb: 1, }}>
                  <Grid xs="auto" sx={{ pr: 3 }}>
                    <Typography sx={boldTextSx}>
                      Artist:
                    </Typography>
                  </Grid>
                  <Grid xs>
                    <Typography color="text.secondary" sx={{ ...textSx, textAlign: 'right' }} noWrap>
                      <Link href={'/users/' + apiGetSaleById.artist.address}>
                        {apiGetSaleById.artist.address}
                      </Link>
                    </Typography>
                  </Grid>
                </Grid>
              )}
              {apiGetSaleById.startTime && (
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Grid>
                    <Typography sx={boldTextSx}>
                      Sale Start:
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography color="text.secondary" sx={textSx}>
                      {dayjs(apiGetSaleById?.startTime).toString()}
                    </Typography>
                  </Grid>
                </Grid>
              )}
              {apiGetSaleById.endTime && (
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Grid>
                    <Typography sx={boldTextSx}>
                      Sale End:
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography color="text.secondary" sx={textSx}>
                      {dayjs(apiGetSaleById?.endTime).toString()}
                    </Typography>
                  </Grid>
                </Grid>
              )}

            </CardContent>
          </Card> */}

          {apiGetSaleById !== undefined && apiGetSaleById.packs.length > 3 && (
            <>
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h5">
                  Choose a pack
                </Typography>
                {apiGetSaleById.packs.filter((_item, i) => i % 3 === 0).map((item, i) => {
                  const packIndex = i * 3
                  return (
                    <PackTokenSelector
                      key={i}
                      index={i}
                      packInfo={apiGetSaleById.packs[packIndex]}
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
                  {apiGetSaleById.packs.filter((_item, i) => i % 3 === 1).map((pack, index) => {
                    return (
                      <Collapse key={index} in={selected[index]}>
                        {pack.content.map((content, i) => {
                          const totalOdds = content.rarity.reduce(function (tot, arr) {
                            return tot + arr.odds;
                          }, 0);
                          return (
                            <React.Fragment key={i}>
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
          {apiGetSaleById !== undefined &&
            apiGetSaleById.packs.length === 3 &&
            (
              apiGetSaleById.packs[1].content.map((content, i) => {
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
                          {apiGetSaleById.packs[0].name}
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
              })
            )}

          <Box sx={{ mb: 3 }}>
            <DirectSalesCard {...salesProps} openNow={openNow} setOpenNow={setOpenNow} derivedPrices={derivedPrices} />
          </Box>

        </Grid>
      </Grid >
    </>
  )
};

export default MintSaleInfo;

const plural = (str: string, num: number) => {
  if (num > 1) return str + 's'
  else return str
}





