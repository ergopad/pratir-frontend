import React, { FC, useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import useResizeObserver from 'use-resize-observer';

interface IBlitzCard {
  data: IPackInfo;
}

const BlitzCard: FC<IBlitzCard> = ({ data }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setImageUrl(resolveIpfs(data.link));
  }, [data]);

  // Resolve IPFS link to a usable URL
  function resolveIpfs(url: string): string {
    const ipfsPrefix = 'ipfs://';
    if (url.startsWith(ipfsPrefix)) {
      return url.replace(ipfsPrefix, `https://cloudflare-ipfs.com/ipfs/`);
    } else if (url.startsWith('http://')) {
      return 'https://' + url.substring(7);
    }
    return url;
  }

  return (
    <Paper
      sx={{
        maxWidth: '100%',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        '&:focus': { outline: 'none' }
      }}
      onClick={() => setShowDetails(prev => !prev)}
    >
      <Box sx={{
        paddingTop: 'calc(100% / (1199 / 1831))', // Adjust the aspect ratio here
        background: `url(${imageUrl}) center center / cover no-repeat`,
        transition: 'opacity 0.5s ease',
      }}>
        {showDetails &&
          <Box sx={{ position: 'absolute', top: 0, left: 0, background: '#111111', width: '100%', height: '100%', zIndex: 3, overflowY: 'scroll' }}>
            {<Box sx={{ p: 2 }}>
              <Typography variant="h6">{data.name}</Typography>
              <Typography variant="body2">{data.description}</Typography>
              {data.properties && Object.entries(data.properties).map(([key, value]) => (
                <Typography key={key} variant="body2">{`${key}: ${value}`}</Typography>
              ))}
            </Box>}
          </Box>}
      </Box>
    </Paper>
  );
};

export default BlitzCard;