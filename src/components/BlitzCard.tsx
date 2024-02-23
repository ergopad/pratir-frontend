import React, { FC, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Paper,
  Skeleton
} from '@mui/material'
import useResizeObserver from "use-resize-observer";

interface IBlitzCard {
  data: IPackInfo;
}

function resolveIpfs(url: string): string {
  const ipfsPrefix = 'ipfs://';
  if (url.startsWith(ipfsPrefix)) {
    return url.replace(ipfsPrefix, `https://cloudflare-ipfs.com/ipfs/`);
  } else if (url.startsWith('http://')) {
    return 'https://' + url.substring(7);
  }
  return url;
}

const BlitzCard: FC<IBlitzCard> = ({
  data
}) => {
  const { ref, width = 1 } = useResizeObserver<HTMLDivElement>();
  const [newWidth, setNewWidth] = useState(300)

  useEffect(() => {
    setNewWidth(width + 30)
  }, [width])

  const [imageUrl, setImageUrl] = useState('')
  useEffect(() => {
    setImageUrl(resolveIpfs(data.link))
  }, [data])

  return (
    <>
      <Paper
        sx={{
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        <Box>
          <Box ref={ref} sx={{
            height: `${newWidth}px`,
            minHeight: '260px',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            transition: 'height 70ms linear'
          }} />
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
              {data.name}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default BlitzCard;