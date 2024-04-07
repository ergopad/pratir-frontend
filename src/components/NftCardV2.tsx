import React, { FC, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Paper
} from '@mui/material'
import { styled } from '@mui/material/styles';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import useResizeObserver from "use-resize-observer";
import HideImageIcon from '@mui/icons-material/HideImage';
import { getNautilusAddressMapper, ASSET_URL } from "@lib/utilities/LogoMapper";

export interface INftItemV2 {
  tokenId: string;
  metadata: IPackInfo;
}

interface INftCardCard {
  nftData: INftItemV2;
  index?: number;
  selected?: boolean[];
  setSelected?: React.Dispatch<React.SetStateAction<boolean[]>>;
}

const NftCardV2: FC<INftCardCard> = ({
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
    if (nftData.metadata.link) {
      const ipfsPrefix = 'ipfs://';
      const url = nftData.metadata.link
      if (!url.startsWith(ipfsPrefix) && url.startsWith('http://')) setImageUrl('https://' + url.substring(7))
      else if (!url.startsWith(ipfsPrefix)) setImageUrl(url)
      else setImageUrl(url.replace(ipfsPrefix, `https://cloudflare-ipfs.com/ipfs/`))
    }
    else if (nftData.metadata.link) setImageUrl(nftData.metadata.link)
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
          '&:hover': {
            cursor: 'pointer'
          }
        }}
      >
        <Box
          onClick={() => setSelected != undefined && handleSelect()}
        >
          <Box ref={ref} sx={{
            height: `${newWidth}px`,
            minHeight: '260px',
            backgroundImage: imageUrl ? `url(${imageUrl})` : '',
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            transition: 'height 70ms linear'
          }}>
            {nftData.metadata.link === undefined && !assetMapper[nftData.tokenId] && (
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
              {nftData.metadata.name}
            </Typography>
          </Box>
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

export default NftCardV2;