import React, { FC, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardActionArea,
  Box,
  Typography,
  useTheme,
  Skeleton,
  Paper
} from '@mui/material'
import Grid2 from '@mui/material/Unstable_Grid2'; // Grid version 2
import Link from '@components/Link';
import { useRouter } from 'next/router'
import { styled } from '@mui/material/styles';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import useResizeObserver from "use-resize-observer";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import HideImageIcon from '@mui/icons-material/HideImage';
import axios from 'axios';
import { getNautilusAddressMapper, ASSET_URL } from "@lib/utilities/LogoMapper";
import { slugify } from '@lib/utilities/general';

// import dynamic from 'next/dynamic'
// const TimeRemaining = dynamic(() => import('@components/TimeRemaining'), {
//   ssr: false,
// });

export interface INftItem {
  imgUrl?: string;
  link: string;
  name: string;
  tokenId: string;
  qty?: number;
  price?: number;
  currency?: string;
  rarity?: string;
  saleType?: 'mint' | 'auction' | 'sale';
  artist?: string;
  artistLink?: string;
  collection?: string;
  collectionLink?: string;
  explicit?: boolean;
  type?: string;
  loading?: boolean;
  remainingVest?: number;
}

interface INftCardCard {
  nftData: INftItem;
  index: number;
  selected: boolean[];
  setSelected: React.Dispatch<React.SetStateAction<boolean[]>>;
}

const NftCardCard: FC<INftCardCard> = ({
  nftData,
  index,
  selected,
  setSelected
}) => {
  const theme = useTheme()

  const handleSelect = () => {
    if (setSelected != undefined && index != undefined) {
      setSelected(prev => {
        const newArray = prev.map((item, i) => {
          if (index === i) {
            return !prev[index]
          }
          return item
        })
        return newArray
      })
    }
  }

  const { ref, width = 1 } = useResizeObserver<HTMLDivElement>();
  const [newWidth, setNewWidth] = useState(300)

  useEffect(() => {
    setNewWidth(width + 30)
  }, [width])

  const [imageUrl, setImageUrl] = useState<string>('')
  useEffect(() => {
    if (nftData.imgUrl) {
      const ipfsPrefix = 'ipfs://';
      const url = nftData.imgUrl
      if (!url.startsWith(ipfsPrefix) && url.startsWith('http://')) setImageUrl('https://' + url.substring(7))
      else if (!url.startsWith(ipfsPrefix)) setImageUrl(url)
      else setImageUrl(url.replace(ipfsPrefix, `https://cloudflare-ipfs.com/ipfs/`))
    }
    else if (nftData.imgUrl) setImageUrl(nftData.imgUrl)
    else setImageUrl('')
  }, [nftData])

  const [assetMapper, setAssetMapper] = useState<any>({});
  useEffect(() => {
    let isMounted = true;
    const loadMapper = async () => {
      const mapper = await getNautilusAddressMapper();
      if (isMounted) setAssetMapper(mapper);
    };
    loadMapper();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Paper
        sx={{
          maxWidth: '100%',
          backgroundColor: selected !== undefined && index !== undefined && selected[index] ?
            theme.palette.divider :
            theme.palette.background.paper,
          transform: selected !== undefined && index !== undefined && selected[index] ?
            "scale3d(0.95, 0.95, 1)" :
            "scale3d(1, 1, 1)",
          transition: "transform 0.15s ease-in-out",
        }}
      >
        <Box
          onClick={() => setSelected != undefined && handleSelect()}
        >
          {nftData.loading ? (
            <>
              <Skeleton variant="rectangular" width={newWidth} height={newWidth} sx={{
                minWidth: '100%',
              }} />
              <CardContent sx={{ position: 'relative' }}>
                <Skeleton variant="text" sx={{ fontSize: '1.27rem' }} />
              </CardContent>
            </>
          ) : (
            <>
              <Box ref={ref} sx={{
                height: `${newWidth}px`,
                minHeight: '260px',
                backgroundImage: imageUrl ? `url(${imageUrl})` : '',
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                transition: 'height 70ms linear'
              }}>
                {nftData.type === 'AUDIO' && (
                  <AudiotrackIcon
                    sx={{
                      position: 'absolute',
                      color: theme.palette.divider,
                      fontSize: '8rem',
                      top: '42%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}
                {nftData.imgUrl === undefined && nftData.type === 'OTHER' && assetMapper[nftData.tokenId] && (
                  <TokenIcon src={ASSET_URL + "/" + assetMapper[nftData.tokenId]}
                    sx={{
                      position: 'absolute',
                      top: '42%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )
                }
                {nftData.imgUrl === undefined && nftData.type != 'AUDIO' && !assetMapper[nftData.tokenId] && (
                  <HideImageIcon
                    sx={{
                      position: 'absolute',
                      color: theme.palette.divider,
                      fontSize: '5rem',
                      top: '42%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}
              </Box>
              {selected !== undefined && index !== undefined && (
                <BpCheckbox
                  sx={{
                    position: 'absolute',
                    top: 1,
                    left: 1,
                  }}
                  checked={selected[index] !== undefined ? selected[index] : false}
                  inputProps={{ 'aria-label': 'selected-nft' }}
                />
              )}
              <Box sx={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                width: width - (width / 3),
                transform: 'translateX(-50%)',
                background: 'rgba(30,35,70,0.8)',
                zIndex: 2,
                p: 1,
                borderRadius: '12px'
              }}>
                <Typography>
                  {nftData.name}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </>
  );
};

function BpCheckbox(props: CheckboxProps) {
  return (
    <Checkbox
      sx={{
        '&:hover': { bgcolor: 'transparent' },
      }}
      disableRipple
      color="default"
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  );
}

const BpIcon = styled('span')(({ theme }) => ({
  borderRadius: 3,
  width: 20,
  height: 20,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 0 0 1px rgb(16 22 26 / 40%)'
      : 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
  backgroundColor: theme.palette.mode === 'dark' ? '#394b59' : '#f5f8fa',
  backgroundImage:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))'
      : 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
  '.Mui-focusVisible &': {
    outline: '2px auto rgba(19,124,189,.6)',
    outlineOffset: 2,
  },
  'input:hover ~ &': {
    backgroundColor: theme.palette.mode === 'dark' ? '#30404d' : '#ebf1f5',
  },
  'input:disabled ~ &': {
    boxShadow: 'none',
    background:
      theme.palette.mode === 'dark' ? 'rgba(57,75,89,.5)' : 'rgba(206,217,224,.5)',
  },
}));

const BpCheckedIcon = styled(BpIcon)(({ theme }) => ({
  backgroundColor: '#00868F',
  backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
  '&:before': {
    display: 'block',
    width: 20,
    height: 20,
    backgroundImage:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
      " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
      "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23fff'/%3E%3C/svg%3E\")",
    content: '""',
  },
  'input:hover ~ &': {
    backgroundColor: '#106ba3',
  },
}));

const TokenIcon = styled("img")(() => ({
  width: "8rem",
  height: "8rem",
  borderRadius: "8px",
}));

export default NftCardCard;