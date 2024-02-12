import React, { FC } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import Link from '@components/Link';
import QRCode from 'react-qr-code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface IErgopayProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  walletType: 'mobile' | 'satergo',
  messageSigning: boolean;
  callback: (success: boolean, address: string, verification: string) => void;
}

const Ergopay: FC<IErgopayProps> = () => {
  const baseUrl = `${window.location.host}`;
  const ergopayDomain = `ergopay://${baseUrl}`;

  const link = `${ergopayDomain}/api/ergo-mobile-proof/p2pk?p2pkAddress=#P2PK_ADDRESS#`

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {

      console.log('Link copied to clipboard!');
    }).catch(err => {

      console.error('Failed to copy link: ', err);
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <Typography>
            Scan the QR code or follow <Link href={link}>this link</Link>
            <IconButton onClick={() => copyToClipboard(link)}>
              <ContentCopyIcon sx={{ height: '18px', width: '18px' }} />
            </IconButton>
          </Typography>
        </Box>
        <Box sx={{ background: '#fff', p: 3, mb: 2, borderRadius: '12px' }}>
          <QRCode
            size={180}
            value={link}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Ergopay;